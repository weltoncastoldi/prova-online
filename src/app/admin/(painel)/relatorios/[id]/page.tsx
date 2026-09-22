import Link from "next/link";
import { notFound } from "next/navigation";
import { obterAvaliacao } from "@/lib/repos/avaliacoes";
import { estatisticasPorQuestao, tentativasDaAvaliacao } from "@/lib/repos/tentativas";
import { ROTULO_TIPO } from "@/lib/tipos";
import { removerTentativa } from "../actions";

export const dynamic = "force-dynamic";

export default async function RelatorioAvaliacao({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const avaliacao = await obterAvaliacao(Number(id));
  if (!avaliacao) notFound();

  const [tentativas, estatisticas] = await Promise.all([
    tentativasDaAvaliacao(avaliacao.id),
    estatisticasPorQuestao(avaliacao.id),
  ]);

  const entregues = tentativas.filter((t) => t.status !== "em_andamento");
  const notas = entregues.map((t) => Number(t.nota ?? 0));
  const media = notas.length ? notas.reduce((a, b) => a + b, 0) / notas.length : 0;
  const aprovados = notas.filter((n) => n >= Number(avaliacao.nota_minima)).length;

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/admin/relatorios" className="text-sm text-slate-500 hover:underline">
            ← Relatórios
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">{avaliacao.titulo}</h1>
          <p className="mt-1 text-sm text-slate-600">{avaliacao.uc_nome}</p>
        </div>
        <a href={`/admin/relatorios/${avaliacao.id}/csv`} className="btn-secundario">
          Baixar CSV
        </a>
      </header>

      <section className="grid gap-4 sm:grid-cols-4">
        <Indicador titulo="Entregues" valor={String(entregues.length)} />
        <Indicador titulo="Em andamento" valor={String(tentativas.length - entregues.length)} />
        <Indicador titulo="Média da turma" valor={media.toFixed(1).replace(".", ",")} />
        <Indicador
          titulo="Acima da mínima"
          valor={entregues.length ? `${aprovados} (${Math.round((aprovados / entregues.length) * 100)}%)` : "—"}
        />
      </section>

      <section>
        <h2 className="mb-3 font-semibold text-slate-900">Alunos</h2>
        {tentativas.length === 0 ? (
          <p className="cartao p-8 text-center text-sm text-slate-500">Ninguém respondeu ainda.</p>
        ) : (
          <div className="cartao overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Aluno</th>
                  <th className="px-4 py-2.5 font-medium">Situação</th>
                  <th className="px-4 py-2.5 text-right font-medium">Acertos</th>
                  <th className="px-4 py-2.5 text-right font-medium">Nota</th>
                  <th className="px-4 py-2.5 text-right font-medium">Tempo</th>
                  <th className="px-4 py-2.5 font-medium">Início</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tentativas.map((tentativa) => {
                  const nota = Number(tentativa.nota ?? 0);
                  const passou = nota >= Number(avaliacao.nota_minima);
                  return (
                    <tr key={tentativa.id}>
                      <td className="px-4 py-2.5 font-medium text-slate-900">{tentativa.aluno_nome}</td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`etiqueta ${
                            tentativa.status === "finalizada"
                              ? "bg-emerald-100 text-emerald-800"
                              : tentativa.status === "expirada"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {tentativa.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right text-slate-600">
                        {tentativa.acertos}/{tentativa.total_questoes}
                      </td>
                      <td
                        className={`px-4 py-2.5 text-right font-semibold ${
                          tentativa.status === "em_andamento"
                            ? "text-slate-400"
                            : passou
                              ? "text-emerald-700"
                              : "text-red-700"
                        }`}
                      >
                        {tentativa.status === "em_andamento" ? "—" : nota.toFixed(1).replace(".", ",")}
                      </td>
                      <td className="px-4 py-2.5 text-right text-slate-600">
                        {tentativa.duracao_min ? `${tentativa.duracao_min} min` : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-slate-500">
                        {new Date(tentativa.iniciada_em).toLocaleString("pt-BR")}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <form action={removerTentativa.bind(null, tentativa.id, avaliacao.id)}>
                          <button
                            type="submit"
                            className="rounded px-2 py-1 text-xs text-slate-400 hover:bg-red-50 hover:text-red-600"
                            title="Apagar esta tentativa para o aluno poder refazer"
                          >
                            apagar
                          </button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="font-semibold text-slate-900">Acerto por questão</h2>
        <p className="mb-3 mt-1 text-sm text-slate-600">
          Ordenado do menor para o maior. Percentual muito baixo costuma indicar enunciado confuso, não turma fraca.
        </p>
        <ul className="space-y-2">
          {estatisticas.map((item) => (
            <li key={item.questao_id} className="cartao p-4">
              <div className="flex items-center gap-3">
                <span className="etiqueta bg-slate-100 text-slate-600">{ROTULO_TIPO[item.tipo]}</span>
                <span className="ml-auto text-sm font-semibold text-slate-700">{item.percentual}%</span>
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-slate-800">{item.enunciado}</p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
                <div
                  className={`h-full rounded-full ${
                    item.percentual >= 70 ? "bg-emerald-500" : item.percentual >= 40 ? "bg-amber-500" : "bg-red-500"
                  }`}
                  style={{ width: `${item.percentual}%` }}
                />
              </div>
              <p className="mt-1.5 text-xs text-slate-500">
                {item.acertos} acertos em {item.respondidas} respostas
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Indicador({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="cartao p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{titulo}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{valor}</p>
    </div>
  );
}
