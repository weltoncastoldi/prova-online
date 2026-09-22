import Link from "next/link";
import { notFound } from "next/navigation";
import { listarTopicos, obterUc } from "@/lib/repos/catalogo";
import FormUc from "../FormUc";
import { removerUc } from "../actions";
import Topicos from "./Topicos";

export const dynamic = "force-dynamic";

export default async function PaginaUc({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const uc = await obterUc(Number(id));
  if (!uc) notFound();

  const topicos = await listarTopicos(uc.id);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/admin/ucs" className="text-sm text-slate-500 hover:underline">
            ← Unidades
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">{uc.nome}</h1>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/questoes?uc=${uc.id}`} className="btn-secundario">
            Banco de questões
          </Link>
          <Link href={`/admin/avaliacoes?uc=${uc.id}`} className="btn-secundario">
            Avaliações
          </Link>
        </div>
      </header>

      <section className="cartao p-5 sm:p-6">
        <h2 className="mb-4 font-semibold text-slate-900">Dados da unidade</h2>
        <FormUc uc={uc} />
      </section>

      <section className="cartao p-5 sm:p-6">
        <h2 className="font-semibold text-slate-900">Tópicos</h2>
        <p className="mb-4 mt-1 text-sm text-slate-600">
          Servem para filtrar o banco na hora de montar a prova e para o relatório por assunto.
        </p>
        <Topicos ucId={uc.id} topicos={topicos} />
      </section>

      <section className="cartao border-red-200 p-5 sm:p-6">
        <h2 className="font-semibold text-red-800">Excluir unidade</h2>
        <p className="mb-4 mt-1 text-sm text-slate-600">
          Apaga junto os tópicos, as questões, as avaliações e todas as provas já respondidas desta unidade.
          Não há como desfazer.
        </p>
        <form action={removerUc.bind(null, uc.id)}>
          <button type="submit" className="btn-perigo">
            Excluir {uc.codigo} definitivamente
          </button>
        </form>
      </section>
    </div>
  );
}
