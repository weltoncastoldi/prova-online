import { consultar, consultarUm, executar, marcadores, transacao } from "../db";
import type { Dificuldade, Questao, QuestaoCompleta, QuestaoItem, TipoQuestao } from "../tipos";

export type FiltroQuestoes = {
  ucId: number;
  topicoId?: number | null;
  tipo?: TipoQuestao | null;
  dificuldade?: Dificuldade | null;
  busca?: string | null;
  apenasAtivas?: boolean;
};

export type QuestaoNaLista = Questao & {
  topico_nome: string | null;
  total_itens: number;
  usos: number; // em quantas avaliações a questão já está
};

export async function listarQuestoes(filtro: FiltroQuestoes): Promise<QuestaoNaLista[]> {
  const condicoes: string[] = ["q.uc_id = ?"];
  const params: unknown[] = [filtro.ucId];

  if (filtro.topicoId) {
    condicoes.push("q.topico_id = ?");
    params.push(filtro.topicoId);
  }
  if (filtro.tipo) {
    condicoes.push("q.tipo = ?");
    params.push(filtro.tipo);
  }
  if (filtro.dificuldade) {
    condicoes.push("q.dificuldade = ?");
    params.push(filtro.dificuldade);
  }
  if (filtro.busca) {
    condicoes.push("(q.enunciado LIKE ? OR q.contexto LIKE ? OR q.codigo LIKE ?)");
    const alvo = `%${filtro.busca}%`;
    params.push(alvo, alvo, alvo);
  }
  if (filtro.apenasAtivas) condicoes.push("q.ativa = 1");

  return consultar<QuestaoNaLista>(
    `SELECT q.*, t.nome AS topico_nome,
            (SELECT COUNT(*) FROM questao_item i      WHERE i.questao_id = q.id) AS total_itens,
            (SELECT COUNT(*) FROM avaliacao_questao a WHERE a.questao_id = q.id) AS usos
       FROM questao q
       LEFT JOIN topico t ON t.id = q.topico_id
      WHERE ${condicoes.join(" AND ")}
      ORDER BY q.id DESC`,
    params
  );
}

export async function obterQuestao(id: number): Promise<QuestaoCompleta | null> {
  const questao = await consultarUm<Questao & { topico_nome: string | null }>(
    `SELECT q.*, t.nome AS topico_nome
       FROM questao q LEFT JOIN topico t ON t.id = q.topico_id
      WHERE q.id = ?`,
    [id]
  );
  if (!questao) return null;
  const itens = await listarItens([id]);
  return { ...questao, itens };
}

export async function listarItens(questaoIds: number[]): Promise<QuestaoItem[]> {
  if (!questaoIds.length) return [];
  return consultar<QuestaoItem>(
    `SELECT * FROM questao_item
      WHERE questao_id IN (${marcadores(questaoIds.length)})
      ORDER BY questao_id, grupo_lacuna, ordem, id`,
    questaoIds
  );
}

export type DadosQuestao = {
  uc_id: number;
  topico_id: number | null;
  tipo: TipoQuestao;
  dificuldade: Dificuldade;
  contexto: string | null;
  enunciado: string;
  codigo: string | null;
  codigo_linguagem: string;
  explicacao: string | null;
  pontos: number;
  embaralhar_itens: number;
  ativa: number;
};

export type ItemEnviado = {
  id: number | null; // null = item novo
  texto: string;
  texto_par: string | null;
  correta: number;
  posicao_correta: number | null;
  grupo_lacuna: number | null;
  ordem: number;
};

/**
 * Grava a questão e seus itens numa transação.
 *
 * Os itens existentes são atualizados pelo id em vez de apagados e recriados:
 * tentativa_resposta aponta para questao_item, e recriar os itens apagaria em
 * cascata as respostas de provas já realizadas.
 */
export async function salvarQuestao(
  id: number | null,
  dados: DadosQuestao,
  itens: ItemEnviado[]
): Promise<number> {
  return transacao(async (cx) => {
    let questaoId = id;

    if (questaoId) {
      await cx.execute(
        `UPDATE questao SET topico_id = ?, tipo = ?, dificuldade = ?, contexto = ?, enunciado = ?,
                            codigo = ?, codigo_linguagem = ?, explicacao = ?, pontos = ?,
                            embaralhar_itens = ?, ativa = ?
          WHERE id = ?`,
        [
          dados.topico_id, dados.tipo, dados.dificuldade, dados.contexto, dados.enunciado,
          dados.codigo, dados.codigo_linguagem, dados.explicacao, dados.pontos,
          dados.embaralhar_itens, dados.ativa, questaoId,
        ]
      );
    } else {
      const [r] = await cx.execute(
        `INSERT INTO questao (uc_id, topico_id, tipo, dificuldade, contexto, enunciado,
                              codigo, codigo_linguagem, explicacao, pontos, embaralhar_itens, ativa)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          dados.uc_id, dados.topico_id, dados.tipo, dados.dificuldade, dados.contexto, dados.enunciado,
          dados.codigo, dados.codigo_linguagem, dados.explicacao, dados.pontos,
          dados.embaralhar_itens, dados.ativa,
        ]
      );
      questaoId = (r as { insertId: number }).insertId;
    }

    const mantidos: number[] = [];
    for (const item of itens) {
      if (item.id) {
        await cx.execute(
          `UPDATE questao_item SET texto = ?, texto_par = ?, correta = ?, posicao_correta = ?,
                                   grupo_lacuna = ?, ordem = ?
            WHERE id = ? AND questao_id = ?`,
          [item.texto, item.texto_par, item.correta, item.posicao_correta, item.grupo_lacuna, item.ordem, item.id, questaoId]
        );
        mantidos.push(item.id);
      } else {
        const [r] = await cx.execute(
          `INSERT INTO questao_item (questao_id, texto, texto_par, correta, posicao_correta, grupo_lacuna, ordem)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [questaoId, item.texto, item.texto_par, item.correta, item.posicao_correta, item.grupo_lacuna, item.ordem]
        );
        mantidos.push((r as { insertId: number }).insertId);
      }
    }

    // Remove os itens que o professor tirou do formulário.
    if (mantidos.length) {
      await cx.execute(
        `DELETE FROM questao_item WHERE questao_id = ? AND id NOT IN (${marcadores(mantidos.length)})`,
        [questaoId, ...mantidos]
      );
    } else {
      await cx.execute("DELETE FROM questao_item WHERE questao_id = ?", [questaoId]);
    }

    return questaoId!;
  });
}

export async function excluirQuestao(id: number): Promise<void> {
  await executar("DELETE FROM questao WHERE id = ?", [id]);
}

export async function alternarAtiva(id: number, ativa: number): Promise<void> {
  await executar("UPDATE questao SET ativa = ? WHERE id = ?", [ativa, id]);
}

/** Em quantas avaliações a questão está, para avisar antes de excluir. */
export async function usosDaQuestao(id: number): Promise<number> {
  const linha = await consultarUm<{ total: number }>(
    "SELECT COUNT(*) AS total FROM avaliacao_questao WHERE questao_id = ?",
    [id]
  );
  return linha?.total ?? 0;
}
