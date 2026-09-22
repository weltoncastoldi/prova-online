import { NextResponse } from "next/server";
import { consultarUm } from "@/lib/db";
import { TAMANHO_MINIMO_SEGREDO, segredoConfigurado } from "@/lib/session";

export const dynamic = "force-dynamic";

/**
 * Checagem de configuração do servidor, para usar logo depois de publicar.
 *
 * Responde apenas com "sim/não" e contagens: nenhum valor de variável de
 * ambiente, senha ou dado de aluno sai daqui. Depois que a publicação estiver
 * funcionando, este arquivo pode ser apagado sem afetar mais nada.
 */
export async function GET() {
  const relatorio: Record<string, unknown> = {
    app: "ok",
    // Só o nome das variáveis e se estão preenchidas, nunca o conteúdo.
    variaveis: {
      DB_HOST: !!process.env.DB_HOST,
      DB_PORT: !!process.env.DB_PORT,
      DB_NAME: !!process.env.DB_NAME,
      DB_USER: !!process.env.DB_USER,
      DB_PASSWORD: !!process.env.DB_PASSWORD,
      APP_SECRET: !!process.env.APP_SECRET,
    },
    app_secret: {
      definido: !!process.env.APP_SECRET,
      tamanho: (process.env.APP_SECRET ?? "").length,
      minimo_exigido: TAMANHO_MINIMO_SEGREDO,
      valido: segredoConfigurado(),
    },
  };

  try {
    const linha = await consultarUm<{ migracoes: number; professores: number; questoes: number }>(
      `SELECT (SELECT COUNT(*) FROM migracao)  AS migracoes,
              (SELECT COUNT(*) FROM professor) AS professores,
              (SELECT COUNT(*) FROM questao)   AS questoes`
    );
    relatorio.banco = { conectado: true, ...linha };
  } catch (erro) {
    relatorio.banco = {
      conectado: false,
      // O código do erro basta para saber o que corrigir; a mensagem completa
      // pode conter host e usuário, então fica só no log do servidor.
      codigo: (erro as { code?: string })?.code ?? "desconhecido",
    };
    console.error("[diagnostico] banco inacessível:", erro);
  }

  const tudoCerto =
    segredoConfigurado() && (relatorio.banco as { conectado: boolean }).conectado;

  return NextResponse.json({ tudo_certo: tudoCerto, ...relatorio }, { status: tudoCerto ? 200 : 503 });
}
