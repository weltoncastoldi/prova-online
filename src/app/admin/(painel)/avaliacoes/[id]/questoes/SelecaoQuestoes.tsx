"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import type { QuestaoNaLista } from "@/lib/repos/questoes";
import { ROTULO_DIFICULDADE, ROTULO_TIPO, TIPOS_QUESTAO } from "@/lib/tipos";

export default function SelecaoQuestoes({
  questoes,
  selecionadasIniciais,
  acao,
  meta,
}: {
  questoes: QuestaoNaLista[];
  selecionadasIniciais: number[];
  acao: (dados: FormData) => void | Promise<void>;
  meta: number;
}) {
  const [selecionadas, setSelecionadas] = useState<number[]>(selecionadasIniciais);
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroTopico, setFiltroTopico] = useState("");
  const [busca, setBusca] = useState("");

  const topicos = useMemo(() => {
    const nomes = new Set(questoes.map((q) => q.topico_nome).filter((n): n is string => !!n));
    return [...nomes].sort();
  }, [questoes]);

  const visiveis = useMemo(
    () =>
      questoes.filter((q) => {
        if (filtroTipo && q.tipo !== filtroTipo) return false;
        if (filtroTopico && q.topico_nome !== filtroTopico) return false;
        if (busca && !q.enunciado.toLowerCase().includes(busca.toLowerCase())) return false;
        return true;
      }),
    [questoes, filtroTipo, filtroTopico, busca]
  );

  const pontos = questoes
    .filter((q) => selecionadas.includes(q.id))
    .reduce((soma, q) => soma + Number(q.pontos), 0);

  function alternar(id: number) {
    setSelecionadas((atuais) =>
      atuais.includes(id) ? atuais.filter((i) => i !== id) : [...atuais, id]
    );
  }

  const idsVisiveis = visiveis.map((q) => q.id);
  const todosVisiveisMarcados = idsVisiveis.length > 0 && idsVisiveis.every((id) => selecionadas.includes(id));

  function alternarVisiveis() {
    setSelecionadas((atuais) =>
      todosVisiveisMarcados
        ? atuais.filter((id) => !idsVisiveis.includes(id))
        : [...new Set([...atuais, ...idsVisiveis])]
    );
  }

  const noAlvo = selecionadas.length === meta;

  return (
    <form action={acao} className="space-y-4">
      {selecionadas.map((id) => (
        <input key={id} type="hidden" name="questao" value={id} />
      ))}

      {/* Contador fixo no topo: é o número que o professor fica olhando. */}
      <div className="sticky top-0 z-10 -mx-4 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`rounded-lg px-3 py-1.5 text-sm font-bold ${
              noAlvo ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
            }`}
          >
            {selecionadas.length} / {meta} questões
          </span>
          <span className="text-sm text-slate-500">{pontos} pontos no total</span>
          <Salvar />
        </div>
        {selecionadas.length > 0 && !noAlvo && (
          <p className="mt-1.5 text-xs text-slate-500">
            A meta de {meta} é só uma referência — você pode salvar com qualquer quantidade.
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-40 flex-1">
          <label className="rotulo" htmlFor="busca">
            Buscar
          </label>
          <input
            id="busca"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="campo"
            placeholder="palavra do enunciado"
          />
        </div>
        <div>
          <label className="rotulo" htmlFor="ftipo">
            Tipo
          </label>
          <select id="ftipo" value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} className="campo">
            <option value="">Todos</option>
            {TIPOS_QUESTAO.map((t) => (
              <option key={t} value={t}>
                {ROTULO_TIPO[t]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="rotulo" htmlFor="ftopico">
            Tópico
          </label>
          <select id="ftopico" value={filtroTopico} onChange={(e) => setFiltroTopico(e.target.value)} className="campo">
            <option value="">Todos</option>
            {topicos.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <button type="button" onClick={alternarVisiveis} className="btn-secundario" disabled={!idsVisiveis.length}>
          {todosVisiveisMarcados ? "Desmarcar" : "Marcar"} os {idsVisiveis.length} visíveis
        </button>
      </div>

      <ul className="space-y-2">
        {visiveis.map((questao) => {
          const marcada = selecionadas.includes(questao.id);
          return (
            <li key={questao.id}>
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-lg border-2 bg-white p-3.5 transition-colors ${
                  marcada ? "border-blue-600 bg-blue-50/60" : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <input
                  type="checkbox"
                  checked={marcada}
                  onChange={() => alternar(questao.id)}
                  className="mt-1 h-4 w-4 shrink-0 rounded accent-blue-700"
                />
                <span className="min-w-0 flex-1">
                  <span className="mb-1.5 flex flex-wrap items-center gap-1.5">
                    <span className="etiqueta bg-blue-100 text-blue-800">{ROTULO_TIPO[questao.tipo]}</span>
                    <span className="etiqueta bg-slate-100 text-slate-600">
                      {ROTULO_DIFICULDADE[questao.dificuldade]}
                    </span>
                    {questao.topico_nome && (
                      <span className="etiqueta bg-slate-100 text-slate-600">{questao.topico_nome}</span>
                    )}
                    <span className="etiqueta bg-slate-100 text-slate-600">{questao.pontos} pt</span>
                  </span>
                  <span className="block text-sm text-slate-800">{questao.enunciado}</span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>

      {visiveis.length === 0 && (
        <p className="cartao p-8 text-center text-sm text-slate-500">Nenhuma questão com esses filtros.</p>
      )}
    </form>
  );
}

function Salvar() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primario ml-auto" disabled={pending}>
      {pending ? "Salvando..." : "Salvar seleção"}
    </button>
  );
}
