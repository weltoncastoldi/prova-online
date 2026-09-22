import Link from "next/link";
import { listarUcs } from "@/lib/repos/catalogo";
import FormAvaliacao from "../FormAvaliacao";

export const dynamic = "force-dynamic";

export default async function NovaAvaliacao({ searchParams }: { searchParams: Promise<{ uc?: string }> }) {
  const { uc } = await searchParams;
  const ucs = await listarUcs();

  return (
    <div className="space-y-6">
      <header>
        <Link href="/admin/avaliacoes" className="text-sm text-slate-500 hover:underline">
          ← Avaliações
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Nova avaliação</h1>
        <p className="mt-1 text-sm text-slate-600">
          Configure as regras agora; na próxima tela você escolhe as questões do banco.
        </p>
      </header>

      <FormAvaliacao ucs={ucs} ucPadrao={Number(uc ?? 0) || undefined} />
    </div>
  );
}
