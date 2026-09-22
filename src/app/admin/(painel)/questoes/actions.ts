"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigirProfessor } from "@/lib/auth";
import { fatiarCodigo } from "@/lib/exibicao";
import { alternarAtiva, excluirQuestao, salvarQuestao, type ItemEnviado } from "@/lib/repos/questoes";
import { TIPOS_QUESTAO, type Dificuldade, type TipoQuestao } from "@/lib/tipos";

export type EstadoQuestao = { erro: string | null };

type ItemDoEditor = {
  id: number | null;
  texto: string;
  texto_par: string | null;
  correta: boolean;
  grupo_lacuna: number | null;
};

/**
 * Regras de consistência de cada tipo. Rodam no servidor porque é aqui que a
 * questão vira prova: uma questão salva sem gabarito seria um ponto perdido
 * para a turma inteira.
 */
function validar(
  tipo: TipoQuestao,
  itens: ItemDoEditor[],
  codigo: string | null
): { itens: ItemEnviado[] } | { erro: string } {
  const preenchidos = itens.filter((i) => i.texto.trim() !== "");

  const montar = (extra: (item: ItemDoEditor, indice: number) => Partial<ItemEnviado> = () => ({})) =>
    preenchidos.map((item, indice) => ({
      id: item.id,
      texto: item.texto.trim(),
      texto_par: item.texto_par?.trim() || null,
      correta: item.correta ? 1 : 0,
      posicao_correta: null,
      grupo_lacuna: item.grupo_lacuna,
      ordem: indice + 1,
      ...extra(item, indice),
    }));

  switch (tipo) {
    case "multipla_escolha":
    case "verdadeiro_falso": {
      if (preenchidos.length < 2) return { erro: "Cadastre pelo menos duas alternativas." };
      const corretas = preenchidos.filter((i) => i.correta).length;
      if (corretas !== 1) return { erro: "Marque exatamente uma alternativa como correta." };
      return { itens: montar() };
    }

    case "multipla_resposta": {
      if (preenchidos.length < 3) return { erro: "Cadastre pelo menos três alternativas." };
      const corretas = preenchidos.filter((i) => i.correta).length;
      if (corretas < 2) return { erro: "Múltipla resposta precisa de pelo menos duas corretas." };
      if (corretas === preenchidos.length) return { erro: "Deixe ao menos uma alternativa incorreta." };
      return { itens: montar() };
    }

    case "lacunas": {
      if (!codigo?.trim()) return { erro: "O tipo lacunas precisa do código com as marcações {{1}}, {{2}}." };
      const marcadas = new Set(
        fatiarCodigo(codigo).filter((s) => s.tipo === "lacuna").map((s) => s.grupo)
      );
      if (marcadas.size === 0) return { erro: "Nenhuma lacuna encontrada. Use {{1}} no código." };

      const grupos = new Set(preenchidos.map((i) => i.grupo_lacuna ?? 0));
      for (const grupo of marcadas) {
        if (!grupos.has(grupo)) return { erro: `A lacuna {{${grupo}}} está no código mas não tem opções.` };
        const doGrupo = preenchidos.filter((i) => i.grupo_lacuna === grupo);
        if (doGrupo.length < 2) return { erro: `A lacuna ${grupo} precisa de pelo menos duas opções.` };
        if (doGrupo.filter((i) => i.correta).length !== 1) {
          return { erro: `Marque exatamente uma opção correta na lacuna ${grupo}.` };
        }
      }
      for (const grupo of grupos) {
        if (!marcadas.has(grupo)) return { erro: `Há opções para a lacuna ${grupo}, mas {{${grupo}}} não está no código.` };
      }
      return { itens: montar() };
    }

    case "ordenacao": {
      if (preenchidos.length < 3) return { erro: "Cadastre pelo menos três etapas para ordenar." };
      // A ordem em que o professor digitou é a ordem correta.
      return { itens: montar((_item, indice) => ({ posicao_correta: indice + 1, correta: 0 })) };
    }

    case "associacao": {
      if (preenchidos.length < 3) return { erro: "Cadastre pelo menos três pares." };
      if (preenchidos.some((i) => !i.texto_par?.trim())) return { erro: "Todo item da coluna A precisa do seu par." };
      return { itens: montar(() => ({ correta: 0 })) };
    }
  }
}

export async function salvarQuestaoAction(
  ucId: number,
  questaoId: number | null,
  _anterior: EstadoQuestao,
  dados: FormData
): Promise<EstadoQuestao> {
  await exigirProfessor();

  const tipo = String(dados.get("tipo") ?? "") as TipoQuestao;
  if (!TIPOS_QUESTAO.includes(tipo)) return { erro: "Tipo de questão inválido." };

  const enunciado = String(dados.get("enunciado") ?? "").trim();
  if (!enunciado) return { erro: "O enunciado é obrigatório." };

  const codigo = String(dados.get("codigo") ?? "").trim() || null;

  let itens: ItemDoEditor[];
  try {
    itens = JSON.parse(String(dados.get("itens") ?? "[]")) as ItemDoEditor[];
  } catch {
    return { erro: "Não foi possível ler as alternativas." };
  }

  const validacao = validar(tipo, itens, codigo);
  if ("erro" in validacao) return { erro: validacao.erro };

  const pontos = Number(dados.get("pontos") ?? 1);
  const topicoId = Number(dados.get("topico_id") ?? 0);

  const id = await salvarQuestao(questaoId, {
    uc_id: ucId,
    topico_id: topicoId > 0 ? topicoId : null,
    tipo,
    dificuldade: (String(dados.get("dificuldade") ?? "media") as Dificuldade) || "media",
    contexto: String(dados.get("contexto") ?? "").trim() || null,
    enunciado,
    codigo,
    codigo_linguagem: String(dados.get("codigo_linguagem") ?? "javascript"),
    explicacao: String(dados.get("explicacao") ?? "").trim() || null,
    pontos: Number.isFinite(pontos) && pontos > 0 ? pontos : 1,
    embaralhar_itens: dados.get("embaralhar_itens") ? 1 : 0,
    ativa: dados.get("ativa") ? 1 : 0,
  }, validacao.itens);

  revalidatePath("/admin/questoes");
  redirect(`/admin/questoes?uc=${ucId}&salva=${id}`);
}

export async function removerQuestao(id: number, ucId: number): Promise<void> {
  await exigirProfessor();
  await excluirQuestao(id);
  revalidatePath("/admin/questoes");
  redirect(`/admin/questoes?uc=${ucId}`);
}

export async function alternarAtivaAction(id: number, ativa: number): Promise<void> {
  await exigirProfessor();
  await alternarAtiva(id, ativa);
  revalidatePath("/admin/questoes");
}
