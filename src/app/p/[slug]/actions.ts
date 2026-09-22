"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { obterAvaliacaoPorSlug } from "@/lib/repos/avaliacoes";
import {
  iniciarTentativa,
  jaRespondeu,
  normalizarNome,
  tentativaEmAberto,
  validarNome,
} from "@/lib/repos/tentativas";

export type EstadoInicio = { erro: string | null };

export async function iniciarProva(
  slug: string,
  _anterior: EstadoInicio,
  dados: FormData
): Promise<EstadoInicio> {
  const avaliacao = await obterAvaliacaoPorSlug(slug);
  if (!avaliacao || avaliacao.status !== "publicada") {
    return { erro: "Esta prova não está disponível." };
  }

  const agora = new Date();
  if (avaliacao.abre_em && new Date(avaliacao.abre_em) > agora) {
    return { erro: "Esta prova ainda não foi liberada." };
  }
  if (avaliacao.fecha_em && new Date(avaliacao.fecha_em) < agora) {
    return { erro: "O prazo desta prova já encerrou." };
  }

  const nome = String(dados.get("nome") ?? "").replace(/\s+/g, " ").trim();
  const problema = validarNome(nome);
  if (problema) return { erro: problema };

  const nomeNorm = normalizarNome(nome);

  // Fechou o navegador no meio da prova? Volta para onde parou em vez de
  // começar outra tentativa do zero.
  const aberta = await tentativaEmAberto(avaliacao.id, nomeNorm);
  if (aberta) redirect(`/prova/${aberta.token}`);

  if (avaliacao.tentativa_unica && (await jaRespondeu(avaliacao.id, nomeNorm))) {
    return { erro: "Consta uma prova já finalizada com este nome. Procure o professor." };
  }

  const cabecalhos = await headers();
  const ip = cabecalhos.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

  const token = await iniciarTentativa(avaliacao, nome, ip, cabecalhos.get("user-agent"));
  redirect(`/prova/${token}`);
}
