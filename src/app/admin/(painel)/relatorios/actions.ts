"use server";

import { revalidatePath } from "next/cache";
import { exigirProfessor } from "@/lib/auth";
import { excluirTentativa } from "@/lib/repos/tentativas";

/**
 * Apaga uma tentativa. Serve para o caso corriqueiro do aluno que errou o
 * próprio nome ou começou a prova errada e precisa refazer.
 */
export async function removerTentativa(id: number, avaliacaoId: number): Promise<void> {
  await exigirProfessor();
  await excluirTentativa(id);
  revalidatePath(`/admin/relatorios/${avaliacaoId}`);
}
