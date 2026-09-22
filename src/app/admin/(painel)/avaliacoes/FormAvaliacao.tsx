"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import type { Avaliacao, Uc } from "@/lib/tipos";
import { ROTULO_EXIBIR_RESULTADO } from "@/lib/tipos";
import { salvarAvaliacaoAction, type EstadoAvaliacao } from "./actions";

/** Date do banco -> valor aceito pelo input datetime-local, em horário local. */
function paraInput(valor: Date | string | null): string {
  if (!valor) return "";
  const data = valor instanceof Date ? valor : new Date(valor);
  if (Number.isNaN(data.getTime())) return "";
  const dois = (n: number) => String(n).padStart(2, "0");
  return `${data.getFullYear()}-${dois(data.getMonth() + 1)}-${dois(data.getDate())}T${dois(
    data.getHours()
  )}:${dois(data.getMinutes())}`;
}

export default function FormAvaliacao({
  ucs,
  avaliacao,
  ucPadrao,
}: {
  ucs: Uc[];
  avaliacao?: Avaliacao;
  ucPadrao?: number;
}) {
  const [estado, acao] = useActionState<EstadoAvaliacao, FormData>(
    salvarAvaliacaoAction.bind(null, avaliacao?.id ?? null),
    { erro: null }
  );
  const [comTempo, setComTempo] = useState(!!avaliacao?.tempo_limite_min);

  return (
    <form action={acao} className="space-y-6">
      <section className="cartao space-y-4 p-5">
        <h2 className="font-semibold text-slate-900">Identificação</h2>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className="rotulo" htmlFor="titulo">
              Título
            </label>
            <input
              id="titulo"
              name="titulo"
              required
              maxLength={180}
              defaultValue={avaliacao?.titulo ?? ""}
              placeholder="Avaliação final - Integração com APIs"
              className="campo"
            />
          </div>
          <div>
            <label className="rotulo" htmlFor="uc_id">
              Unidade curricular
            </label>
            <select
              id="uc_id"
              name="uc_id"
              required
              defaultValue={avaliacao?.uc_id ?? ucPadrao ?? ""}
              className="campo"
            >
              <option value="">Selecione...</option>
              {ucs.map((uc) => (
                <option key={uc.id} value={uc.id}>
                  {uc.nome}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="rotulo" htmlFor="slug">
            Endereço público
          </label>
          <div className="flex items-center gap-1 text-sm text-slate-500">
            <span className="shrink-0">/p/</span>
            <input
              id="slug"
              name="slug"
              maxLength={80}
              defaultValue={avaliacao?.slug ?? ""}
              placeholder="gerado a partir do título"
              className="campo"
            />
          </div>
          <p className="ajuda">É o link que você passa para a turma.</p>
        </div>

        <div>
          <label className="rotulo" htmlFor="descricao">
            Descrição
          </label>
          <input id="descricao" name="descricao" defaultValue={avaliacao?.descricao ?? ""} className="campo" />
        </div>

        <div>
          <label className="rotulo" htmlFor="instrucoes">
            Instruções para o aluno
          </label>
          <textarea
            id="instrucoes"
            name="instrucoes"
            rows={3}
            defaultValue={avaliacao?.instrucoes ?? ""}
            placeholder="Aparecem na tela antes de começar."
            className="campo"
          />
        </div>
      </section>

      <section className="cartao space-y-4 p-5">
        <h2 className="font-semibold text-slate-900">Regras da aplicação</h2>

        <div className="space-y-3">
          <Marcar nome="embaralhar_questoes" padrao={avaliacao ? avaliacao.embaralhar_questoes === 1 : true}>
            Embaralhar a ordem das questões para cada aluno
          </Marcar>
          <Marcar nome="embaralhar_alternativas" padrao={avaliacao ? avaliacao.embaralhar_alternativas === 1 : true}>
            Embaralhar as alternativas dentro de cada questão
          </Marcar>
          <Marcar nome="permite_voltar" padrao={avaliacao ? avaliacao.permite_voltar === 1 : false}>
            Permitir que o aluno volte para rever questões já respondidas
          </Marcar>
          <Marcar nome="tentativa_unica" padrao={avaliacao ? avaliacao.tentativa_unica === 1 : true}>
            Uma única tentativa por nome
          </Marcar>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={comTempo}
                onChange={(e) => setComTempo(e.target.checked)}
                className="h-4 w-4 accent-blue-700"
              />
              Tempo limite
            </label>
            <div className="mt-1.5 flex items-center gap-2">
              <input
                name="tempo_limite_min"
                type="number"
                min={1}
                disabled={!comTempo}
                defaultValue={avaliacao?.tempo_limite_min ?? 60}
                className="campo w-28 disabled:bg-slate-100"
              />
              <span className="text-sm text-slate-500">minutos</span>
            </div>
          </div>

          <div>
            <label className="rotulo" htmlFor="nota_minima">
              Nota mínima para aprovação
            </label>
            <input
              id="nota_minima"
              name="nota_minima"
              type="number"
              step="0.5"
              min="0"
              max="10"
              defaultValue={avaliacao?.nota_minima ?? 6}
              className="campo w-28"
            />
          </div>
        </div>

        <div>
          <label className="rotulo" htmlFor="exibir_resultado">
            O que o aluno vê ao finalizar
          </label>
          <select
            id="exibir_resultado"
            name="exibir_resultado"
            defaultValue={avaliacao?.exibir_resultado ?? "nota"}
            className="campo"
          >
            {Object.entries(ROTULO_EXIBIR_RESULTADO).map(([valor, rotulo]) => (
              <option key={valor} value={valor}>
                {rotulo}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="rotulo" htmlFor="abre_em">
              Abre em <span className="font-normal text-slate-400">(opcional)</span>
            </label>
            <input
              id="abre_em"
              name="abre_em"
              type="datetime-local"
              defaultValue={paraInput(avaliacao?.abre_em ?? null)}
              className="campo"
            />
          </div>
          <div>
            <label className="rotulo" htmlFor="fecha_em">
              Fecha em <span className="font-normal text-slate-400">(opcional)</span>
            </label>
            <input
              id="fecha_em"
              name="fecha_em"
              type="datetime-local"
              defaultValue={paraInput(avaliacao?.fecha_em ?? null)}
              className="campo"
            />
          </div>
        </div>

        <div>
          <label className="rotulo" htmlFor="status">
            Situação
          </label>
          <select id="status" name="status" defaultValue={avaliacao?.status ?? "rascunho"} className="campo sm:w-64">
            <option value="rascunho">Rascunho (invisível para os alunos)</option>
            <option value="publicada">Publicada (aceita respostas)</option>
            <option value="encerrada">Encerrada (não aceita mais)</option>
          </select>
        </div>
      </section>

      {estado.erro && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {estado.erro}
        </p>
      )}

      <Salvar novo={!avaliacao} />
    </form>
  );
}

function Marcar({ nome, padrao, children }: { nome: string; padrao: boolean; children: React.ReactNode }) {
  return (
    <label className="flex items-start gap-2.5 text-sm text-slate-700">
      <input type="checkbox" name={nome} defaultChecked={padrao} className="mt-0.5 h-4 w-4 accent-blue-700" />
      <span>{children}</span>
    </label>
  );
}

function Salvar({ novo }: { novo: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primario" disabled={pending}>
      {pending ? "Salvando..." : novo ? "Criar e escolher questões" : "Salvar alterações"}
    </button>
  );
}
