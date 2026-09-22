import { NextResponse } from "next/server";
import { sessaoAtual } from "@/lib/auth";
import { formatarDataHora } from "@/lib/datas";
import { obterAvaliacao } from "@/lib/repos/avaliacoes";
import { tentativasDaAvaliacao } from "@/lib/repos/tentativas";

/** Campo CSV no dialeto que o Excel em português abre sem reclamar. */
function campo(valor: unknown): string {
  const texto = valor == null ? "" : String(valor);
  return `"${texto.replace(/"/g, '""')}"`;
}

export async function GET(_requisicao: Request, contexto: { params: Promise<{ id: string }> }) {
  if (!(await sessaoAtual())) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  }

  const { id } = await contexto.params;
  const avaliacao = await obterAvaliacao(Number(id));
  if (!avaliacao) return NextResponse.json({ erro: "Avaliação não encontrada" }, { status: 404 });

  const tentativas = await tentativasDaAvaliacao(avaliacao.id);

  const cabecalho = [
    "Aluno", "Situacao", "Acertos", "Total de questoes",
    "Pontos obtidos", "Pontos possiveis", "Nota", "Duracao (min)",
    "Inicio", "Fim",
  ];

  const linhas = tentativas.map((t) =>
    [
      t.aluno_nome,
      t.status,
      t.acertos,
      t.total_questoes,
      String(t.pontos_obtidos).replace(".", ","),
      String(t.pontos_possiveis).replace(".", ","),
      t.nota == null ? "" : String(t.nota).replace(".", ","),
      t.duracao_min == null ? "" : String(t.duracao_min).replace(".", ","),
      formatarDataHora(t.iniciada_em),
      formatarDataHora(t.finalizada_em),
    ].map(campo).join(";")
  );

  // O BOM faz o Excel reconhecer UTF-8 e mostrar os acentos corretamente.
  const csv = "﻿" + [cabecalho.map(campo).join(";"), ...linhas].join("\r\n");
  const arquivo = `notas-${avaliacao.slug}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${arquivo}"`,
    },
  });
}
