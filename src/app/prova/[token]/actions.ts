"use server";

import { redirect } from "next/navigation";
import { corrigir, lerResposta, respostaCompleta } from "@/lib/corretor";
import {
  carregarQuestao,
  finalizar,
  marcarQuestaoAtual,
  obterPorToken,
  registrarResposta,
  tempoEsgotado,
} from "@/lib/repos/tentativas";

/**
 * Recebe a resposta, corrige e leva para a próxima questão.
 *
 * O redirect no fim é o que torna o F5 inofensivo: o navegador recarrega a
 * questão seguinte por GET, sem reenviar nada.
 */
export async function responder(token: string, ordem: number, dados: FormData): Promise<void> {
  const tentativa = await obterPorToken(token);
  if (!tentativa) redirect("/");
  if (tentativa.status !== "em_andamento") redirect(`/resultado/${token}`);

  if (tempoEsgotado(tentativa, tentativa.avaliacao)) {
    await finalizar(tentativa.id, true);
    redirect(`/resultado/${token}`);
  }

  const atual = await carregarQuestao(tentativa.id, ordem);
  if (!atual) redirect(`/prova/${token}`);

  const resposta = lerResposta(atual.questao.tipo, dados);
  if (!resposta || !respostaCompleta(atual.questao.tipo, atual.itens, resposta)) {
    redirect(`/prova/${token}/${ordem}?incompleta=1`);
  }

  const acertou = corrigir(atual.questao.tipo, atual.itens, resposta);
  await registrarResposta(atual.tentativa_questao_id, resposta, acertou, acertou ? atual.pontos : 0);

  const proxima = ordem + 1;
  if (proxima > tentativa.total_questoes) {
    await finalizar(tentativa.id);
    redirect(`/resultado/${token}`);
  }

  await marcarQuestaoAtual(tentativa.id, proxima);
  redirect(`/prova/${token}/${proxima}`);
}
