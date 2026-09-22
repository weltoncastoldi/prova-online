import mysql, { type Pool, type PoolConnection, type ResultSetHeader, type RowDataPacket } from "mysql2/promise";

/**
 * Unico ponto de acesso ao MySQL.
 *
 * Trocar de ambiente (Docker local -> Hostinger) e so mudar as variaveis de
 * ambiente: nenhum outro arquivo conhece host, usuario ou senha.
 */

declare global {
  // Em dev o Next recarrega os modulos a cada alteracao; sem isto abririamos
  // um pool novo a cada hot reload ate estourar as conexoes do MySQL.
  var __poolProva: Pool | undefined;
}

function criarPool(): Pool {
  return mysql.createPool({
    host: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? "root",
    password: process.env.DB_PASSWORD ?? "",
    database: process.env.DB_NAME ?? "prova_online",
    charset: "utf8mb4_unicode_ci",
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_POOL_LIMIT ?? 10),
    queueLimit: 0,
    // Toda coluna DATETIME é lida e escrita como UTC, independentemente do
    // fuso do servidor onde o app roda. A conversão para o fuso da escola
    // acontece só na tela, em src/lib/datas.ts. Sem isto, o mesmo horário
    // significava coisas diferentes no Docker e na Hostinger.
    timezone: "Z",
    // Devolve DECIMAL como number em vez de string, para nao ter que
    // converter nota e pontos em cada consulta.
    decimalNumbers: true,
  });
}

export function pool(): Pool {
  if (!global.__poolProva) global.__poolProva = criarPool();
  return global.__poolProva;
}

/** Consulta que devolve varias linhas. */
export async function consultar<T = RowDataPacket>(sql: string, params: unknown[] = []): Promise<T[]> {
  const [linhas] = await pool().query<RowDataPacket[]>(sql, params);
  return linhas as T[];
}

/** Consulta que devolve a primeira linha, ou null. */
export async function consultarUm<T = RowDataPacket>(sql: string, params: unknown[] = []): Promise<T | null> {
  const linhas = await consultar<T>(sql, params);
  return linhas[0] ?? null;
}

/** INSERT / UPDATE / DELETE. */
export async function executar(sql: string, params: unknown[] = []): Promise<ResultSetHeader> {
  // O tipo de `execute` no mysql2 é mais estreito que a lista heterogênea que
  // montamos nos repositórios; os valores em si são sempre primitivos ou Date.
  const [resultado] = await pool().execute<ResultSetHeader>(sql, params as never);
  return resultado;
}

/**
 * Executa um bloco dentro de uma transacao, com rollback automatico em erro.
 * Usado ao criar uma tentativa: ou nascem a tentativa e as 30 questoes
 * sorteadas, ou nao nasce nada.
 */
export async function transacao<T>(bloco: (cx: PoolConnection) => Promise<T>): Promise<T> {
  const cx = await pool().getConnection();
  try {
    await cx.beginTransaction();
    const resultado = await bloco(cx);
    await cx.commit();
    return resultado;
  } catch (erro) {
    await cx.rollback();
    throw erro;
  } finally {
    cx.release();
  }
}

/** Monta "?, ?, ?" para clausulas IN, que o mysql2 nao expande sozinho. */
export function marcadores(quantidade: number): string {
  return Array.from({ length: quantidade }, () => "?").join(", ");
}
