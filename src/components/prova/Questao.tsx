"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import type { DadosWidget, Opcao } from "@/lib/exibicao";

type Props = {
  dados: DadosWidget;
  acao: (dados: FormData) => void | Promise<void>;
  ultima: boolean;
};

export default function Questao({ dados, acao, ultima }: Props) {
  // O botão só libera quando a questão está de fato respondida. A mesma
  // validação existe no servidor; esta aqui evita o aluno perder a viagem.
  const [respondido, setRespondido] = useState(dados.tipo === "ordenacao");

  return (
    <form action={acao} className="space-y-6">
      {dados.tipo === "unica" && <Unica opcoes={dados.opcoes} aoMudar={() => setRespondido(true)} />}

      {dados.tipo === "varias" && <Varias opcoes={dados.opcoes} aoMudar={setRespondido} />}

      {dados.tipo === "lacunas" && (
        <Lacunas segmentos={dados.segmentos} grupos={dados.grupos} aoMudar={setRespondido} />
      )}

      {dados.tipo === "ordenacao" && <Ordenacao itens={dados.itens} />}

      {dados.tipo === "associacao" && (
        <Associacao esquerda={dados.esquerda} direita={dados.direita} aoMudar={setRespondido} />
      )}

      <Enviar habilitado={respondido} ultima={ultima} />
    </form>
  );
}

// ---------------------------------------------------------------------------

function Enviar({ habilitado, ultima }: { habilitado: boolean; ultima: boolean }) {
  const { pending } = useFormStatus();
  return (
    <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-5">
      <p className="text-xs text-slate-500">
        {habilitado ? "Confira sua resposta antes de avançar." : "Responda para liberar o botão."}
      </p>
      <button type="submit" className="btn-primario min-w-40" disabled={!habilitado || pending}>
        {pending ? "Salvando..." : ultima ? "Finalizar prova" : "Responder e avançar"}
      </button>
    </div>
  );
}

// --- Múltipla escolha e verdadeiro/falso -----------------------------------

function Unica({ opcoes, aoMudar }: { opcoes: Opcao[]; aoMudar: () => void }) {
  return (
    <div className="space-y-3">
      {opcoes.map((opcao, indice) => (
        <label key={opcao.id} className="alternativa">
          <input
            type="radio"
            name="item"
            value={opcao.id}
            required
            onChange={aoMudar}
            className="mt-1 h-4 w-4 shrink-0 accent-blue-700"
          />
          <span className="flex gap-2.5">
            <span className="font-semibold text-slate-400">{letra(indice)}</span>
            <span className="text-slate-800">{opcao.texto}</span>
          </span>
        </label>
      ))}
    </div>
  );
}

// --- Múltipla resposta -----------------------------------------------------

function Varias({ opcoes, aoMudar }: { opcoes: Opcao[]; aoMudar: (v: boolean) => void }) {
  const [marcados, setMarcados] = useState<number[]>([]);

  function alternar(id: number, marcado: boolean) {
    const novo = marcado ? [...marcados, id] : marcados.filter((m) => m !== id);
    setMarcados(novo);
    aoMudar(novo.length > 0);
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
        Esta questão tem mais de uma resposta correta. Marque todas.
      </p>
      {opcoes.map((opcao, indice) => (
        <label key={opcao.id} className="alternativa">
          <input
            type="checkbox"
            name="item"
            value={opcao.id}
            onChange={(e) => alternar(opcao.id, e.target.checked)}
            className="mt-1 h-4 w-4 shrink-0 rounded accent-blue-700"
          />
          <span className="flex gap-2.5">
            <span className="font-semibold text-slate-400">{letra(indice)}</span>
            <span className="text-slate-800">{opcao.texto}</span>
          </span>
        </label>
      ))}
    </div>
  );
}

// --- Completar lacunas -----------------------------------------------------

function Lacunas({
  segmentos,
  grupos,
  aoMudar,
}: {
  segmentos: Array<{ tipo: "texto"; valor: string } | { tipo: "lacuna"; grupo: number }>;
  grupos: Array<{ grupo: number; opcoes: Opcao[] }>;
  aoMudar: (v: boolean) => void;
}) {
  const [escolhas, setEscolhas] = useState<Record<number, string>>({});

  function escolher(grupo: number, valor: string) {
    const novo = { ...escolhas, [grupo]: valor };
    setEscolhas(novo);
    aoMudar(grupos.every((g) => novo[g.grupo]));
  }

  return (
    <div className="bloco-codigo whitespace-pre-wrap">
      {segmentos.map((segmento, indice) => {
        if (segmento.tipo === "texto") return <span key={indice}>{segmento.valor}</span>;
        const grupo = grupos.find((g) => g.grupo === segmento.grupo);
        if (!grupo) return null;
        return (
          <select
            key={indice}
            name={`lacuna_${grupo.grupo}`}
            required
            value={escolhas[grupo.grupo] ?? ""}
            onChange={(e) => escolher(grupo.grupo, e.target.value)}
            className="mx-1 inline-block max-w-full rounded border-2 border-amber-400 bg-slate-800
                       px-2 py-0.5 font-mono text-[13px] text-amber-200 outline-none
                       focus:border-amber-300"
          >
            <option value="">escolha {grupo.grupo}</option>
            {grupo.opcoes.map((opcao) => (
              <option key={opcao.id} value={opcao.id}>
                {opcao.texto}
              </option>
            ))}
          </select>
        );
      })}
    </div>
  );
}

// --- Ordenação -------------------------------------------------------------

function Ordenacao({ itens }: { itens: Opcao[] }) {
  const [lista, setLista] = useState(itens);
  const [arrastando, setArrastando] = useState<number | null>(null);
  const valor = useMemo(() => lista.map((i) => i.id).join(","), [lista]);

  function mover(de: number, para: number) {
    if (para < 0 || para >= lista.length) return;
    const nova = [...lista];
    const [item] = nova.splice(de, 1);
    nova.splice(para, 0, item);
    setLista(nova);
  }

  return (
    <div className="space-y-3">
      <input type="hidden" name="ordem" value={valor} />
      <p className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-800">
        Arraste os blocos, ou use as setas, até a sequência ficar correta.
      </p>

      <ol className="space-y-2">
        {lista.map((item, indice) => (
          <li
            key={item.id}
            draggable
            onDragStart={() => setArrastando(indice)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (arrastando !== null) mover(arrastando, indice);
              setArrastando(null);
            }}
            onDragEnd={() => setArrastando(null)}
            className={`flex items-center gap-3 rounded-lg border-2 bg-white p-3 ${
              arrastando === indice ? "border-blue-500 opacity-60" : "border-slate-200"
            }`}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-700 text-xs font-bold text-white">
              {indice + 1}
            </span>
            <span className="flex-1 text-sm text-slate-800">{item.texto}</span>
            <span className="flex shrink-0 flex-col gap-1">
              <button
                type="button"
                onClick={() => mover(indice, indice - 1)}
                disabled={indice === 0}
                aria-label={`Mover "${item.texto}" para cima`}
                className="rounded border border-slate-300 px-2 text-xs leading-5 text-slate-600 disabled:opacity-30"
              >
                ▲
              </button>
              <button
                type="button"
                onClick={() => mover(indice, indice + 1)}
                disabled={indice === lista.length - 1}
                aria-label={`Mover "${item.texto}" para baixo`}
                className="rounded border border-slate-300 px-2 text-xs leading-5 text-slate-600 disabled:opacity-30"
              >
                ▼
              </button>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

// --- Associação de colunas -------------------------------------------------

function Associacao({
  esquerda,
  direita,
  aoMudar,
}: {
  esquerda: Opcao[];
  direita: Opcao[];
  aoMudar: (v: boolean) => void;
}) {
  const [pares, setPares] = useState<Record<number, string>>({});

  function ligar(itemId: number, valor: string) {
    const novo = { ...pares, [itemId]: valor };
    setPares(novo);
    aoMudar(esquerda.every((e) => novo[e.id]));
  }

  // Marca as opções já usadas em outra linha, sem bloquear: o aluno pode
  // querer trocar duas de lugar e o bloqueio atrapalharia.
  const usados = new Set(Object.entries(pares).map(([, v]) => v).filter(Boolean));

  return (
    <div className="space-y-3">
      {esquerda.map((item) => (
        <div key={item.id} className="rounded-lg border border-slate-200 bg-white p-3 sm:flex sm:items-center sm:gap-4">
          <span className="block font-mono text-sm font-semibold text-blue-800 sm:w-44 sm:shrink-0">
            {item.texto}
          </span>
          <select
            name={`par_${item.id}`}
            required
            value={pares[item.id] ?? ""}
            onChange={(e) => ligar(item.id, e.target.value)}
            className="campo mt-2 sm:mt-0"
          >
            <option value="">Selecione o par...</option>
            {direita.map((opcao) => (
              <option key={opcao.id} value={opcao.id}>
                {usados.has(String(opcao.id)) && pares[item.id] !== String(opcao.id) ? "• " : ""}
                {opcao.texto}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}

function letra(indice: number): string {
  return `${String.fromCharCode(65 + indice)})`;
}
