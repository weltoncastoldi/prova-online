import { fatiarCodigo } from "@/lib/exibicao";
import type { LinhaGabarito } from "@/lib/repos/tentativas";
import { ROTULO_TIPO } from "@/lib/tipos";

/**
 * Gabarito comentado de uma questão: o que o aluno marcou, o que era certo e
 * a explicação do professor. Só é renderizado quando a avaliação está
 * configurada como "nota_gabarito".
 */
export default function Gabarito({ linha }: { linha: LinhaGabarito }) {
  const { questao, itens, marcados } = linha;
  const acertou = linha.correta === 1;

  return (
    <article className={`cartao overflow-hidden border-l-4 ${acertou ? "border-l-emerald-500" : "border-l-red-500"}`}>
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 px-5 py-3">
        <span className="text-sm font-semibold text-slate-700">Questão {linha.ordem}</span>
        <span className={`etiqueta ${acertou ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
          {acertou ? "Acertou" : linha.respondida ? "Errou" : "Sem resposta"}
        </span>
        <span className="etiqueta bg-slate-200 text-slate-600">{ROTULO_TIPO[questao.tipo]}</span>
        <span className="ml-auto text-sm text-slate-500">
          {linha.pontos_obtidos} / {linha.pontos}
        </span>
      </div>

      <div className="space-y-4 px-5 py-4">
        {questao.contexto && <p className="text-sm text-slate-600">{questao.contexto}</p>}
        <p className="font-medium text-slate-900">{questao.enunciado}</p>

        {questao.codigo && questao.tipo !== "lacunas" && (
          <pre className="bloco-codigo">
            <code>{questao.codigo}</code>
          </pre>
        )}

        {(questao.tipo === "multipla_escolha" ||
          questao.tipo === "multipla_resposta" ||
          questao.tipo === "verdadeiro_falso") && (
          <ul className="space-y-1.5">
            {itens.map((item) => {
              const marcado = marcados.some((m) => m.item_id === item.id);
              const correto = item.correta === 1;
              return (
                <li
                  key={item.id}
                  className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${
                    correto
                      ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                      : marcado
                        ? "border-red-300 bg-red-50 text-red-900"
                        : "border-slate-200 text-slate-600"
                  }`}
                >
                  <span className="shrink-0 font-semibold">{correto ? "✓" : marcado ? "✗" : "•"}</span>
                  <span className="flex-1">{item.texto}</span>
                  {marcado && <span className="shrink-0 text-xs font-medium opacity-70">sua resposta</span>}
                </li>
              );
            })}
          </ul>
        )}

        {questao.tipo === "lacunas" && (
          <div className="space-y-3">
            <pre className="bloco-codigo">
              <code>
                {fatiarCodigo(questao.codigo ?? "").map((segmento, i) =>
                  segmento.tipo === "texto" ? (
                    <span key={i}>{segmento.valor}</span>
                  ) : (
                    <span key={i} className="rounded bg-emerald-600/30 px-1 text-emerald-200">
                      {itens.find((it) => it.grupo_lacuna === segmento.grupo && it.correta === 1)?.texto ?? "?"}
                    </span>
                  )
                )}
              </code>
            </pre>
            <ul className="space-y-1.5 text-sm">
              {[...new Set(itens.map((i) => i.grupo_lacuna))].filter((g): g is number => g != null).map((grupo) => {
                const escolhido = marcados.find((m) => m.grupo_lacuna === grupo);
                const item = itens.find((i) => i.id === escolhido?.item_id);
                const certo = item?.correta === 1;
                return (
                  <li key={grupo} className={certo ? "text-emerald-800" : "text-red-800"}>
                    Lacuna {grupo}: você escolheu <strong>{item?.texto ?? "nada"}</strong>
                    {!certo && (
                      <>
                        {" "}— o correto é{" "}
                        <strong>{itens.find((i) => i.grupo_lacuna === grupo && i.correta === 1)?.texto}</strong>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {questao.tipo === "ordenacao" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Coluna titulo="Sua sequência">
              {[...marcados]
                .sort((a, b) => (a.valor ?? 0) - (b.valor ?? 0))
                .map((m, i) => {
                  const item = itens.find((it) => it.id === m.item_id);
                  const certo = item?.posicao_correta === i + 1;
                  return (
                    <li key={m.item_id} className={certo ? "text-emerald-800" : "text-red-800"}>
                      {i + 1}. {item?.texto}
                    </li>
                  );
                })}
            </Coluna>
            <Coluna titulo="Sequência correta">
              {[...itens]
                .sort((a, b) => (a.posicao_correta ?? 0) - (b.posicao_correta ?? 0))
                .map((item) => (
                  <li key={item.id} className="text-slate-700">
                    {item.posicao_correta}. {item.texto}
                  </li>
                ))}
            </Coluna>
          </div>
        )}

        {questao.tipo === "associacao" && (
          <ul className="space-y-1.5 text-sm">
            {itens.map((item) => {
              const escolha = marcados.find((m) => m.item_id === item.id);
              const certo = escolha?.valor === item.id;
              const escolhido = itens.find((i) => i.id === escolha?.valor);
              return (
                <li
                  key={item.id}
                  className={`rounded-lg border px-3 py-2 ${
                    certo ? "border-emerald-300 bg-emerald-50" : "border-red-300 bg-red-50"
                  }`}
                >
                  <span className="font-mono font-semibold text-slate-800">{item.texto}</span>
                  <span className="mt-0.5 block text-slate-700">
                    {certo ? item.texto_par : <>Você ligou a: {escolhido?.texto_par ?? "nada"}</>}
                  </span>
                  {!certo && <span className="mt-0.5 block text-emerald-800">Correto: {item.texto_par}</span>}
                </li>
              );
            })}
          </ul>
        )}

        {questao.explicacao && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-800">Por quê</p>
            <p className="mt-1 text-sm leading-relaxed text-blue-900/90">{questao.explicacao}</p>
          </div>
        )}
      </div>
    </article>
  );
}

function Coluna({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">{titulo}</p>
      <ol className="space-y-1 text-sm">{children}</ol>
    </div>
  );
}
