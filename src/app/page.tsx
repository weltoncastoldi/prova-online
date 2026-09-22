import Link from "next/link";
import { listarPublicadas } from "@/lib/repos/avaliacoes";

export const dynamic = "force-dynamic";

export default async function PaginaInicial() {
  const avaliacoes = await listarPublicadas();

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <header className="mb-10">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Avaliação online</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">Provas disponíveis</h1>
        <p className="mt-2 text-slate-600">
          Escolha a prova indicada pelo professor. Você informará seu nome completo na tela seguinte.
        </p>
      </header>

      {avaliacoes.length === 0 ? (
        <div className="cartao p-8 text-center">
          <p className="text-slate-600">Nenhuma prova aberta no momento.</p>
          <p className="mt-1 text-sm text-slate-500">Procure o professor se você deveria estar fazendo uma agora.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {avaliacoes.map((avaliacao) => (
            <li key={avaliacao.id} className="cartao p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{avaliacao.uc_nome}</p>
              <h2 className="mt-1 text-lg font-semibold text-slate-900">{avaliacao.titulo}</h2>
              {avaliacao.descricao && <p className="mt-1.5 text-sm text-slate-600">{avaliacao.descricao}</p>}

              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-600">
                <span>{avaliacao.total_questoes} questões</span>
                {avaliacao.tempo_limite_min && <span>{avaliacao.tempo_limite_min} minutos</span>}
              </div>

              <Link href={`/p/${avaliacao.slug}`} className="btn-primario mt-5 w-full sm:w-auto">
                Começar
              </Link>
            </li>
          ))}
        </ul>
      )}

      <footer className="mt-12 text-center">
        <Link href="/admin" className="text-sm text-slate-500 underline-offset-2 hover:underline">
          Área do professor
        </Link>
      </footer>
    </main>
  );
}
