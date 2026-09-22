/**
 * Aplica as migrações pendentes de db/migrations.
 *
 * Roda sozinho em três momentos:
 *   - npm run build  (postbuild)  -> é o que cobre o deploy na Hostinger
 *   - npm start      (prestart)   -> cobre quem inicia o app direto
 *   - docker compose up           -> o contêiner chama antes do next dev
 *
 * É seguro rodar quantas vezes quiser: cada arquivo é aplicado uma única vez
 * e o registro fica na tabela `migracao`.
 *
 * Uso manual:  npm run migrar
 */

import { readFile, readdir } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import mysql from "mysql2/promise";

const PASTA = path.join(process.cwd(), "db", "migrations");
const NOME_TRAVA = "prova_online_migracao";

/**
 * Com --opcional, não conseguir FALAR com o banco é apenas um aviso.
 * É o modo usado no postbuild: buildar sem acesso ao banco é situação normal
 * (build no GitHub Actions, build na sua máquina). O prestart roda sem a flag
 * e aí a conexão passa a ser obrigatória, no momento em que ela realmente
 * importa: antes de o servidor atender o primeiro aluno.
 *
 * Migração com erro de SQL derruba o processo nos dois modos.
 */
const OPCIONAL = process.argv.includes("--opcional");

// --- .env ------------------------------------------------------------------
// Este script roda fora do Next, que é quem normalmente carrega o .env.
// Na Hostinger as variáveis vêm do painel e este trecho não faz nada.
function carregarEnvLocal() {
  const arquivo = path.join(process.cwd(), ".env");
  if (!existsSync(arquivo) || process.env.DB_NAME) return;
  try {
    const conteudo = readFileSync(arquivo, "utf8");
    for (const linha of conteudo.split("\n")) {
      const achado = linha.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/i);
      if (!achado) continue;
      const valor = achado[2].replace(/^["']|["']$/g, "");
      process.env[achado[1]] ??= valor;
    }
  } catch {
    /* .env ilegível não é motivo para abortar */
  }
}

// --- conexão ---------------------------------------------------------------

async function conectar() {
  const config = {
    host: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD ?? "",
    database: process.env.DB_NAME,
    charset: "utf8mb4_unicode_ci",
    // Os arquivos têm vários comandos e há ponto e vírgula dentro dos trechos
    // de código das questões. Deixar o próprio MySQL separar é o único jeito
    // correto: dividir a string no ";" quebraria os enunciados.
    multipleStatements: true,
  };

  // O banco pode ainda estar subindo (Docker) ou aceitando conexões (Hostinger).
  const tentativas = OPCIONAL ? 2 : 10;
  let ultimoErro;
  for (let tentativa = 1; tentativa <= tentativas; tentativa++) {
    try {
      return await mysql.createConnection(config);
    } catch (erro) {
      ultimoErro = erro;
      if (tentativa < tentativas) {
        console.log(`  banco ainda não respondeu (tentativa ${tentativa}/${tentativas})...`);
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
  }
  throw ultimoErro;
}

// --- execução --------------------------------------------------------------

async function principal() {
  carregarEnvLocal();

  if (!process.env.DB_NAME || !process.env.DB_USER) {
    // Acontece quando o build roda no GitHub Actions, sem acesso ao banco.
    // Não é erro: o app aplicará as migrações quando iniciar com credenciais.
    console.log("[migrar] Sem credenciais de banco (DB_NAME/DB_USER). Nada a fazer.");
    return;
  }

  if (!existsSync(PASTA)) {
    console.log(`[migrar] Pasta ${PASTA} não encontrada. Nada a fazer.`);
    return;
  }

  const arquivos = (await readdir(PASTA)).filter((n) => n.endsWith(".sql")).sort();
  if (!arquivos.length) {
    console.log("[migrar] Nenhuma migração encontrada.");
    return;
  }

  let cx;
  try {
    cx = await conectar();
  } catch (erro) {
    if (OPCIONAL) {
      console.log(
        `[migrar] Banco fora de alcance agora (${erro.code ?? erro.message}).\n` +
          "          Sem problema: as migrações serão aplicadas quando o app iniciar."
      );
      return;
    }
    throw erro;
  }

  let travaObtida = false;

  try {
    await cx.query(`
      CREATE TABLE IF NOT EXISTS migracao (
        nome        VARCHAR(190) NOT NULL,
        aplicada_em DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (nome)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Impede que dois processos (build e boot, por exemplo) apliquem junto.
    const [trava] = await cx.query("SELECT GET_LOCK(?, 60) AS obtida", [NOME_TRAVA]);
    if (trava[0]?.obtida !== 1) {
      console.log("[migrar] Outro processo está migrando agora. Saindo sem fazer nada.");
      return;
    }
    travaObtida = true;

    const [linhas] = await cx.query("SELECT nome FROM migracao");
    const aplicadas = new Set(linhas.map((l) => l.nome));
    const pendentes = arquivos.filter((nome) => !aplicadas.has(nome));

    if (!pendentes.length) {
      console.log(`[migrar] Banco em dia (${aplicadas.size} migrações aplicadas).`);
      return;
    }

    console.log(`[migrar] ${pendentes.length} migração(ões) pendente(s).`);

    for (const nome of pendentes) {
      const sql = await readFile(path.join(PASTA, nome), "utf8");
      process.stdout.write(`  aplicando ${nome} ... `);
      try {
        await cx.query(sql);
        await cx.query("INSERT INTO migracao (nome) VALUES (?)", [nome]);
        console.log("ok");
      } catch (erro) {
        console.log("FALHOU");
        console.error(`\n[migrar] Erro em ${nome}:\n  ${erro.message}\n`);
        // Não marca como aplicada e não segue para a próxima: migração
        // pela metade com as seguintes por cima é pior do que parar aqui.
        throw erro;
      }
    }

    console.log("[migrar] Concluído.");
  } finally {
    if (travaObtida) await cx.query("SELECT RELEASE_LOCK(?)", [NOME_TRAVA]).catch(() => {});
    await cx.end().catch(() => {});
  }
}

principal().catch((erro) => {
  console.error("[migrar] Falhou:", erro.message);
  process.exit(1);
});
