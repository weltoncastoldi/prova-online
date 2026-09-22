"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { entrar, type EstadoLogin } from "./actions";

export default function PaginaLogin() {
  const [estado, acao] = useActionState<EstadoLogin, FormData>(entrar, { erro: null });

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-4">
      <div className="w-full">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Área do professor</h1>
          <p className="mt-1 text-sm text-slate-500">Entre para gerenciar UCs, questões e avaliações.</p>
        </div>

        <form action={acao} className="cartao space-y-4 p-6">
          <div>
            <label htmlFor="email" className="rotulo">
              E-mail
            </label>
            <input id="email" name="email" type="email" required autoComplete="username" className="campo" />
          </div>

          <div>
            <label htmlFor="senha" className="rotulo">
              Senha
            </label>
            <input
              id="senha"
              name="senha"
              type="password"
              required
              autoComplete="current-password"
              className="campo"
            />
          </div>

          {estado.erro && (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {estado.erro}
            </p>
          )}

          <Botao />
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          <Link href="/" className="hover:underline">
            ← Voltar para as provas
          </Link>
        </p>
      </div>
    </main>
  );
}

function Botao() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primario w-full" disabled={pending}>
      {pending ? "Entrando..." : "Entrar"}
    </button>
  );
}
