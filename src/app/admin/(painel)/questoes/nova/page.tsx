import Link from "next/link";
import { redirect } from "next/navigation";
import EditorQuestao from "@/components/admin/EditorQuestao";
import { listarTopicos, obterUc } from "@/lib/repos/catalogo";

export const dynamic = "force-dynamic";

export default async function NovaQuestao({ searchParams }: { searchParams: Promise<{ uc?: string }> }) {
  const { uc: ucParam } = await searchParams;
  const ucId = Number(ucParam ?? 0);
  if (!ucId) redirect("/admin/questoes");

  const uc = await obterUc(ucId);
  if (!uc) redirect("/admin/questoes");

  const topicos = await listarTopicos(ucId);

  return (
    <div className="space-y-6">
      <header>
        <Link href={`/admin/questoes?uc=${ucId}`} className="text-sm text-slate-500 hover:underline">
          ← Banco de {uc.nome}
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Nova questão</h1>
      </header>

      <EditorQuestao ucId={ucId} topicos={topicos} />
    </div>
  );
}
