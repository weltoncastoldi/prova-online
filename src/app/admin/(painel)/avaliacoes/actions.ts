"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigirProfessor } from "@/lib/auth";
import { doCampoParaUtc } from "@/lib/datas";
import { gerarSlug } from "@/lib/embaralhar";
import {
  atualizarAvaliacao,
  contarQuestoes,
  criarAvaliacao,
  definirQuestoes,
  excluirAvaliacao,
  obterAvaliacao,
  slugDisponivel,
  type DadosAvaliacao,
} from "@/lib/repos/avaliacoes";
import type { ExibirResultado, StatusAvaliacao } from "@/lib/tipos";

export type EstadoAvaliacao = { erro: string | null };

function texto(dados: FormData, campo: string): string {
  return String(dados.get(campo) ?? "").trim();
}

/**
 * "2026-09-22T14:00" digitado pelo professor -> mesmo instante em UTC, que é
 * como o banco guarda. O professor pensa no fuso da escola; o banco, em UTC.
 */
function dataMysql(valor: string): string | null {
  if (!valor) return null;
  return doCampoParaUtc(valor);
}

/** Instante já vindo do banco (UTC) -> string UTC para gravar de volta. */
function dataParaMysql(valor: Date | string | null): string | null {
  if (!valor) return null;
  const data = valor instanceof Date ? valor : new Date(valor);
  if (Number.isNaN(data.getTime())) return null;
  const dois = (n: number) => String(n).padStart(2, "0");
  return (
    `${data.getUTCFullYear()}-${dois(data.getUTCMonth() + 1)}-${dois(data.getUTCDate())} ` +
    `${dois(data.getUTCHours())}:${dois(data.getUTCMinutes())}:${dois(data.getUTCSeconds())}`
  );
}

export async function salvarAvaliacaoAction(
  id: number | null,
  _anterior: EstadoAvaliacao,
  dados: FormData
): Promise<EstadoAvaliacao> {
  const sessao = await exigirProfessor();

  const titulo = texto(dados, "titulo");
  const ucId = Number(dados.get("uc_id") ?? 0);
  if (!titulo) return { erro: "Informe o título da avaliação." };
  if (!ucId) return { erro: "Escolha a unidade curricular." };

  const slug = gerarSlug(texto(dados, "slug") || titulo);
  if (!(await slugDisponivel(slug, id))) {
    return { erro: `O endereço "/p/${slug}" já está em uso por outra avaliação.` };
  }

  const status = (texto(dados, "status") || "rascunho") as StatusAvaliacao;

  // Publicar sem questões deixaria o aluno numa tela vazia.
  if (status === "publicada" && id) {
    const total = await contarQuestoes(id);
    if (total === 0) return { erro: "Adicione questões antes de publicar." };
  }
  if (status === "publicada" && !id) {
    return { erro: "Salve como rascunho primeiro, monte as questões e depois publique." };
  }

  const tempo = Number(dados.get("tempo_limite_min") ?? 0);
  const nota = Number(dados.get("nota_minima") ?? 6);

  const valores: DadosAvaliacao = {
    uc_id: ucId,
    titulo,
    descricao: texto(dados, "descricao") || null,
    instrucoes: texto(dados, "instrucoes") || null,
    slug,
    embaralhar_questoes: dados.get("embaralhar_questoes") ? 1 : 0,
    embaralhar_alternativas: dados.get("embaralhar_alternativas") ? 1 : 0,
    tempo_limite_min: Number.isFinite(tempo) && tempo > 0 ? tempo : null,
    exibir_resultado: (texto(dados, "exibir_resultado") || "nota") as ExibirResultado,
    nota_minima: Number.isFinite(nota) ? nota : 6,
    permite_voltar: dados.get("permite_voltar") ? 1 : 0,
    tentativa_unica: dados.get("tentativa_unica") ? 1 : 0,
    abre_em: dataMysql(texto(dados, "abre_em")),
    fecha_em: dataMysql(texto(dados, "fecha_em")),
    status,
  };

  const avaliacaoId = id ?? (await criarAvaliacao(valores, sessao.id));
  if (id) await atualizarAvaliacao(id, valores);

  revalidatePath("/admin/avaliacoes");
  redirect(id ? `/admin/avaliacoes/${avaliacaoId}?salva=1` : `/admin/avaliacoes/${avaliacaoId}/questoes`);
}

export async function definirQuestoesAction(avaliacaoId: number, dados: FormData): Promise<void> {
  await exigirProfessor();

  const ids = dados
    .getAll("questao")
    .map((v) => Number(v))
    .filter((n) => Number.isInteger(n) && n > 0);

  await definirQuestoes(avaliacaoId, ids);
  revalidatePath(`/admin/avaliacoes/${avaliacaoId}`);
  redirect(`/admin/avaliacoes/${avaliacaoId}/questoes?salvo=1`);
}

export async function mudarStatus(id: number, status: StatusAvaliacao): Promise<void> {
  await exigirProfessor();

  const avaliacao = await obterAvaliacao(id);
  if (!avaliacao) redirect("/admin/avaliacoes");

  if (status === "publicada" && (await contarQuestoes(id)) === 0) {
    redirect(`/admin/avaliacoes/${id}/questoes?vazia=1`);
  }

  await atualizarAvaliacao(id, {
    ...avaliacao,
    abre_em: dataParaMysql(avaliacao.abre_em),
    fecha_em: dataParaMysql(avaliacao.fecha_em),
    status,
  });
  revalidatePath("/admin/avaliacoes");
  redirect(`/admin/avaliacoes/${id}`);
}

export async function removerAvaliacao(id: number): Promise<void> {
  await exigirProfessor();
  await excluirAvaliacao(id);
  revalidatePath("/admin/avaliacoes");
  redirect("/admin/avaliacoes");
}
