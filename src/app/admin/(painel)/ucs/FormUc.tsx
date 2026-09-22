"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { Uc } from "@/lib/tipos";
import { salvarUc, type EstadoForm } from "./actions";

export default function FormUc({ uc }: { uc?: Uc }) {
  const [estado, acao] = useActionState<EstadoForm, FormData>(salvarUc, { erro: null });

  return (
    <form action={acao} className="space-y-4">
      {uc && <input type="hidden" name="id" value={uc.id} />}

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="rotulo" htmlFor="codigo">
            Código
          </label>
          <input
            id="codigo"
            name="codigo"
            defaultValue={uc?.codigo ?? ""}
            required
            maxLength={30}
            placeholder="INT-API"
            className="campo"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="rotulo" htmlFor="nome">
            Nome da unidade curricular
          </label>
          <input
            id="nome"
            name="nome"
            defaultValue={uc?.nome ?? ""}
            required
            maxLength={160}
            placeholder="Integração com APIs"
            className="campo"
          />
        </div>
      </div>

      <div>
        <label className="rotulo" htmlFor="descricao">
          Descrição
        </label>
        <textarea
          id="descricao"
          name="descricao"
          rows={2}
          defaultValue={uc?.descricao ?? ""}
          className="campo"
          placeholder="O que esta unidade cobre"
        />
      </div>

      <div className="flex flex-wrap items-end gap-6">
        <div className="w-40">
          <label className="rotulo" htmlFor="carga_horaria">
            Carga horária
          </label>
          <input
            id="carga_horaria"
            name="carga_horaria"
            type="number"
            min={0}
            defaultValue={uc?.carga_horaria ?? ""}
            className="campo"
          />
        </div>

        {uc && (
          <label className="flex items-center gap-2 pb-2.5 text-sm text-slate-700">
            <input type="checkbox" name="ativo" defaultChecked={uc.ativo === 1} className="h-4 w-4 accent-blue-700" />
            Unidade ativa
          </label>
        )}
      </div>

      {estado.erro && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {estado.erro}
        </p>
      )}
      {estado.ok && <p className="text-sm font-medium text-emerald-700">Salvo.</p>}

      <Botao novo={!uc} />
    </form>
  );
}

function Botao({ novo }: { novo: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primario" disabled={pending}>
      {pending ? "Salvando..." : novo ? "Criar unidade" : "Salvar alterações"}
    </button>
  );
}
