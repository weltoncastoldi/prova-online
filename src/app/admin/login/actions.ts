"use server";

import { redirect } from "next/navigation";
import { autenticar } from "@/lib/auth";

export type EstadoLogin = { erro: string | null };

export async function entrar(_anterior: EstadoLogin, dados: FormData): Promise<EstadoLogin> {
  const email = String(dados.get("email") ?? "").trim();
  const senha = String(dados.get("senha") ?? "");

  if (!email || !senha) return { erro: "Informe e-mail e senha." };

  const resultado = await autenticar(email, senha);
  if (!resultado.ok) return { erro: resultado.erro };

  redirect("/admin");
}
