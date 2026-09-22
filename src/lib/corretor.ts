import type { QuestaoItem, Resposta, TipoQuestao } from "./tipos";

/**
 * Correcao automatica. Tudo acontece aqui, no servidor: o navegador nunca
 * recebe qual e a alternativa certa enquanto a prova esta em andamento.
 *
 * Criterio: tudo ou nada em todos os tipos. Numa questao de multipla resposta
 * ou de associacao, acertar metade nao vale metade do ponto -- e a regra mais
 * simples de explicar para a turma e a que evita discussao na entrega da nota.
 */

export function corrigir(tipo: TipoQuestao, itens: QuestaoItem[], resposta: Resposta | null): boolean {
  if (!resposta) return false;

  switch (tipo) {
    case "multipla_escolha":
    case "verdadeiro_falso": {
      if (resposta.tipo !== "unica" || resposta.itemId == null) return false;
      const escolhido = itens.find((i) => i.id === resposta.itemId);
      return !!escolhido && escolhido.correta === 1;
    }

    case "multipla_resposta": {
      if (resposta.tipo !== "varias") return false;
      const corretos = itens.filter((i) => i.correta === 1).map((i) => i.id).sort();
      const marcados = [...new Set(resposta.itemIds)].sort();
      if (corretos.length === 0 || corretos.length !== marcados.length) return false;
      return corretos.every((id, indice) => id === marcados[indice]);
    }

    case "lacunas": {
      if (resposta.tipo !== "lacunas") return false;
      const grupos = [...new Set(itens.map((i) => i.grupo_lacuna).filter((g): g is number => g != null))];
      if (grupos.length === 0) return false;
      return grupos.every((grupo) => {
        const escolhido = resposta.escolhas[String(grupo)];
        if (escolhido == null) return false;
        const item = itens.find((i) => i.id === escolhido && i.grupo_lacuna === grupo);
        return !!item && item.correta === 1;
      });
    }

    case "ordenacao": {
      if (resposta.tipo !== "ordenacao") return false;
      if (resposta.ordem.length !== itens.length) return false;
      return resposta.ordem.every((itemId, indice) => {
        const item = itens.find((i) => i.id === itemId);
        return !!item && item.posicao_correta === indice + 1;
      });
    }

    case "associacao": {
      if (resposta.tipo !== "associacao") return false;
      // O par correto de uma linha e a propria linha: texto (coluna A) e
      // texto_par (coluna B) moram no mesmo registro.
      return itens.every((item) => resposta.pares[String(item.id)] === item.id);
    }

    default:
      return false;
  }
}

/**
 * Le o formulario do aluno e devolve a resposta normalizada.
 * Retorna null quando nada foi marcado, para a pagina poder cobrar o aluno
 * antes de avancar.
 */
export function lerResposta(tipo: TipoQuestao, dados: FormData): Resposta | null {
  const inteiro = (valor: FormDataEntryValue | null): number | null => {
    const n = Number(valor);
    return Number.isInteger(n) && n > 0 ? n : null;
  };

  switch (tipo) {
    case "multipla_escolha":
    case "verdadeiro_falso": {
      const itemId = inteiro(dados.get("item"));
      return itemId ? { tipo: "unica", itemId } : null;
    }

    case "multipla_resposta": {
      const itemIds = dados
        .getAll("item")
        .map((v) => inteiro(v))
        .filter((n): n is number => n != null);
      return itemIds.length ? { tipo: "varias", itemIds } : null;
    }

    case "lacunas": {
      const escolhas: Record<string, number> = {};
      for (const [campo, valor] of dados.entries()) {
        const achado = campo.match(/^lacuna_(\d+)$/);
        const itemId = inteiro(valor);
        if (achado && itemId) escolhas[achado[1]] = itemId;
      }
      return Object.keys(escolhas).length ? { tipo: "lacunas", escolhas } : null;
    }

    case "ordenacao": {
      // O componente de arrastar grava a sequencia num campo oculto.
      const sequencia = String(dados.get("ordem") ?? "")
        .split(",")
        .map((parte) => Number(parte.trim()))
        .filter((n) => Number.isInteger(n) && n > 0);
      if (sequencia.length) return { tipo: "ordenacao", ordem: sequencia };

      // Sem JavaScript, o aluno informa a posicao de cada linha num select.
      const posicoes: Array<{ itemId: number; posicao: number }> = [];
      for (const [campo, valor] of dados.entries()) {
        const achado = campo.match(/^pos_(\d+)$/);
        const posicao = Number(valor);
        if (achado && Number.isInteger(posicao) && posicao > 0) {
          posicoes.push({ itemId: Number(achado[1]), posicao });
        }
      }
      if (!posicoes.length) return null;
      posicoes.sort((a, b) => a.posicao - b.posicao);
      return { tipo: "ordenacao", ordem: posicoes.map((p) => p.itemId) };
    }

    case "associacao": {
      const pares: Record<string, number> = {};
      for (const [campo, valor] of dados.entries()) {
        const achado = campo.match(/^par_(\d+)$/);
        const escolhido = inteiro(valor);
        if (achado && escolhido) pares[achado[1]] = escolhido;
      }
      return Object.keys(pares).length ? { tipo: "associacao", pares } : null;
    }

    default:
      return null;
  }
}

/** A resposta cobre tudo o que a questao pede? Usado para nao deixar avancar pela metade. */
export function respostaCompleta(tipo: TipoQuestao, itens: QuestaoItem[], resposta: Resposta | null): boolean {
  if (!resposta) return false;
  switch (tipo) {
    case "lacunas": {
      const grupos = new Set(itens.map((i) => i.grupo_lacuna).filter((g): g is number => g != null));
      return resposta.tipo === "lacunas" && grupos.size > 0 &&
        [...grupos].every((g) => resposta.escolhas[String(g)] != null);
    }
    case "ordenacao":
      return resposta.tipo === "ordenacao" && resposta.ordem.length === itens.length;
    case "associacao":
      return resposta.tipo === "associacao" && itens.every((i) => resposta.pares[String(i.id)] != null);
    default:
      return true;
  }
}
