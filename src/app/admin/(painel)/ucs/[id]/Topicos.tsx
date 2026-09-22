"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { TopicoComContagem } from "@/lib/repos/catalogo";
import { removerTopico, salvarTopico, type EstadoForm } from "../actions";

export default function Topicos({ ucId, topicos }: { ucId: number; topicos: TopicoComContagem[] }) {
  const [estado, acao] = useActionState<EstadoForm, FormData>(salvarTopico.bind(null, ucId), { erro: null });

  return (
    <div className="space-y-5">
      <ul className="divide-y divide-slate-200">
        {topicos.map((topico) => (
          <li key={topico.id} className="flex items-center gap-3 py-2.5">
            <span className="w-8 shrink-0 text-sm text-slate-400">{topico.ordem}</span>
            <span className="flex-1 text-sm text-slate-800">{topico.nome}</span>
            <span className="shrink-0 text-xs text-slate-500">{topico.total_questoes} questões</span>
            <form action={removerTopico.bind(null, topico.id, ucId)}>
              <button
                type="submit"
                className="shrink-0 rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                title="As questões deste tópico continuam no banco, apenas sem tópico."
              >
                Remover
              </button>
            </form>
          </li>
        ))}
        {topicos.length === 0 && <li className="py-3 text-sm text-slate-500">Nenhum tópico ainda.</li>}
      </ul>

      <form action={acao} className="flex flex-wrap items-end gap-3 border-t border-slate-200 pt-5">
        <div className="w-20">
          <label className="rotulo" htmlFor="ordem">
            Ordem
          </label>
          <input
            id="ordem"
            name="ordem"
            type="number"
            min={0}
            defaultValue={topicos.length + 1}
            className="campo"
          />
        </div>
        <div className="min-w-56 flex-1">
          <label className="rotulo" htmlFor="nome-topico">
            Novo tópico
          </label>
          <input
            id="nome-topico"
            name="nome"
            required
            maxLength={160}
            placeholder="Consumindo a API: fetch, JSON e erros"
            className="campo"
          />
        </div>
        <Adicionar />
      </form>

      {estado.erro && <p className="text-sm text-red-700">{estado.erro}</p>}
    </div>
  );
}

function Adicionar() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-secundario" disabled={pending}>
      {pending ? "Salvando..." : "Adicionar"}
    </button>
  );
}
