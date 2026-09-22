import Link from "next/link";
import { listarAvaliacoes } from "@/lib/repos/avaliacoes";

export const dynamic = "force-dynamic";

const CORES_STATUS: Record<string, string> = {
  rascunho: "bg-slate-200 text-slate-700",
  publicada: "bg-emerald-100 text-emerald-800",
  encerrada: "bg-amber-100 text-amber-800",
};

export default async function PaginaAvaliacoes({ searchParams }: { searchParams: Promise<{ uc?: string }> }) {
  const { uc } = await searchParams;
  const avaliacoes = await listarAvaliacoes(Number(uc ?? 0) || null);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Avaliações</h1>
          <p className="mt-1 text-sm text-slate-600">
            Cada avaliação escolhe suas questões no banco da unidade curricular.
          </p>
        </div>
        <Link href={`/admin/avaliacoes/nova${uc ? `?uc=${uc}` : ""}`} className="btn-primario">
          Nova avaliação
        </Link>
      </header>

      {avaliacoes.length === 0 ? (
        <p className="cartao p-8 text-center text-sm text-slate-500">Nenhuma avaliação criada ainda.</p>
      ) : (
        <ul className="space-y-3">
          {avaliacoes.map((avaliacao) => (
            <li key={avaliacao.id} className="cartao p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`etiqueta ${CORES_STATUS[avaliacao.status]}`}>{avaliacao.status}</span>
                <span className="etiqueta bg-slate-100 text-slate-600">{avaliacao.uc_nome}</span>
                <span className="ml-auto text-sm text-slate-500">
                  {avaliacao.total_questoes} questões · {avaliacao.finalizadas} entregues
                </span>
              </div>

              <h2 className="mt-2 font-semibold text-slate-900">{avaliacao.titulo}</h2>

              {avaliacao.status === "publicada" && (
                <p className="mt-1 font-mono text-xs text-blue-700">/p/{avaliacao.slug}</p>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                <Link href={`/admin/avaliacoes/${avaliacao.id}`} className="btn-secundario">
                  Configurar
                </Link>
                <Link href={`/admin/avaliacoes/${avaliacao.id}/questoes`} className="btn-secundario">
                  Questões ({avaliacao.total_questoes})
                </Link>
                <Link href={`/admin/relatorios/${avaliacao.id}`} className="btn-secundario">
                  Resultados
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
