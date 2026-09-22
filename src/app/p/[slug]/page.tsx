import { notFound } from "next/navigation";
import { contarQuestoes, obterAvaliacaoPorSlug } from "@/lib/repos/avaliacoes";
import FormNome from "./FormNome";

export const dynamic = "force-dynamic";

export default async function CapaDaProva({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const avaliacao = await obterAvaliacaoPorSlug(slug);
  if (!avaliacao) notFound();

  const total = await contarQuestoes(avaliacao.id);
  const agora = new Date();
  const foraDaJanela =
    avaliacao.status !== "publicada" ||
    (avaliacao.abre_em && new Date(avaliacao.abre_em) > agora) ||
    (avaliacao.fecha_em && new Date(avaliacao.fecha_em) < agora);

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
      <div className="cartao overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">{avaliacao.uc_nome}</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">{avaliacao.titulo}</h1>
          {avaliacao.descricao && <p className="mt-2 text-sm text-slate-600">{avaliacao.descricao}</p>}
        </div>

        <div className="px-6 py-6">
          <dl className="mb-6 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
            <Info titulo="Questões" valor={String(total)} />
            <Info titulo="Tempo" valor={avaliacao.tempo_limite_min ? `${avaliacao.tempo_limite_min} min` : "Livre"} />
            <Info titulo="Navegação" valor={avaliacao.permite_voltar ? "Pode voltar" : "Sem voltar"} />
          </dl>

          {avaliacao.instrucoes && (
            <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
              <h2 className="text-sm font-semibold text-blue-900">Instruções</h2>
              <p className="mt-1 whitespace-pre-line text-sm text-blue-900/90">{avaliacao.instrucoes}</p>
            </div>
          )}

          {foraDaJanela ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Esta prova não está aberta no momento.
            </p>
          ) : total === 0 ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Esta prova ainda não tem questões cadastradas. Avise o professor.
            </p>
          ) : (
            <FormNome slug={slug} />
          )}
        </div>
      </div>
    </main>
  );
}

function Info({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2.5">
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{titulo}</dt>
      <dd className="mt-0.5 font-semibold text-slate-900">{valor}</dd>
    </div>
  );
}
