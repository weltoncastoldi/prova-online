"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { iniciarProva, type EstadoInicio } from "./actions";

export default function FormNome({ slug }: { slug: string }) {
  const [estado, acao] = useActionState<EstadoInicio, FormData>(iniciarProva.bind(null, slug), {
    erro: null,
  });

  return (
    <form action={acao} className="space-y-4">
      <div>
        <label htmlFor="nome" className="rotulo">
          Nome completo
        </label>
        <input
          id="nome"
          name="nome"
          type="text"
          required
          autoComplete="name"
          autoFocus
          maxLength={160}
          placeholder="Ex.: Ana Beatriz Souza"
          className="campo text-base"
        />
        <p className="ajuda">
          Escreva como está na chamada. É por este nome que sua nota será registrada.
        </p>
      </div>

      {estado.erro && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {estado.erro}
        </p>
      )}

      <BotaoIniciar />
    </form>
  );
}

function BotaoIniciar() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primario w-full" disabled={pending}>
      {pending ? "Preparando sua prova..." : "Iniciar prova"}
    </button>
  );
}
