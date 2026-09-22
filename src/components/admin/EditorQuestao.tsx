"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { salvarQuestaoAction, type EstadoQuestao } from "@/app/admin/(painel)/questoes/actions";
import type { QuestaoCompleta, Topico } from "@/lib/tipos";
import { DESCRICAO_TIPO, ROTULO_TIPO, TIPOS_QUESTAO, type TipoQuestao } from "@/lib/tipos";

type ItemEditor = {
  chave: string;
  id: number | null;
  texto: string;
  texto_par: string;
  correta: boolean;
  grupo_lacuna: number | null;
};

let contador = 0;
const novaChave = () => `i${++contador}`;

function itemVazio(grupo: number | null = null): ItemEditor {
  return { chave: novaChave(), id: null, texto: "", texto_par: "", correta: false, grupo_lacuna: grupo };
}

function padraoDoTipo(tipo: TipoQuestao): ItemEditor[] {
  if (tipo === "verdadeiro_falso") {
    return [
      { ...itemVazio(), texto: "Verdadeiro" },
      { ...itemVazio(), texto: "Falso" },
    ];
  }
  if (tipo === "lacunas") return [];
  if (tipo === "ordenacao" || tipo === "associacao") return [itemVazio(), itemVazio(), itemVazio()];
  return [itemVazio(), itemVazio(), itemVazio(), itemVazio()];
}

function gruposDoCodigo(codigo: string): number[] {
  const encontrados = [...codigo.matchAll(/\{\{(\d+)\}\}/g)].map((m) => Number(m[1]));
  return [...new Set(encontrados)].sort((a, b) => a - b);
}

export default function EditorQuestao({
  ucId,
  topicos,
  questao,
}: {
  ucId: number;
  topicos: Topico[];
  questao?: QuestaoCompleta;
}) {
  const [estado, acao] = useActionState<EstadoQuestao, FormData>(
    salvarQuestaoAction.bind(null, ucId, questao?.id ?? null),
    { erro: null }
  );

  const [tipo, setTipo] = useState<TipoQuestao>(questao?.tipo ?? "multipla_escolha");
  const [codigo, setCodigo] = useState(questao?.codigo ?? "");
  const [itens, setItens] = useState<ItemEditor[]>(() =>
    questao
      ? questao.itens.map((i) => ({
          chave: novaChave(),
          id: i.id,
          texto: i.texto,
          texto_par: i.texto_par ?? "",
          correta: i.correta === 1,
          grupo_lacuna: i.grupo_lacuna,
        }))
      : padraoDoTipo("multipla_escolha")
  );

  const grupos = useMemo(() => (tipo === "lacunas" ? gruposDoCodigo(codigo) : []), [tipo, codigo]);

  // Ao aparecer um {{n}} novo no código, já abre três opções para ele.
  useEffect(() => {
    if (tipo !== "lacunas") return;
    setItens((atuais) => {
      const existentes = new Set(atuais.map((i) => i.grupo_lacuna));
      const novos = grupos.filter((g) => !existentes.has(g)).flatMap((g) => [itemVazio(g), itemVazio(g), itemVazio(g)]);
      return novos.length ? [...atuais, ...novos] : atuais;
    });
  }, [grupos, tipo]);

  function trocarTipo(novo: TipoQuestao) {
    setTipo(novo);
    // Trocar o tipo muda o significado dos itens; recomeçar evita salvar lixo.
    if (novo !== tipo) setItens(padraoDoTipo(novo));
  }

  const atualizar = (chave: string, mudanca: Partial<ItemEditor>) =>
    setItens((atuais) => atuais.map((i) => (i.chave === chave ? { ...i, ...mudanca } : i)));

  const marcarUnica = (chave: string) =>
    setItens((atuais) => atuais.map((i) => ({ ...i, correta: i.chave === chave })));

  const marcarUnicaNoGrupo = (chave: string, grupo: number) =>
    setItens((atuais) =>
      atuais.map((i) => (i.grupo_lacuna === grupo ? { ...i, correta: i.chave === chave } : i))
    );

  const remover = (chave: string) => setItens((atuais) => atuais.filter((i) => i.chave !== chave));

  const mover = (indice: number, destino: number) =>
    setItens((atuais) => {
      if (destino < 0 || destino >= atuais.length) return atuais;
      const copia = [...atuais];
      const [item] = copia.splice(indice, 1);
      copia.splice(destino, 0, item);
      return copia;
    });

  const serializado = JSON.stringify(
    itens.map((i) => ({
      id: i.id,
      texto: i.texto,
      texto_par: i.texto_par,
      correta: i.correta,
      grupo_lacuna: i.grupo_lacuna,
    }))
  );

  return (
    <form action={acao} className="space-y-6">
      <input type="hidden" name="itens" value={serializado} />
      <input type="hidden" name="tipo" value={tipo} />

      {/* ---- Tipo ---- */}
      <section className="cartao p-5">
        <h2 className="mb-3 font-semibold text-slate-900">Tipo de questão</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {TIPOS_QUESTAO.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => trocarTipo(t)}
              className={`rounded-lg border-2 p-3 text-left transition-colors ${
                tipo === t ? "border-blue-600 bg-blue-50" : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <span className="block text-sm font-semibold text-slate-900">{ROTULO_TIPO[t]}</span>
              <span className="mt-0.5 block text-xs leading-snug text-slate-500">{DESCRICAO_TIPO[t]}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ---- Conteúdo ---- */}
      <section className="cartao space-y-4 p-5">
        <h2 className="font-semibold text-slate-900">Conteúdo</h2>

        <div>
          <label className="rotulo" htmlFor="contexto">
            Contexto / caso de uso <span className="font-normal text-slate-400">(opcional)</span>
          </label>
          <textarea
            id="contexto"
            name="contexto"
            rows={2}
            defaultValue={questao?.contexto ?? ""}
            placeholder="A situação que faz o aluno pensar antes de ler a pergunta."
            className="campo"
          />
        </div>

        <div>
          <label className="rotulo" htmlFor="enunciado">
            Enunciado
          </label>
          <textarea
            id="enunciado"
            name="enunciado"
            rows={2}
            required
            defaultValue={questao?.enunciado ?? ""}
            className="campo"
          />
        </div>

        <div>
          <label className="rotulo" htmlFor="codigo">
            Código {tipo === "lacunas" && <span className="text-amber-700">— obrigatório, use {"{{1}}"}, {"{{2}}"}</span>}
          </label>
          <textarea
            id="codigo"
            name="codigo"
            rows={tipo === "lacunas" ? 6 : 4}
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
            spellCheck={false}
            placeholder={
              tipo === "lacunas"
                ? 'const titulo = document.{{1}}("titulo");\ntitulo.{{2}} = "Novo título!";'
                : "Cole aqui o fragmento de código da questão (opcional)."
            }
            className="campo font-mono text-[13px]"
          />
        </div>

        <div>
          <label className="rotulo" htmlFor="explicacao">
            Explicação do gabarito
          </label>
          <textarea
            id="explicacao"
            name="explicacao"
            rows={3}
            defaultValue={questao?.explicacao ?? ""}
            placeholder="Aparece no resultado quando a avaliação mostra o gabarito comentado."
            className="campo"
          />
        </div>
      </section>

      {/* ---- Alternativas ---- */}
      <section className="cartao space-y-4 p-5">
        <h2 className="font-semibold text-slate-900">
          {tipo === "associacao" ? "Pares" : tipo === "ordenacao" ? "Etapas" : "Alternativas"}
        </h2>

        {tipo === "lacunas" ? (
          grupos.length === 0 ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Escreva o código acima usando {"{{1}}"} onde deve aparecer a primeira lista de opções.
            </p>
          ) : (
            grupos.map((grupo) => (
              <div key={grupo} className="rounded-lg border border-slate-200 p-4">
                <p className="mb-3 text-sm font-semibold text-slate-700">
                  Lacuna {"{{"}{grupo}{"}}"}<span className="ml-2 font-normal text-slate-500">marque a opção correta</span>
                </p>
                <div className="space-y-2">
                  {itens
                    .filter((i) => i.grupo_lacuna === grupo)
                    .map((item) => (
                      <div key={item.chave} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`correta_${grupo}`}
                          checked={item.correta}
                          onChange={() => marcarUnicaNoGrupo(item.chave, grupo)}
                          className="h-4 w-4 shrink-0 accent-emerald-600"
                          aria-label="Opção correta"
                        />
                        <input
                          value={item.texto}
                          onChange={(e) => atualizar(item.chave, { texto: e.target.value })}
                          placeholder="getElementById"
                          className="campo font-mono text-[13px]"
                        />
                        <BotaoRemover onClick={() => remover(item.chave)} />
                      </div>
                    ))}
                </div>
                <button
                  type="button"
                  onClick={() => setItens((a) => [...a, itemVazio(grupo)])}
                  className="mt-3 text-sm font-medium text-blue-700 hover:underline"
                >
                  + opção nesta lacuna
                </button>
              </div>
            ))
          )
        ) : (
          <>
            <div className="space-y-2">
              {itens.map((item, indice) => (
                <div key={item.chave} className="flex items-start gap-2">
                  {tipo === "ordenacao" ? (
                    <span className="mt-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-700 text-xs font-bold text-white">
                      {indice + 1}
                    </span>
                  ) : tipo === "associacao" ? (
                    <span className="mt-2.5 w-6 shrink-0 text-center text-xs font-semibold text-slate-400">
                      {indice + 1}
                    </span>
                  ) : (
                    <input
                      type={tipo === "multipla_resposta" ? "checkbox" : "radio"}
                      name="correta_unica"
                      checked={item.correta}
                      onChange={(e) =>
                        tipo === "multipla_resposta"
                          ? atualizar(item.chave, { correta: e.target.checked })
                          : marcarUnica(item.chave)
                      }
                      className="mt-3 h-4 w-4 shrink-0 accent-emerald-600"
                      aria-label="Alternativa correta"
                    />
                  )}

                  <div className="flex-1 space-y-2">
                    <input
                      value={item.texto}
                      onChange={(e) => atualizar(item.chave, { texto: e.target.value })}
                      placeholder={
                        tipo === "associacao"
                          ? "Coluna A (ex.: await)"
                          : tipo === "ordenacao"
                            ? `Etapa ${indice + 1}`
                            : "Texto da alternativa"
                      }
                      readOnly={tipo === "verdadeiro_falso"}
                      className={`campo ${tipo === "verdadeiro_falso" ? "bg-slate-50" : ""}`}
                    />
                    {tipo === "associacao" && (
                      <input
                        value={item.texto_par}
                        onChange={(e) => atualizar(item.chave, { texto_par: e.target.value })}
                        placeholder="Coluna B (o par correspondente)"
                        className="campo"
                      />
                    )}
                  </div>

                  {tipo === "ordenacao" && (
                    <span className="mt-1 flex shrink-0 flex-col gap-0.5">
                      <button
                        type="button"
                        onClick={() => mover(indice, indice - 1)}
                        disabled={indice === 0}
                        className="rounded border border-slate-300 px-1.5 text-xs leading-5 text-slate-600 disabled:opacity-30"
                        aria-label="Subir"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => mover(indice, indice + 1)}
                        disabled={indice === itens.length - 1}
                        className="rounded border border-slate-300 px-1.5 text-xs leading-5 text-slate-600 disabled:opacity-30"
                        aria-label="Descer"
                      >
                        ▼
                      </button>
                    </span>
                  )}

                  {tipo !== "verdadeiro_falso" && <BotaoRemover onClick={() => remover(item.chave)} />}
                </div>
              ))}
            </div>

            {tipo !== "verdadeiro_falso" && (
              <button
                type="button"
                onClick={() => setItens((a) => [...a, itemVazio()])}
                className="text-sm font-medium text-blue-700 hover:underline"
              >
                + {tipo === "associacao" ? "par" : tipo === "ordenacao" ? "etapa" : "alternativa"}
              </button>
            )}

            {tipo === "ordenacao" && (
              <p className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900">
                A ordem em que você digitou é a ordem correta. O aluno recebe embaralhado.
              </p>
            )}
          </>
        )}
      </section>

      {/* ---- Classificação ---- */}
      <section className="cartao space-y-4 p-5">
        <h2 className="font-semibold text-slate-900">Classificação</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="rotulo" htmlFor="topico_id">
              Tópico
            </label>
            <select id="topico_id" name="topico_id" defaultValue={questao?.topico_id ?? 0} className="campo">
              <option value={0}>Sem tópico</option>
              {topicos.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="rotulo" htmlFor="dificuldade">
              Dificuldade
            </label>
            <select id="dificuldade" name="dificuldade" defaultValue={questao?.dificuldade ?? "media"} className="campo">
              <option value="facil">Fácil</option>
              <option value="media">Média</option>
              <option value="dificil">Difícil</option>
            </select>
          </div>
          <div>
            <label className="rotulo" htmlFor="pontos">
              Pontos
            </label>
            <input
              id="pontos"
              name="pontos"
              type="number"
              step="0.5"
              min="0.5"
              defaultValue={questao?.pontos ?? 1}
              className="campo"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              name="embaralhar_itens"
              defaultChecked={questao ? questao.embaralhar_itens === 1 : tipo !== "verdadeiro_falso"}
              className="h-4 w-4 accent-blue-700"
            />
            Embaralhar as alternativas
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              name="ativa"
              defaultChecked={questao ? questao.ativa === 1 : true}
              className="h-4 w-4 accent-blue-700"
            />
            Questão ativa no banco
          </label>
        </div>
      </section>

      {estado.erro && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {estado.erro}
        </p>
      )}

      <Salvar novo={!questao} />
    </form>
  );
}

function BotaoRemover({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-1 shrink-0 rounded px-2 py-1.5 text-sm text-slate-400 hover:bg-red-50 hover:text-red-600"
      aria-label="Remover"
    >
      ✕
    </button>
  );
}

function Salvar({ novo }: { novo: boolean }) {
  const { pending } = useFormStatus();
  return (
    <div className="sticky bottom-0 -mx-4 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
      <button type="submit" className="btn-primario w-full sm:w-auto" disabled={pending}>
        {pending ? "Salvando..." : novo ? "Cadastrar questão" : "Salvar questão"}
      </button>
    </div>
  );
}
