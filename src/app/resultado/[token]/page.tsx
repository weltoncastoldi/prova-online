import Link from "next/link";
import { notFound } from "next/navigation";
import Gabarito from "@/components/prova/Gabarito";
import { finalizar, montarGabarito, obterPorToken, tempoEsgotado } from "@/lib/repos/tentativas";

export const dynamic = "force-dynamic";

export default async function PaginaResultado({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  let tentativa = await obterPorToken(token);
  if (!tentativa) notFound();

  // Chegou aqui com a prova aberta porque o tempo acabou: fecha antes de mostrar.
  if (tentativa.status === "em_andamento" && tempoEsgotado(tentativa, tentativa.avaliacao)) {
    await finalizar(tentativa.id, true);
    tentativa = (await obterPorToken(token))!;
  }

  if (tentativa.status === "em_andamento") {
    return (
      <Moldura titulo="Prova em andamento">
        <p className="text-slate-600">Você ainda não finalizou esta prova.</p>
        <Link href={`/prova/${token}`} className="btn-primario mt-5">
          Continuar de onde parei
        </Link>
      </Moldura>
    );
  }

  const modo = tentativa.avaliacao.exibir_resultado;
  const expirou = tentativa.status === "expirada";

  if (modo === "nenhum") {
    return (
      <Moldura titulo="Prova enviada">
        <p className="text-slate-600">
          Suas respostas foram registradas, {primeiroNome(tentativa.aluno_nome)}. O professor divulgará a nota.
        </p>
        {expirou && <Aviso>O tempo terminou e a prova foi encerrada automaticamente.</Aviso>}
      </Moldura>
    );
  }

  const nota = Number(tentativa.nota ?? 0);
  const aprovado = nota >= Number(tentativa.avaliacao.nota_minima);
  const gabarito = modo === "nota_gabarito" ? await montarGabarito(tentativa.id) : [];

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <div className="cartao overflow-hidden">
        <div className={`px-6 py-6 text-center ${aprovado ? "bg-emerald-50" : "bg-amber-50"}`}>
          <p className="text-sm font-medium text-slate-600">{tentativa.avaliacao.titulo}</p>
          <p className="mt-1 text-sm text-slate-500">{tentativa.aluno_nome}</p>
          <p className={`mt-4 text-5xl font-bold ${aprovado ? "text-emerald-700" : "text-amber-700"}`}>
            {nota.toFixed(1).replace(".", ",")}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {tentativa.acertos} de {tentativa.total_questoes} questões · nota mínima{" "}
            {Number(tentativa.avaliacao.nota_minima).toFixed(1).replace(".", ",")}
          </p>
        </div>
        {expirou && (
          <div className="border-t border-amber-200 bg-amber-50 px-6 py-3 text-center text-sm text-amber-900">
            O tempo terminou e a prova foi encerrada automaticamente.
          </div>
        )}
      </div>

      {gabarito.length > 0 && (
        <section className="mt-8 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Correção comentada</h2>
          {gabarito.map((linha) => (
            <Gabarito key={linha.ordem} linha={linha} />
          ))}
        </section>
      )}

      <p className="mt-10 text-center text-sm text-slate-500">
        Pode fechar esta página. Suas respostas já estão salvas.
      </p>
    </main>
  );
}

function Moldura({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-lg px-4 py-16">
      <div className="cartao p-8 text-center">
        <h1 className="text-xl font-bold text-slate-900">{titulo}</h1>
        <div className="mt-3">{children}</div>
      </div>
    </main>
  );
}

function Aviso({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">{children}</p>
  );
}

function primeiroNome(nome: string): string {
  return nome.trim().split(" ")[0];
}
