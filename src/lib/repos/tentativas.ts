import { consultar, consultarUm, executar, marcadores, transacao } from "../db";
import { embaralhar, gerarToken } from "../embaralhar";
import type {
  Avaliacao,
  ItensOrdem,
  Questao,
  QuestaoItem,
  Resposta,
  Tentativa,
  TipoQuestao,
} from "../tipos";
import { listarItens } from "./questoes";

/** "  josé  DA silva " -> "jose da silva", para agrupar o mesmo aluno no relatório. */
export function normalizarNome(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Nome completo: pelo menos duas palavras, só letras e os sinais usuais de nome. */
export function validarNome(nome: string): string | null {
  const limpo = nome.replace(/\s+/g, " ").trim();
  if (limpo.length < 5) return "Digite seu nome completo.";
  if (limpo.split(" ").length < 2) return "Digite o nome e o sobrenome.";
  if (!/^[A-Za-zÀ-ÿ'´`^~\- ]+$/.test(limpo)) return "Use apenas letras no nome.";
  if (limpo.length > 160) return "Nome longo demais.";
  return null;
}

// ---------------------------------------------------------------------------
// Sorteio da ordem dos itens, feito UMA vez, no início da tentativa.
// O resultado é gravado em tentativa_questao.itens_ordem: por isso recarregar
// a página não reembaralha as alternativas.
// ---------------------------------------------------------------------------
export function sortearOrdemItens(
  tipo: TipoQuestao,
  itens: QuestaoItem[],
  embaralharItens: boolean
): ItensOrdem {
  const misturar = <T>(lista: T[]) => (embaralharItens ? embaralhar(lista) : lista);

  if (tipo === "lacunas") {
    const grupos: Record<string, number[]> = {};
    for (const item of itens) {
      const chave = String(item.grupo_lacuna ?? 1);
      (grupos[chave] ??= []).push(item.id);
    }
    for (const chave of Object.keys(grupos)) grupos[chave] = misturar(grupos[chave]);
    return { tipo: "lacunas", grupos };
  }

  if (tipo === "associacao") {
    // As duas colunas são embaralhadas em separado: é o que desfaz o
    // alinhamento visual entre a linha e o seu par.
    return {
      tipo: "associacao",
      esquerda: misturar(itens.map((i) => i.id)),
      direita: misturar(itens.map((i) => i.id)),
    };
  }

  if (tipo === "ordenacao") {
    const ids = itens.map((i) => i.id);
    let sorteada = misturar(ids);
    // Começar já na ordem certa entregaria o ponto de graça.
    if (embaralharItens && ids.length > 1) {
      let tentativas = 0;
      while (sorteada.every((id, i) => id === ids[i]) && tentativas < 10) {
        sorteada = embaralhar(ids);
        tentativas++;
      }
    }
    return { tipo: "lista", ids: sorteada };
  }

  return { tipo: "lista", ids: misturar(itens.map((i) => i.id)) };
}

// ---------------------------------------------------------------------------
// Início da tentativa
// ---------------------------------------------------------------------------

export async function jaRespondeu(avaliacaoId: number, nomeNorm: string): Promise<boolean> {
  const linha = await consultarUm<{ id: number }>(
    "SELECT id FROM tentativa WHERE avaliacao_id = ? AND aluno_nome_norm = ? AND status = 'finalizada' LIMIT 1",
    [avaliacaoId, nomeNorm]
  );
  return !!linha;
}

/** Tentativa ainda aberta do mesmo aluno, para retomar em vez de começar de novo. */
export async function tentativaEmAberto(avaliacaoId: number, nomeNorm: string): Promise<Tentativa | null> {
  return consultarUm<Tentativa>(
    `SELECT * FROM tentativa
      WHERE avaliacao_id = ? AND aluno_nome_norm = ? AND status = 'em_andamento'
      ORDER BY id DESC LIMIT 1`,
    [avaliacaoId, nomeNorm]
  );
}

/**
 * Cria a tentativa e já grava todas as questões na ordem sorteada para este
 * aluno. Tudo numa transação: ou nasce a prova inteira, ou nada é gravado.
 */
export async function iniciarTentativa(
  avaliacao: Avaliacao,
  nomeAluno: string,
  ip: string | null,
  userAgent: string | null
): Promise<string> {
  const linhas = await consultar<{ questao_id: number; pontos: number; tipo: TipoQuestao; embaralhar_itens: number }>(
    `SELECT aq.questao_id,
            COALESCE(aq.pontos, q.pontos) AS pontos,
            q.tipo, q.embaralhar_itens
       FROM avaliacao_questao aq
       JOIN questao q ON q.id = aq.questao_id
      WHERE aq.avaliacao_id = ?
      ORDER BY aq.ordem, aq.id`,
    [avaliacao.id]
  );

  if (!linhas.length) throw new Error("Esta avaliação ainda não tem questões.");

  const itensPorQuestao = new Map<number, QuestaoItem[]>();
  for (const item of await listarItens(linhas.map((l) => l.questao_id))) {
    const lista = itensPorQuestao.get(item.questao_id);
    if (lista) lista.push(item);
    else itensPorQuestao.set(item.questao_id, [item]);
  }

  const sorteadas = avaliacao.embaralhar_questoes ? embaralhar(linhas) : linhas;
  const token = gerarToken();
  const pontosPossiveis = sorteadas.reduce((soma, l) => soma + Number(l.pontos), 0);

  await transacao(async (cx) => {
    const [r] = await cx.execute(
      `INSERT INTO tentativa (avaliacao_id, aluno_nome, aluno_nome_norm, token, total_questoes,
                              pontos_possiveis, ip, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        avaliacao.id,
        nomeAluno,
        normalizarNome(nomeAluno),
        token,
        sorteadas.length,
        pontosPossiveis,
        ip,
        userAgent?.slice(0, 255) ?? null,
      ]
    );
    const tentativaId = (r as { insertId: number }).insertId;

    for (let i = 0; i < sorteadas.length; i++) {
      const linha = sorteadas[i];
      const itens = itensPorQuestao.get(linha.questao_id) ?? [];
      const ordemItens = sortearOrdemItens(
        linha.tipo,
        itens,
        avaliacao.embaralhar_alternativas === 1 && linha.embaralhar_itens === 1
      );
      await cx.execute(
        `INSERT INTO tentativa_questao (tentativa_id, questao_id, ordem, itens_ordem, pontos)
         VALUES (?, ?, ?, ?, ?)`,
        [tentativaId, linha.questao_id, i + 1, JSON.stringify(ordemItens), linha.pontos]
      );
    }
  });

  return token;
}

// ---------------------------------------------------------------------------
// Durante a prova
// ---------------------------------------------------------------------------

export type TentativaComAvaliacao = Tentativa & { avaliacao: Avaliacao & { uc_nome: string } };

export async function obterPorToken(token: string): Promise<TentativaComAvaliacao | null> {
  const tentativa = await consultarUm<Tentativa>("SELECT * FROM tentativa WHERE token = ?", [token]);
  if (!tentativa) return null;
  const avaliacao = await consultarUm<Avaliacao & { uc_nome: string }>(
    "SELECT a.*, u.nome AS uc_nome FROM avaliacao a JOIN uc u ON u.id = a.uc_id WHERE a.id = ?",
    [tentativa.avaliacao_id]
  );
  if (!avaliacao) return null;
  return { ...tentativa, avaliacao };
}

export type QuestaoDaTentativa = {
  tentativa_questao_id: number;
  ordem: number;
  pontos: number;
  respondida: number;
  correta: number | null;
  pontos_obtidos: number;
  questao: Questao;
  itens: QuestaoItem[];
  itensOrdem: ItensOrdem;
};

export async function carregarQuestao(tentativaId: number, ordem: number): Promise<QuestaoDaTentativa | null> {
  const tq = await consultarUm<{
    id: number;
    questao_id: number;
    ordem: number;
    itens_ordem: string | null;
    pontos: number;
    respondida: number;
    correta: number | null;
    pontos_obtidos: number;
  }>("SELECT * FROM tentativa_questao WHERE tentativa_id = ? AND ordem = ?", [tentativaId, ordem]);
  if (!tq) return null;

  const questao = await consultarUm<Questao>("SELECT * FROM questao WHERE id = ?", [tq.questao_id]);
  if (!questao) return null;

  const itens = await listarItens([tq.questao_id]);
  const itensOrdem: ItensOrdem = tq.itens_ordem
    ? (JSON.parse(tq.itens_ordem) as ItensOrdem)
    : { tipo: "lista", ids: itens.map((i) => i.id) };

  return {
    tentativa_questao_id: tq.id,
    ordem: tq.ordem,
    pontos: Number(tq.pontos),
    respondida: tq.respondida,
    correta: tq.correta,
    pontos_obtidos: Number(tq.pontos_obtidos),
    questao,
    itens,
    itensOrdem,
  };
}

/** Grava a resposta do aluno e o resultado da correção, substituindo o que houvesse. */
export async function registrarResposta(
  tentativaQuestaoId: number,
  resposta: Resposta,
  correta: boolean,
  pontosObtidos: number
): Promise<void> {
  await transacao(async (cx) => {
    await cx.execute("DELETE FROM tentativa_resposta WHERE tentativa_questao_id = ?", [tentativaQuestaoId]);

    const inserir = (itemId: number | null, valor: number | null, grupo: number | null) =>
      cx.execute(
        "INSERT INTO tentativa_resposta (tentativa_questao_id, item_id, valor, grupo_lacuna) VALUES (?, ?, ?, ?)",
        [tentativaQuestaoId, itemId, valor, grupo]
      );

    switch (resposta.tipo) {
      case "unica":
        if (resposta.itemId) await inserir(resposta.itemId, null, null);
        break;
      case "varias":
        for (const id of resposta.itemIds) await inserir(id, null, null);
        break;
      case "lacunas":
        for (const [grupo, itemId] of Object.entries(resposta.escolhas)) {
          await inserir(itemId, null, Number(grupo));
        }
        break;
      case "ordenacao":
        for (let i = 0; i < resposta.ordem.length; i++) await inserir(resposta.ordem[i], i + 1, null);
        break;
      case "associacao":
        for (const [itemId, escolhido] of Object.entries(resposta.pares)) {
          await inserir(Number(itemId), escolhido, null);
        }
        break;
    }

    await cx.execute(
      `UPDATE tentativa_questao
          SET respondida = 1, respondida_em = NOW(), correta = ?, pontos_obtidos = ?
        WHERE id = ?`,
      [correta ? 1 : 0, pontosObtidos, tentativaQuestaoId]
    );
  });
}

export async function marcarQuestaoAtual(tentativaId: number, ordem: number): Promise<void> {
  // GREATEST evita que voltar uma questão faça o ponteiro retroceder.
  await executar("UPDATE tentativa SET questao_atual = GREATEST(questao_atual, ?) WHERE id = ?", [ordem, tentativaId]);
}

/** Soma os pontos, calcula a nota de 0 a 10 e fecha a tentativa. */
export async function finalizar(tentativaId: number, expirada = false): Promise<void> {
  await executar(
    `UPDATE tentativa t
        SET t.status = ?,
            t.finalizada_em = NOW(),
            t.acertos = (SELECT COUNT(*) FROM tentativa_questao q
                          WHERE q.tentativa_id = t.id AND q.correta = 1),
            t.pontos_obtidos = (SELECT COALESCE(SUM(q.pontos_obtidos), 0) FROM tentativa_questao q
                                 WHERE q.tentativa_id = t.id),
            t.nota = CASE WHEN t.pontos_possiveis > 0
                          THEN ROUND((SELECT COALESCE(SUM(q.pontos_obtidos), 0) FROM tentativa_questao q
                                       WHERE q.tentativa_id = t.id) / t.pontos_possiveis * 10, 2)
                          ELSE 0 END
      WHERE t.id = ? AND t.status = 'em_andamento'`,
    [expirada ? "expirada" : "finalizada", tentativaId]
  );
}

/** Tempo limite estourado? Checado no servidor, não só pelo cronômetro do navegador. */
export function tempoEsgotado(tentativa: Tentativa, avaliacao: Avaliacao): boolean {
  if (!avaliacao.tempo_limite_min) return false;
  const fim = new Date(tentativa.iniciada_em).getTime() + avaliacao.tempo_limite_min * 60_000;
  return Date.now() > fim;
}

// ---------------------------------------------------------------------------
// Resultado e relatórios
// ---------------------------------------------------------------------------

export type LinhaGabarito = {
  ordem: number;
  correta: number | null;
  respondida: number;
  pontos: number;
  pontos_obtidos: number;
  questao: Questao;
  itens: QuestaoItem[];
  marcados: Array<{ item_id: number | null; valor: number | null; grupo_lacuna: number | null }>;
};

export async function montarGabarito(tentativaId: number): Promise<LinhaGabarito[]> {
  const tqs = await consultar<{
    id: number;
    questao_id: number;
    ordem: number;
    correta: number | null;
    respondida: number;
    pontos: number;
    pontos_obtidos: number;
  }>("SELECT * FROM tentativa_questao WHERE tentativa_id = ? ORDER BY ordem", [tentativaId]);
  if (!tqs.length) return [];

  const questaoIds = tqs.map((t) => t.questao_id);
  const questoes = await consultar<Questao>(
    `SELECT * FROM questao WHERE id IN (${marcadores(questaoIds.length)})`,
    questaoIds
  );
  const itens = await listarItens(questaoIds);
  const respostas = await consultar<{
    tentativa_questao_id: number;
    item_id: number | null;
    valor: number | null;
    grupo_lacuna: number | null;
  }>(
    `SELECT * FROM tentativa_resposta WHERE tentativa_questao_id IN (${marcadores(tqs.length)}) ORDER BY id`,
    tqs.map((t) => t.id)
  );

  return tqs.map((tq) => ({
    ordem: tq.ordem,
    correta: tq.correta,
    respondida: tq.respondida,
    pontos: Number(tq.pontos),
    pontos_obtidos: Number(tq.pontos_obtidos),
    questao: questoes.find((q) => q.id === tq.questao_id)!,
    itens: itens.filter((i) => i.questao_id === tq.questao_id),
    marcados: respostas.filter((r) => r.tentativa_questao_id === tq.id),
  }));
}

export type LinhaRelatorio = Tentativa & { duracao_min: number | null };

export async function tentativasDaAvaliacao(avaliacaoId: number): Promise<LinhaRelatorio[]> {
  return consultar<LinhaRelatorio>(
    `SELECT t.*,
            CASE WHEN t.finalizada_em IS NULL THEN NULL
                 ELSE ROUND(TIMESTAMPDIFF(SECOND, t.iniciada_em, t.finalizada_em) / 60, 1) END AS duracao_min
       FROM tentativa t
      WHERE t.avaliacao_id = ?
      ORDER BY t.aluno_nome, t.id`,
    [avaliacaoId]
  );
}

export type EstatisticaQuestao = {
  questao_id: number;
  enunciado: string;
  tipo: TipoQuestao;
  respondidas: number;
  acertos: number;
  percentual: number;
};

/** Percentual de acerto por questão: revela a questão mal formulada. */
export async function estatisticasPorQuestao(avaliacaoId: number): Promise<EstatisticaQuestao[]> {
  return consultar<EstatisticaQuestao>(
    `SELECT q.id AS questao_id, q.enunciado, q.tipo,
            COUNT(tq.id) AS respondidas,
            COALESCE(SUM(tq.correta = 1), 0) AS acertos,
            CASE WHEN COUNT(tq.id) = 0 THEN 0
                 ELSE ROUND(COALESCE(SUM(tq.correta = 1), 0) / COUNT(tq.id) * 100) END AS percentual
       FROM avaliacao_questao aq
       JOIN questao q ON q.id = aq.questao_id
       LEFT JOIN tentativa_questao tq ON tq.questao_id = q.id
            AND tq.respondida = 1
            AND tq.tentativa_id IN (SELECT id FROM tentativa WHERE avaliacao_id = ? AND status <> 'em_andamento')
      WHERE aq.avaliacao_id = ?
      GROUP BY q.id, q.enunciado, q.tipo
      ORDER BY percentual ASC, q.id`,
    [avaliacaoId, avaliacaoId]
  );
}

export async function excluirTentativa(id: number): Promise<void> {
  await executar("DELETE FROM tentativa WHERE id = ?", [id]);
}
