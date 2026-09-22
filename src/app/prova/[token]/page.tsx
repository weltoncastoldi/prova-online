import { notFound, redirect } from "next/navigation";
import { obterPorToken } from "@/lib/repos/tentativas";

export const dynamic = "force-dynamic";

/** Porta de entrada da tentativa: manda o aluno para onde ele parou. */
export default async function RetomarProva({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const tentativa = await obterPorToken(token);
  if (!tentativa) notFound();

  if (tentativa.status !== "em_andamento") redirect(`/resultado/${token}`);
  redirect(`/prova/${token}/${tentativa.questao_atual}`);
}
