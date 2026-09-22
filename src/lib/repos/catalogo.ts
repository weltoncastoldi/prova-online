import { consultar, consultarUm, executar } from "../db";
import type { Topico, Uc } from "../tipos";

// --- Unidades curriculares -------------------------------------------------

export type UcComContagem = Uc & { total_questoes: number; total_avaliacoes: number };

export async function listarUcs(): Promise<UcComContagem[]> {
  return consultar<UcComContagem>(
    `SELECT u.*,
            (SELECT COUNT(*) FROM questao q  WHERE q.uc_id = u.id AND q.ativa = 1) AS total_questoes,
            (SELECT COUNT(*) FROM avaliacao a WHERE a.uc_id = u.id)                AS total_avaliacoes
       FROM uc u
      ORDER BY u.nome`
  );
}

export async function obterUc(id: number): Promise<Uc | null> {
  return consultarUm<Uc>("SELECT * FROM uc WHERE id = ?", [id]);
}

export async function criarUc(dados: {
  codigo: string;
  nome: string;
  descricao: string | null;
  carga_horaria: number | null;
}): Promise<number> {
  const r = await executar(
    "INSERT INTO uc (codigo, nome, descricao, carga_horaria) VALUES (?, ?, ?, ?)",
    [dados.codigo, dados.nome, dados.descricao, dados.carga_horaria]
  );
  return r.insertId;
}

export async function atualizarUc(
  id: number,
  dados: { codigo: string; nome: string; descricao: string | null; carga_horaria: number | null; ativo: number }
): Promise<void> {
  await executar(
    "UPDATE uc SET codigo = ?, nome = ?, descricao = ?, carga_horaria = ?, ativo = ? WHERE id = ?",
    [dados.codigo, dados.nome, dados.descricao, dados.carga_horaria, dados.ativo, id]
  );
}

export async function excluirUc(id: number): Promise<void> {
  await executar("DELETE FROM uc WHERE id = ?", [id]);
}

// --- Tópicos ---------------------------------------------------------------

export type TopicoComContagem = Topico & { total_questoes: number };

export async function listarTopicos(ucId: number): Promise<TopicoComContagem[]> {
  return consultar<TopicoComContagem>(
    `SELECT t.*,
            (SELECT COUNT(*) FROM questao q WHERE q.topico_id = t.id AND q.ativa = 1) AS total_questoes
       FROM topico t
      WHERE t.uc_id = ?
      ORDER BY t.ordem, t.nome`,
    [ucId]
  );
}

export async function criarTopico(ucId: number, nome: string, ordem: number): Promise<number> {
  const r = await executar("INSERT INTO topico (uc_id, nome, ordem) VALUES (?, ?, ?)", [ucId, nome, ordem]);
  return r.insertId;
}

export async function atualizarTopico(id: number, nome: string, ordem: number): Promise<void> {
  await executar("UPDATE topico SET nome = ?, ordem = ? WHERE id = ?", [nome, ordem, id]);
}

export async function excluirTopico(id: number): Promise<void> {
  // A FK está como ON DELETE SET NULL: as questões continuam no banco da UC,
  // apenas ficam sem tópico.
  await executar("DELETE FROM topico WHERE id = ?", [id]);
}
