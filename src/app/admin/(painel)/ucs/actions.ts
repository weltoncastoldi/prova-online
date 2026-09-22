"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigirProfessor } from "@/lib/auth";
import {
  atualizarTopico,
  atualizarUc,
  criarTopico,
  criarUc,
  excluirTopico,
  excluirUc,
} from "@/lib/repos/catalogo";

export type EstadoForm = { erro: string | null; ok?: boolean };

function texto(dados: FormData, campo: string): string {
  return String(dados.get(campo) ?? "").trim();
}

function numeroOuNulo(dados: FormData, campo: string): number | null {
  const valor = texto(dados, campo);
  if (!valor) return null;
  const n = Number(valor);
  return Number.isFinite(n) ? n : null;
}

export async function salvarUc(_anterior: EstadoForm, dados: FormData): Promise<EstadoForm> {
  await exigirProfessor();

  const id = numeroOuNulo(dados, "id");
  const codigo = texto(dados, "codigo");
  const nome = texto(dados, "nome");

  if (!codigo || !nome) return { erro: "Código e nome são obrigatórios." };

  const comuns = {
    codigo,
    nome,
    descricao: texto(dados, "descricao") || null,
    carga_horaria: numeroOuNulo(dados, "carga_horaria"),
  };

  try {
    if (id) {
      await atualizarUc(id, { ...comuns, ativo: dados.get("ativo") ? 1 : 0 });
    } else {
      await criarUc(comuns);
    }
  } catch (erro) {
    if (erro instanceof Error && erro.message.includes("Duplicate")) {
      return { erro: "Já existe uma unidade com este código." };
    }
    throw erro;
  }

  revalidatePath("/admin/ucs");
  return { erro: null, ok: true };
}

export async function removerUc(id: number): Promise<void> {
  await exigirProfessor();
  await excluirUc(id);
  revalidatePath("/admin/ucs");
  redirect("/admin/ucs");
}

export async function salvarTopico(ucId: number, _anterior: EstadoForm, dados: FormData): Promise<EstadoForm> {
  await exigirProfessor();

  const nome = texto(dados, "nome");
  if (!nome) return { erro: "Informe o nome do tópico." };

  const id = numeroOuNulo(dados, "id");
  const ordem = numeroOuNulo(dados, "ordem") ?? 0;

  if (id) await atualizarTopico(id, nome, ordem);
  else await criarTopico(ucId, nome, ordem);

  revalidatePath(`/admin/ucs/${ucId}`);
  return { erro: null, ok: true };
}

export async function removerTopico(id: number, ucId: number): Promise<void> {
  await exigirProfessor();
  await excluirTopico(id);
  revalidatePath(`/admin/ucs/${ucId}`);
}
