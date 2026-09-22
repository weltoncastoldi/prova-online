import Link from "next/link";
import { listarTopicos, listarUcs, obterUc } from "@/lib/repos/catalogo";
import { listarQuestoes } from "@/lib/repos/questoes";
import { ROTULO_DIFICULDADE, ROTULO_TIPO, TIPOS_QUESTAO, type Dificuldade, type TipoQuestao } from "@/lib/tipos";
import { alternarAtivaAction } from "./actions";

export const dynamic = "force-dynamic";

type Busca = { uc?: string; topico?: string; tipo?: string; dificuldade?: string; q?: string; salva?: string };

export default async function PaginaQuestoes({ searchParams }: { searchParams: Promise<Busca> }) {
  const filtros = await searchParams;
  const ucId = Number(filtros.uc ?? 0);

  if (!ucId) return <EscolherUc />;

  const uc = await obterUc(ucId);
  if (!uc) return <EscolherUc />;

  const [topicos, questoes] = await Promise.all([
    listarTopicos(ucId),
    listarQuestoes({
      ucId,
      topicoId: Number(filtros.topico ?? 0) || null,
      tipo: (filtros.tipo as TipoQuestao) || null,
      dificuldade: (filtros.dificuldade as Dificuldade) || null,
      busca: filtros.q?.trim() || null,
    }),
  ]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/admin/ucs" className="text-sm text-slate-500 hover:underline">
            ← {uc.nome}
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Banco de questões</h1>
          <p className="mt-1 text-sm text-slate-600">{questoes.length} questões com os filtros atuais.</p>
        </div>
        <Link href={`/admin/questoes/nova?uc=${ucId}`} className="btn-primario">
          Nova questão
        </Link>
      </header>

      {filtros.salva && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-800">
          Questão salva.
        </p>
      )}

      {/* Filtros: GET puro, então o link da página já guarda o filtro. */}
      <form method="get" className="cartao flex flex-wrap items-end gap-3 p-4">
        <input type="hidden" name="uc" value={ucId} />
        <div className="min-w-44 flex-1">
          <label className="rotulo" htmlFor="q">
            Buscar no texto
          </label>
          <input id="q" name="q" defaultValue={filtros.q ?? ""} className="campo" placeholder="fetch, DOM..." />
        </div>
        <div>
          <label className="rotulo" htmlFor="topico">
            Tópico
          </label>
          <select id="topico" name="topico" defaultValue={filtros.topico ?? ""} className="campo">
            <option value="">Todos</option>
            {topicos.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nome}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="rotulo" htmlFor="tipo">
            Tipo
          </label>
          <select id="tipo" name="tipo" defaultValue={filtros.tipo ?? ""} className="campo">
            <option value="">Todos</option>
            {TIPOS_QUESTAO.map((t) => (
              <option key={t} value={t}>
                {ROTULO_TIPO[t]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="rotulo" htmlFor="dificuldade">
            Dificuldade
          </label>
          <select id="dificuldade" name="dificuldade" defaultValue={filtros.dificuldade ?? ""} className="campo">
            <option value="">Todas</option>
            <option value="facil">Fácil</option>
            <option value="media">Média</option>
            <option value="dificil">Difícil</option>
          </select>
        </div>
        <button type="submit" className="btn-secundario">
          Filtrar
        </button>
      </form>

      {questoes.length === 0 ? (
        <p className="cartao p-8 text-center text-sm text-slate-500">
          Nenhuma questão encontrada. Comece cadastrando a primeira.
        </p>
      ) : (
        <ul className="space-y-3">
          {questoes.map((questao) => (
            <li key={questao.id} className={`cartao p-4 ${questao.ativa ? "" : "opacity-60"}`}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="etiqueta bg-blue-100 text-blue-800">{ROTULO_TIPO[questao.tipo]}</span>
                <span className="etiqueta bg-slate-100 text-slate-600">
                  {ROTULO_DIFICULDADE[questao.dificuldade]}
                </span>
                {questao.topico_nome && (
                  <span className="etiqueta bg-slate-100 text-slate-600">{questao.topico_nome}</span>
                )}
                <span className="etiqueta bg-slate-100 text-slate-600">{questao.pontos} pt</span>
                {questao.usos > 0 && (
                  <span className="etiqueta bg-amber-100 text-amber-800">em {questao.usos} avaliação(ões)</span>
                )}
                {!questao.ativa && <span className="etiqueta bg-slate-200 text-slate-700">inativa</span>}
                <span className="ml-auto font-mono text-xs text-slate-400">#{questao.id}</span>
              </div>

              <p className="mt-2 line-clamp-2 text-sm text-slate-800">{questao.enunciado}</p>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <Link href={`/admin/questoes/${questao.id}`} className="text-sm font-medium text-blue-700 hover:underline">
                  Editar
                </Link>
                <form action={alternarAtivaAction.bind(null, questao.id, questao.ativa ? 0 : 1)}>
                  <button type="submit" className="text-sm text-slate-500 hover:underline">
                    {questao.ativa ? "Desativar" : "Reativar"}
                  </button>
                </form>
                <span className="text-xs text-slate-400">{questao.total_itens} itens</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

async function EscolherUc() {
  const ucs = await listarUcs();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Banco de questões</h1>
      <p className="text-sm text-slate-600">Escolha a unidade curricular cujo banco você quer abrir.</p>
      <ul className="grid gap-3 sm:grid-cols-2">
        {ucs.map((uc) => (
          <li key={uc.id}>
            <Link href={`/admin/questoes?uc=${uc.id}`} className="cartao flex items-center justify-between p-4 hover:border-blue-300">
              <span className="font-medium text-slate-900">{uc.nome}</span>
              <span className="text-sm text-slate-500">{uc.total_questoes} questões</span>
            </Link>
          </li>
        ))}
      </ul>
      {ucs.length === 0 && (
        <p className="cartao p-6 text-sm text-slate-500">
          Nenhuma unidade cadastrada.{" "}
          <Link href="/admin/ucs" className="text-blue-700 hover:underline">
            Criar a primeira
          </Link>
          .
        </p>
      )}
    </div>
  );
}
