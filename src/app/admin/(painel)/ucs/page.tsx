import Link from "next/link";
import { listarUcs } from "@/lib/repos/catalogo";
import FormUc from "./FormUc";

export const dynamic = "force-dynamic";

export default async function PaginaUcs() {
  const ucs = await listarUcs();

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Unidades curriculares</h1>
        <p className="mt-1 text-sm text-slate-600">
          A UC é o ponto de partida: dentro dela ficam os tópicos, o banco de questões e as avaliações.
        </p>
      </header>

      <section className="cartao p-5 sm:p-6">
        <h2 className="mb-4 font-semibold text-slate-900">Nova unidade</h2>
        <FormUc />
      </section>

      <section>
        <h2 className="mb-3 font-semibold text-slate-900">Cadastradas</h2>
        {ucs.length === 0 ? (
          <p className="cartao p-6 text-sm text-slate-500">Nenhuma unidade ainda.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {ucs.map((uc) => (
              <li key={uc.id} className="cartao p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="etiqueta bg-slate-100 font-mono text-slate-600">{uc.codigo}</span>
                    <h3 className="mt-2 font-semibold text-slate-900">{uc.nome}</h3>
                  </div>
                  {uc.ativo === 0 && <span className="etiqueta bg-amber-100 text-amber-800">inativa</span>}
                </div>

                {uc.descricao && <p className="mt-2 line-clamp-2 text-sm text-slate-600">{uc.descricao}</p>}

                <p className="mt-3 text-sm text-slate-500">
                  {uc.total_questoes} questões · {uc.total_avaliacoes} avaliações
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href={`/admin/ucs/${uc.id}`} className="btn-secundario">
                    Tópicos e edição
                  </Link>
                  <Link href={`/admin/questoes?uc=${uc.id}`} className="btn-secundario">
                    Banco de questões
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
