import type { ItensOrdem, Questao, QuestaoItem } from "./tipos";

/**
 * Converte a questão do banco no payload que vai para o navegador.
 *
 * Regra central: nada que revele a resposta atravessa esta fronteira. O campo
 * `correta`, `posicao_correta` e a relação real entre as colunas da associação
 * ficam no servidor. Quem corrige é o corretor, com os dados do banco.
 */

export type Opcao = { id: number; texto: string };

export type DadosWidget =
  | { tipo: "unica"; opcoes: Opcao[] }
  | { tipo: "varias"; opcoes: Opcao[] }
  | { tipo: "lacunas"; segmentos: Segmento[]; grupos: GrupoLacuna[] }
  | { tipo: "ordenacao"; itens: Opcao[] }
  | { tipo: "associacao"; esquerda: Opcao[]; direita: Opcao[] };

export type Segmento = { tipo: "texto"; valor: string } | { tipo: "lacuna"; grupo: number };
export type GrupoLacuna = { grupo: number; opcoes: Opcao[] };

/** Quebra o código nas marcações {{1}}, {{2}} para intercalar os selects. */
export function fatiarCodigo(codigo: string): Segmento[] {
  const partes = codigo.split(/\{\{(\d+)\}\}/g);
  return partes
    .map((parte, indice): Segmento =>
      indice % 2 === 1 ? { tipo: "lacuna", grupo: Number(parte) } : { tipo: "texto", valor: parte }
    )
    .filter((s) => s.tipo === "lacuna" || s.valor !== "");
}

export function prepararWidget(
  questao: Questao,
  itens: QuestaoItem[],
  ordem: ItensOrdem
): DadosWidget {
  const porId = new Map(itens.map((i) => [i.id, i]));
  const opcao = (id: number): Opcao => ({ id, texto: porId.get(id)?.texto ?? "" });

  switch (questao.tipo) {
    case "multipla_escolha":
    case "verdadeiro_falso":
      return { tipo: "unica", opcoes: idsDaLista(ordem, itens).map(opcao) };

    case "multipla_resposta":
      return { tipo: "varias", opcoes: idsDaLista(ordem, itens).map(opcao) };

    case "ordenacao":
      return { tipo: "ordenacao", itens: idsDaLista(ordem, itens).map(opcao) };

    case "lacunas": {
      const grupos: GrupoLacuna[] =
        ordem.tipo === "lacunas"
          ? Object.entries(ordem.grupos)
              .map(([grupo, ids]) => ({ grupo: Number(grupo), opcoes: ids.map(opcao) }))
              .sort((a, b) => a.grupo - b.grupo)
          : agruparLacunas(itens);
      return { tipo: "lacunas", segmentos: fatiarCodigo(questao.codigo ?? ""), grupos };
    }

    case "associacao": {
      const esquerdaIds = ordem.tipo === "associacao" ? ordem.esquerda : itens.map((i) => i.id);
      const direitaIds = ordem.tipo === "associacao" ? ordem.direita : itens.map((i) => i.id);
      return {
        tipo: "associacao",
        esquerda: esquerdaIds.map(opcao),
        // Na coluna da direita o id continua sendo o da linha dona do par, mas
        // o texto exibido é o texto_par. É assim que o corretor compara depois.
        direita: direitaIds.map((id) => ({ id, texto: porId.get(id)?.texto_par ?? "" })),
      };
    }
  }
}

function idsDaLista(ordem: ItensOrdem, itens: QuestaoItem[]): number[] {
  if (ordem.tipo === "lista") {
    // Ignora ids que já não existem (questão editada depois da prova começar).
    const existentes = new Set(itens.map((i) => i.id));
    const validos = ordem.ids.filter((id) => existentes.has(id));
    const faltando = itens.filter((i) => !ordem.ids.includes(i.id)).map((i) => i.id);
    return [...validos, ...faltando];
  }
  return itens.map((i) => i.id);
}

function agruparLacunas(itens: QuestaoItem[]): GrupoLacuna[] {
  const mapa = new Map<number, Opcao[]>();
  for (const item of itens) {
    const grupo = item.grupo_lacuna ?? 1;
    const lista = mapa.get(grupo) ?? [];
    lista.push({ id: item.id, texto: item.texto });
    mapa.set(grupo, lista);
  }
  return [...mapa.entries()]
    .map(([grupo, opcoes]) => ({ grupo, opcoes }))
    .sort((a, b) => a.grupo - b.grupo);
}
