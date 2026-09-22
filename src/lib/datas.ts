/**
 * Datas do sistema.
 *
 * Regra única, para não repetir o problema que houve antes: **o banco guarda
 * tudo em UTC** e a tela mostra tudo no fuso da escola. A conversão acontece
 * só nas bordas, aqui.
 *
 * Antes, o valor digitado era gravado literalmente (no fuso do servidor) e
 * relido no fuso do navegador. Como a Hostinger roda em UTC e a escola está
 * em UTC-3, cada gravação deslocava a data em 3 horas e a janela da prova
 * abria e fechava na hora errada.
 */

/** Fuso em que o professor pensa e digita. Ajustável por variável de ambiente. */
export const FUSO_APP = process.env.NEXT_PUBLIC_FUSO ?? "America/Sao_Paulo";

const doisDigitos = (n: number) => String(n).padStart(2, "0");

/** Componentes de um instante, lidos em um fuso específico. */
function partesNoFuso(instante: Date, fuso: string) {
  const formatador = new Intl.DateTimeFormat("en-US", {
    timeZone: fuso,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const partes = Object.fromEntries(
    formatador.formatToParts(instante).filter((p) => p.type !== "literal").map((p) => [p.type, p.value])
  ) as Record<string, string>;

  return {
    ano: Number(partes.year),
    mes: Number(partes.month),
    dia: Number(partes.day),
    // Em hour12:false o Intl pode devolver "24" para a meia-noite.
    hora: Number(partes.hour) % 24,
    minuto: Number(partes.minute),
    segundo: Number(partes.second),
  };
}

/** Quanto o fuso está adiantado em relação ao UTC, naquele instante. */
function deslocamentoMs(instante: Date, fuso: string): number {
  const p = partesNoFuso(instante, fuso);
  const comoSeFosseUtc = Date.UTC(p.ano, p.mes - 1, p.dia, p.hora, p.minuto, p.segundo);
  return comoSeFosseUtc - instante.getTime();
}

/**
 * "2026-09-22T14:30" digitado pelo professor (hora de parede, no fuso da
 * escola) -> "2026-09-22 17:30:00" em UTC, pronto para o MySQL.
 */
export function doCampoParaUtc(valor: string): string | null {
  const achado = valor.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!achado) return null;

  const [, ano, mes, dia, hora, minuto, segundo] = achado;
  const palpite = Date.UTC(+ano, +mes - 1, +dia, +hora, +minuto, +(segundo ?? 0));

  // Dois passos porque o deslocamento depende da própria data (horário de
  // verão): o primeiro chuta, o segundo confere já perto do instante certo.
  let instante = palpite - deslocamentoMs(new Date(palpite), FUSO_APP);
  instante = palpite - deslocamentoMs(new Date(instante), FUSO_APP);

  const d = new Date(instante);
  return (
    `${d.getUTCFullYear()}-${doisDigitos(d.getUTCMonth() + 1)}-${doisDigitos(d.getUTCDate())} ` +
    `${doisDigitos(d.getUTCHours())}:${doisDigitos(d.getUTCMinutes())}:${doisDigitos(d.getUTCSeconds())}`
  );
}

/** Instante do banco -> valor para o <input type="datetime-local">, no fuso da escola. */
export function paraCampoLocal(valor: Date | string | null): string {
  if (!valor) return "";
  const data = valor instanceof Date ? valor : new Date(valor);
  if (Number.isNaN(data.getTime())) return "";

  const p = partesNoFuso(data, FUSO_APP);
  return `${p.ano}-${doisDigitos(p.mes)}-${doisDigitos(p.dia)}T${doisDigitos(p.hora)}:${doisDigitos(p.minuto)}`;
}

/** Instante do banco -> "22/09/2026 14:30", sempre no fuso da escola. */
export function formatarDataHora(valor: Date | string | null): string {
  if (!valor) return "";
  const data = valor instanceof Date ? valor : new Date(valor);
  if (Number.isNaN(data.getTime())) return "";

  const p = partesNoFuso(data, FUSO_APP);
  return `${doisDigitos(p.dia)}/${doisDigitos(p.mes)}/${p.ano} ${doisDigitos(p.hora)}:${doisDigitos(p.minuto)}`;
}
