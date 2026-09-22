import Link from "next/link";
import { notFound } from "next/navigation";
import { idsDasQuestoes, obterAvaliacao } from "@/lib/repos/avaliacoes";
import { listarQuestoes } from "@/lib/repos/questoes";
import { definirQuestoesAction } from "../../actions";
import SelecaoQuestoes from "./SelecaoQuestoes";

export const dynamic = "force-dynamic";

/** Meta de questões por prova. É referência visual, não um limite rígido. */
const META = 30;

export default async function MontarAvaliacao({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ salvo?: string; vazia?: string }>;
}) {
  const { id } = await params;
  const { salvo, vazia } = await searchParams;

  const avaliacao = await obterAvaliacao(Number(id));
  if (!avaliacao) notFound();

  const [banco, selecionadas] = await Promise.all([
    listarQuestoes({ ucId: avaliacao.uc_id, apenasAtivas: true }),
    idsDasQuestoes(avaliacao.id),
  ]);

  return (
    <div className="space-y-5">
      <header>
        <Link href={`/admin/avaliacoes/${avaliacao.id}`} className="text-sm text-slate-500 hover:underline">
          ← {avaliacao.titulo}
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Montar a prova</h1>
        <p className="mt-1 text-sm text-slate-600">
          Banco de <strong>{avaliacao.uc_nome}</strong>: {banco.length} questões ativas disponíveis.
        </p>
      </header>

      {salvo && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800">
          Seleção salva.
        </p>
      )}
      {vazia && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
          Escolha ao menos uma questão antes de publicar.
        </p>
      )}

      {banco.length === 0 ? (
        <div className="cartao p-8 text-center">
          <p className="text-sm text-slate-600">O banco desta unidade ainda está vazio.</p>
          <Link href={`/admin/questoes/nova?uc=${avaliacao.uc_id}`} className="btn-primario mt-4">
            Cadastrar a primeira questão
          </Link>
        </div>
      ) : (
        <SelecaoQuestoes
          questoes={banco}
          selecionadasIniciais={selecionadas}
          acao={definirQuestoesAction.bind(null, avaliacao.id)}
          meta={META}
        />
      )}
    </div>
  );
}
