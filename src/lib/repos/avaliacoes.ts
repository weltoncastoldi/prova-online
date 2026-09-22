import { consultar, consultarUm, executar, marcadores, transacao } from "../db";
import type { Avaliacao, ExibirResultado, StatusAvaliacao } from "../tipos";

export type AvaliacaoNaLista = Avaliacao & {
  uc_nome: string;
  total_questoes: number;
  total_tentativas: number;
  finalizadas: number;
};

export async function listarAvaliacoes(ucId?: number | null): Promise<AvaliacaoNaLista[]> {
  const condicao = ucId ? "WHERE a.uc_id = ?" : "";
  return consultar<AvaliacaoNaLista>(
    `SELECT a.*, u.nome AS uc_nome,
            (SELECT COUNT(*) FROM avaliacao_questao aq WHERE aq.avaliacao_id = a.id) AS total_questoes,
            (SELECT COUNT(*) FROM tentativa t WHERE t.avaliacao_id = a.id)           AS total_tentativas,
            (SELECT COUNT(*) FROM tentativa t WHERE t.avaliacao_id = a.id
                                                AND t.status = 'finalizada')         AS finalizadas
       FROM avaliacao a
       JOIN uc u ON u.id = a.uc_id
       ${condicao}
      ORDER BY a.criado_em DESC`,
    ucId ? [ucId] : []
  );
}

export async function obterAvaliacao(id: number): Promise<(Avaliacao & { uc_nome: string }) | null> {
  return consultarUm<Avaliacao & { uc_nome: string }>(
    "SELECT a.*, u.nome AS uc_nome FROM avaliacao a JOIN uc u ON u.id = a.uc_id WHERE a.id = ?",
    [id]
  );
}

export async function obterAvaliacaoPorSlug(slug: string): Promise<(Avaliacao & { uc_nome: string }) | null> {
  return consultarUm<Avaliacao & { uc_nome: string }>(
    "SELECT a.*, u.nome AS uc_nome FROM avaliacao a JOIN uc u ON u.id = a.uc_id WHERE a.slug = ?",
    [slug]
  );
}

/** Avaliações que o aluno pode abrir agora, para a página inicial. */
export async function listarPublicadas(): Promise<AvaliacaoNaLista[]> {
  return consultar<AvaliacaoNaLista>(
    `SELECT a.*, u.nome AS uc_nome,
            (SELECT COUNT(*) FROM avaliacao_questao aq WHERE aq.avaliacao_id = a.id) AS total_questoes,
            0 AS total_tentativas, 0 AS finalizadas
       FROM avaliacao a
       JOIN uc u ON u.id = a.uc_id
      WHERE a.status = 'publicada'
        AND (a.abre_em  IS NULL OR a.abre_em  <= NOW())
        AND (a.fecha_em IS NULL OR a.fecha_em >= NOW())
      ORDER BY a.titulo`
  );
}

export type DadosAvaliacao = {
  uc_id: number;
  titulo: string;
  descricao: string | null;
  instrucoes: string | null;
  slug: string;
  embaralhar_questoes: number;
  embaralhar_alternativas: number;
  tempo_limite_min: number | null;
  exibir_resultado: ExibirResultado;
  nota_minima: number;
  permite_voltar: number;
  tentativa_unica: number;
  abre_em: string | null;
  fecha_em: string | null;
  status: StatusAvaliacao;
};

export async function criarAvaliacao(dados: DadosAvaliacao, professorId: number): Promise<number> {
  const r = await executar(
    `INSERT INTO avaliacao (uc_id, titulo, descricao, instrucoes, slug, embaralhar_questoes,
                            embaralhar_alternativas, tempo_limite_min, exibir_resultado, nota_minima,
                            permite_voltar, tentativa_unica, abre_em, fecha_em, status, criado_por)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      dados.uc_id, dados.titulo, dados.descricao, dados.instrucoes, dados.slug,
      dados.embaralhar_questoes, dados.embaralhar_alternativas, dados.tempo_limite_min,
      dados.exibir_resultado, dados.nota_minima, dados.permite_voltar, dados.tentativa_unica,
      dados.abre_em, dados.fecha_em, dados.status, professorId,
    ]
  );
  return r.insertId;
}

export async function atualizarAvaliacao(id: number, dados: DadosAvaliacao): Promise<void> {
  await executar(
    `UPDATE avaliacao SET uc_id = ?, titulo = ?, descricao = ?, instrucoes = ?, slug = ?,
                          embaralhar_questoes = ?, embaralhar_alternativas = ?, tempo_limite_min = ?,
                          exibir_resultado = ?, nota_minima = ?, permite_voltar = ?, tentativa_unica = ?,
                          abre_em = ?, fecha_em = ?, status = ?
      WHERE id = ?`,
    [
      dados.uc_id, dados.titulo, dados.descricao, dados.instrucoes, dados.slug,
      dados.embaralhar_questoes, dados.embaralhar_alternativas, dados.tempo_limite_min,
      dados.exibir_resultado, dados.nota_minima, dados.permite_voltar, dados.tentativa_unica,
      dados.abre_em, dados.fecha_em, dados.status, id,
    ]
  );
}

export async function excluirAvaliacao(id: number): Promise<void> {
  await executar("DELETE FROM avaliacao WHERE id = ?", [id]);
}

export async function slugDisponivel(slug: string, ignorarId: number | null): Promise<boolean> {
  const linha = await consultarUm<{ id: number }>(
    "SELECT id FROM avaliacao WHERE slug = ? AND id <> ? LIMIT 1",
    [slug, ignorarId ?? 0]
  );
  return !linha;
}

// --- Questões da avaliação -------------------------------------------------

export async function idsDasQuestoes(avaliacaoId: number): Promise<number[]> {
  const linhas = await consultar<{ questao_id: number }>(
    "SELECT questao_id FROM avaliacao_questao WHERE avaliacao_id = ? ORDER BY ordem, id",
    [avaliacaoId]
  );
  return linhas.map((l) => l.questao_id);
}

export async function contarQuestoes(avaliacaoId: number): Promise<number> {
  const linha = await consultarUm<{ total: number }>(
    "SELECT COUNT(*) AS total FROM avaliacao_questao WHERE avaliacao_id = ?",
    [avaliacaoId]
  );
  return linha?.total ?? 0;
}

/** Substitui o conjunto de questões da avaliação pelo que veio da tela de montagem. */
export async function definirQuestoes(avaliacaoId: number, questaoIds: number[]): Promise<void> {
  await transacao(async (cx) => {
    if (questaoIds.length) {
      await cx.execute(
        `DELETE FROM avaliacao_questao
          WHERE avaliacao_id = ? AND questao_id NOT IN (${marcadores(questaoIds.length)})`,
        [avaliacaoId, ...questaoIds]
      );
      for (let i = 0; i < questaoIds.length; i++) {
        await cx.execute(
          `INSERT INTO avaliacao_questao (avaliacao_id, questao_id, ordem)
           VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE ordem = VALUES(ordem)`,
          [avaliacaoId, questaoIds[i], i + 1]
        );
      }
    } else {
      await cx.execute("DELETE FROM avaliacao_questao WHERE avaliacao_id = ?", [avaliacaoId]);
    }
  });
}
