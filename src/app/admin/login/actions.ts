"use server";

import { redirect } from "next/navigation";
import { autenticar } from "@/lib/auth";
import { ConfiguracaoAusente } from "@/lib/session";

export type EstadoLogin = { erro: string | null };

/**
 * Traduz falhas de infraestrutura em algo que dá para agir.
 *
 * Sem isto, qualquer erro aqui virava a tela branca de "server-side exception"
 * com um digest, que não diz nada a quem está publicando o sistema.
 */
function mensagemDeFalha(erro: unknown): string {
  if (erro instanceof ConfiguracaoAusente) return erro.message;

  const codigo = (erro as { code?: string })?.code ?? "";

  if (codigo === "ER_ACCESS_DENIED_ERROR") {
    return "O banco recusou o usuário ou a senha. Confira DB_USER e DB_PASSWORD no painel da hospedagem.";
  }
  if (codigo === "ER_BAD_DB_ERROR") {
    return "O banco informado em DB_NAME não existe no servidor.";
  }
  if (codigo === "ECONNREFUSED" || codigo === "ENOTFOUND" || codigo === "ETIMEDOUT") {
    return "Não foi possível alcançar o servidor de banco de dados. Confira DB_HOST e DB_PORT.";
  }
  if (codigo === "ER_NO_SUCH_TABLE") {
    return "As tabelas não existem neste banco. Rode as migrações (npm run migrar) e publique de novo.";
  }

  return "Falha inesperada no servidor. Veja os logs da aplicação na hospedagem.";
}

export async function entrar(_anterior: EstadoLogin, dados: FormData): Promise<EstadoLogin> {
  const email = String(dados.get("email") ?? "").trim();
  const senha = String(dados.get("senha") ?? "");

  if (!email || !senha) return { erro: "Informe e-mail e senha." };

  let resultado: Awaited<ReturnType<typeof autenticar>>;
  try {
    resultado = await autenticar(email, senha);
  } catch (erro) {
    // O log completo fica no servidor; o usuário recebe a versão útil.
    console.error("[login] falha ao autenticar:", erro);
    return { erro: mensagemDeFalha(erro) };
  }

  if (!resultado.ok) return { erro: resultado.erro };

  // Fora do try: redirect sinaliza por exceção e não deve ser capturado.
  redirect("/admin");
}
