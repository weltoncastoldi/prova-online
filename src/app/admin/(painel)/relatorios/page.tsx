import Link from "next/link";
import { listarAvaliacoes } from "@/lib/repos/avaliacoes";

export const dynamic = "force-dynamic";

export default async function PaginaRelatorios() {
  const avaliacoes = await listarAvaliacoes();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Relatórios</h1>
        <p className="mt-1 text-sm text-slate-600">Notas por aluno e percentual de acerto por questão.</p>
      </header>

      {avaliacoes.length === 0 ? (
        <p className="cartao p-8 text-center text-sm text-slate-500">Nenhuma avaliação criada ainda.</p>
      ) : (
        <ul className="space-y-3">
          {avaliacoes.map((avaliacao) => (
            <li key={avaliacao.id}>
              <Link
                href={`/admin/relatorios/${avaliacao.id}`}
                className="cartao flex flex-wrap items-center justify-between gap-3 p-4 hover:border-blue-300"
              >
                <span>
                  <span className="block font-semibold text-slate-900">{avaliacao.titulo}</span>
                  <span className="text-sm text-slate-500">{avaliacao.uc_nome}</span>
                </span>
                <span className="text-sm text-slate-600">
                  {avaliacao.finalizadas} entregues de {avaliacao.total_tentativas} iniciadas
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
