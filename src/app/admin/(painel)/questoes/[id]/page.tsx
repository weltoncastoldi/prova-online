import Link from "next/link";
import { notFound } from "next/navigation";
import EditorQuestao from "@/components/admin/EditorQuestao";
import { listarTopicos, obterUc } from "@/lib/repos/catalogo";
import { obterQuestao, usosDaQuestao } from "@/lib/repos/questoes";
import { removerQuestao } from "../actions";

export const dynamic = "force-dynamic";

export default async function EditarQuestao({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const questao = await obterQuestao(Number(id));
  if (!questao) notFound();

  const [uc, topicos, usos] = await Promise.all([
    obterUc(questao.uc_id),
    listarTopicos(questao.uc_id),
    usosDaQuestao(questao.id),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <Link href={`/admin/questoes?uc=${questao.uc_id}`} className="text-sm text-slate-500 hover:underline">
          ← Banco de {uc?.nome}
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Editar questão #{questao.id}</h1>
      </header>

      {usos > 0 && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Esta questão já está em {usos} avaliação(ões). Alterações valem para quem ainda não respondeu; provas já
          entregues mantêm a correção que receberam.
        </p>
      )}

      <EditorQuestao ucId={questao.uc_id} topicos={topicos} questao={questao} />

      <section className="cartao border-red-200 p-5">
        <h2 className="font-semibold text-red-800">Excluir questão</h2>
        <p className="mb-3 mt-1 text-sm text-slate-600">
          Apaga também as respostas dadas a ela nas provas já realizadas. Para tirá-la de circulação sem perder
          histórico, prefira desativar.
        </p>
        <form action={removerQuestao.bind(null, questao.id, questao.uc_id)}>
          <button type="submit" className="btn-perigo">
            Excluir definitivamente
          </button>
        </form>
      </section>
    </div>
  );
}
