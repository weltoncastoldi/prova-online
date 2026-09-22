import Link from "next/link";
import { notFound } from "next/navigation";
import { contarQuestoes, obterAvaliacao } from "@/lib/repos/avaliacoes";
import { listarUcs } from "@/lib/repos/catalogo";
import FormAvaliacao from "../FormAvaliacao";
import { mudarStatus, removerAvaliacao } from "../actions";

export const dynamic = "force-dynamic";

export default async function ConfigurarAvaliacao({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ salva?: string }>;
}) {
  const { id } = await params;
  const { salva } = await searchParams;

  const avaliacao = await obterAvaliacao(Number(id));
  if (!avaliacao) notFound();

  const [ucs, total] = await Promise.all([listarUcs(), contarQuestoes(avaliacao.id)]);

  return (
    <div className="space-y-6">
      <header>
        <Link href="/admin/avaliacoes" className="text-sm text-slate-500 hover:underline">
          ← Avaliações
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">{avaliacao.titulo}</h1>
        <p className="mt-1 text-sm text-slate-600">
          {total} questões ·{" "}
          <Link href={`/admin/avaliacoes/${avaliacao.id}/questoes`} className="text-blue-700 hover:underline">
            montar a prova
          </Link>
        </p>
      </header>

      {salva && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800">
          Alterações salvas.
        </p>
      )}

      {avaliacao.status === "publicada" && (
        <section className="cartao border-emerald-200 bg-emerald-50/60 p-5">
          <h2 className="text-sm font-semibold text-emerald-900">Link para a turma</h2>
          <p className="mt-1 break-all font-mono text-sm text-emerald-800">/p/{avaliacao.slug}</p>
          <p className="mt-2 text-xs text-emerald-800/80">
            Some o endereço do seu site na frente. Ex.: https://seudominio.com.br/p/{avaliacao.slug}
          </p>
        </section>
      )}

      <div className="flex flex-wrap gap-2">
        {avaliacao.status !== "publicada" && (
          <form action={mudarStatus.bind(null, avaliacao.id, "publicada")}>
            <button type="submit" className="btn-primario" disabled={total === 0}>
              Publicar
            </button>
          </form>
        )}
        {avaliacao.status === "publicada" && (
          <form action={mudarStatus.bind(null, avaliacao.id, "encerrada")}>
            <button type="submit" className="btn-secundario">
              Encerrar aplicação
            </button>
          </form>
        )}
        {avaliacao.status === "encerrada" && (
          <form action={mudarStatus.bind(null, avaliacao.id, "publicada")}>
            <button type="submit" className="btn-secundario">
              Reabrir
            </button>
          </form>
        )}
      </div>

      <FormAvaliacao ucs={ucs} avaliacao={avaliacao} />

      <section className="cartao border-red-200 p-5">
        <h2 className="font-semibold text-red-800">Excluir avaliação</h2>
        <p className="mb-3 mt-1 text-sm text-slate-600">
          Apaga também todas as provas respondidas e as notas desta avaliação. As questões continuam no banco.
        </p>
        <form action={removerAvaliacao.bind(null, avaliacao.id)}>
          <button type="submit" className="btn-perigo">
            Excluir definitivamente
          </button>
        </form>
      </section>
    </div>
  );
}
