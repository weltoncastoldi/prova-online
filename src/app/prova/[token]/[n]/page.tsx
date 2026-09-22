import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Cronometro from "@/components/prova/Cronometro";
import Questao from "@/components/prova/Questao";
import { prepararWidget } from "@/lib/exibicao";
import { carregarQuestao, finalizar, obterPorToken, tempoEsgotado } from "@/lib/repos/tentativas";
import { ROTULO_TIPO } from "@/lib/tipos";
import { responder } from "../actions";

export const dynamic = "force-dynamic";

export default async function PaginaQuestao({
  params,
  searchParams,
}: {
  params: Promise<{ token: string; n: string }>;
  searchParams: Promise<{ incompleta?: string }>;
}) {
  const { token, n } = await params;
  const { incompleta } = await searchParams;

  const tentativa = await obterPorToken(token);
  if (!tentativa) notFound();
  if (tentativa.status !== "em_andamento") redirect(`/resultado/${token}`);

  if (tempoEsgotado(tentativa, tentativa.avaliacao)) {
    await finalizar(tentativa.id, true);
    redirect(`/resultado/${token}`);
  }

  const ordem = Number(n);
  if (!Number.isInteger(ordem) || ordem < 1 || ordem > tentativa.total_questoes) {
    redirect(`/prova/${token}`);
  }
  // Não deixa pular para a frente nem, quando a avaliação proíbe, voltar atrás.
  if (ordem > tentativa.questao_atual) redirect(`/prova/${token}/${tentativa.questao_atual}`);
  if (ordem < tentativa.questao_atual && !tentativa.avaliacao.permite_voltar) {
    redirect(`/prova/${token}/${tentativa.questao_atual}`);
  }

  const atual = await carregarQuestao(tentativa.id, ordem);
  if (!atual) redirect(`/prova/${token}`);

  const { questao } = atual;
  const widget = prepararWidget(questao, atual.itens, atual.itensOrdem);
  const progresso = Math.round((ordem / tentativa.total_questoes) * 100);
  const fimEmMs = tentativa.avaliacao.tempo_limite_min
    ? new Date(tentativa.iniciada_em).getTime() + tentativa.avaliacao.tempo_limite_min * 60_000
    : null;

  return (
    <div className="min-h-screen pb-16">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-3xl px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{tentativa.avaliacao.titulo}</p>
              <p className="truncate text-xs text-slate-500">{tentativa.aluno_nome}</p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="text-sm font-medium text-slate-600">
                {ordem}<span className="text-slate-400">/{tentativa.total_questoes}</span>
              </span>
              {fimEmMs && <Cronometro fim={fimEmMs} token={token} />}
            </div>
          </div>
          <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-blue-700 transition-all" style={{ width: `${progresso}%` }} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
        <article className="cartao p-5 sm:p-7">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="etiqueta bg-blue-100 text-blue-800">{ROTULO_TIPO[questao.tipo]}</span>
            <span className="etiqueta bg-slate-100 text-slate-600">
              {atual.pontos} {atual.pontos === 1 ? "ponto" : "pontos"}
            </span>
          </div>

          {questao.contexto && (
            <div className="mb-4 rounded-lg border-l-4 border-slate-300 bg-slate-50 px-4 py-3">
              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">{questao.contexto}</p>
            </div>
          )}

          <h1 className="text-lg font-semibold leading-snug text-slate-900">{questao.enunciado}</h1>

          {/* No tipo "lacunas" o código é o próprio widget, com os selects dentro. */}
          {questao.codigo && questao.tipo !== "lacunas" && (
            <pre className="bloco-codigo mt-4">
              <code>{questao.codigo}</code>
            </pre>
          )}

          {incompleta && (
            <p
              role="alert"
              className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900"
            >
              Responda a questão por completo antes de avançar.
            </p>
          )}

          <div className="mt-6">
            <Questao
              dados={widget}
              acao={responder.bind(null, token, ordem)}
              ultima={ordem === tentativa.total_questoes}
            />
          </div>
        </article>

        {tentativa.avaliacao.permite_voltar && ordem > 1 && (
          <div className="mt-4 text-center">
            <Link href={`/prova/${token}/${ordem - 1}`} className="text-sm text-slate-500 hover:underline">
              ← Rever a questão anterior
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
