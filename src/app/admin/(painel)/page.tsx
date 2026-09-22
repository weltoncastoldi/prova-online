import Link from "next/link";
import { consultar, consultarUm } from "@/lib/db";
import { listarAvaliacoes } from "@/lib/repos/avaliacoes";

export const dynamic = "force-dynamic";

type Totais = { ucs: number; questoes: number; avaliacoes: number; tentativas: number };

export default async function Painel() {
  const totais = await consultarUm<Totais>(
    `SELECT (SELECT COUNT(*) FROM uc)                              AS ucs,
            (SELECT COUNT(*) FROM questao WHERE ativa = 1)         AS questoes,
            (SELECT COUNT(*) FROM avaliacao)                       AS avaliacoes,
            (SELECT COUNT(*) FROM tentativa WHERE status <> 'em_andamento') AS tentativas`
  );

  const recentes = await consultar<{
    id: number;
    aluno_nome: string;
    nota: number | null;
    status: string;
    iniciada_em: Date;
    titulo: string;
    avaliacao_id: number;
  }>(
    `SELECT t.id, t.aluno_nome, t.nota, t.status, t.iniciada_em, a.titulo, a.id AS avaliacao_id
       FROM tentativa t JOIN avaliacao a ON a.id = t.avaliacao_id
      ORDER BY t.id DESC LIMIT 8`
  );

  const publicadas = (await listarAvaliacoes()).filter((a) => a.status === "publicada");

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Painel</h1>
        <p className="mt-1 text-sm text-slate-600">
          O caminho é sempre o mesmo: unidade curricular → tópicos → banco de questões → avaliação.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-4">
        <Cartao titulo="Unidades" valor={totais?.ucs ?? 0} href="/admin/ucs" />
        <Cartao titulo="Questões ativas" valor={totais?.questoes ?? 0} href="/admin/questoes" />
        <Cartao titulo="Avaliações" valor={totais?.avaliacoes ?? 0} href="/admin/avaliacoes" />
        <Cartao titulo="Provas entregues" valor={totais?.tentativas ?? 0} href="/admin/relatorios" />
      </section>

      {publicadas.length > 0 && (
        <section>
          <h2 className="mb-3 font-semibold text-slate-900">Abertas agora</h2>
          <ul className="space-y-2">
            {publicadas.map((avaliacao) => (
              <li key={avaliacao.id} className="cartao flex flex-wrap items-center justify-between gap-3 p-4">
                <span>
                  <span className="block font-medium text-slate-900">{avaliacao.titulo}</span>
                  <span className="font-mono text-xs text-blue-700">/p/{avaliacao.slug}</span>
                </span>
                <span className="text-sm text-slate-500">
                  {avaliacao.finalizadas} entregues · {avaliacao.total_questoes} questões
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-3 font-semibold text-slate-900">Últimas provas</h2>
        {recentes.length === 0 ? (
          <p className="cartao p-6 text-sm text-slate-500">Nenhuma prova respondida ainda.</p>
        ) : (
          <ul className="cartao divide-y divide-slate-100">
            {recentes.map((linha) => (
              <li key={linha.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5 text-sm">
                <span className="font-medium text-slate-900">{linha.aluno_nome}</span>
                <Link href={`/admin/relatorios/${linha.avaliacao_id}`} className="text-slate-500 hover:underline">
                  {linha.titulo}
                </Link>
                <span className="ml-auto text-slate-500">
                  {new Date(linha.iniciada_em).toLocaleString("pt-BR")}
                </span>
                <span className="w-12 text-right font-semibold text-slate-700">
                  {linha.nota == null ? "—" : Number(linha.nota).toFixed(1).replace(".", ",")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Cartao({ titulo, valor, href }: { titulo: string; valor: number; href: string }) {
  return (
    <Link href={href} className="cartao p-4 transition-colors hover:border-blue-300">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{titulo}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{valor}</p>
    </Link>
  );
}
