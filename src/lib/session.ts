import crypto from "node:crypto";

/**
 * Sessao do professor num cookie httpOnly assinado com HMAC-SHA256.
 *
 * Sem dependencia de JWT: o conteudo e pequeno e nao precisa ser lido por
 * ninguem alem deste servidor. O cookie nao e secreto, mas e inviolavel --
 * mudar o id dentro dele invalida a assinatura.
 */

const SEGREDO = process.env.APP_SECRET ?? "";
const DURACAO_PADRAO_S = 60 * 60 * 8; // 8 horas: uma jornada de aula

export const COOKIE_SESSAO = "prova_professor";

export type Sessao = { id: number; nome: string; exp: number };

function chave(): string {
  if (!SEGREDO || SEGREDO.length < 16) {
    // Falha cedo e com mensagem clara em vez de assinar com segredo fraco.
    throw new Error(
      "APP_SECRET ausente ou curto demais. Defina um valor longo e aleatorio no .env."
    );
  }
  return SEGREDO;
}

function assinatura(corpo: string): string {
  return crypto.createHmac("sha256", chave()).update(corpo).digest("base64url");
}

export function criarCookie(dados: { id: number; nome: string }, duracaoS = DURACAO_PADRAO_S): string {
  const sessao: Sessao = {
    id: dados.id,
    nome: dados.nome,
    exp: Math.floor(Date.now() / 1000) + duracaoS,
  };
  const corpo = Buffer.from(JSON.stringify(sessao), "utf8").toString("base64url");
  return `${corpo}.${assinatura(corpo)}`;
}

export function lerCookie(valor: string | undefined): Sessao | null {
  if (!valor) return null;
  const [corpo, assinado] = valor.split(".");
  if (!corpo || !assinado) return null;

  const esperado = assinatura(corpo);
  // timingSafeEqual exige o mesmo tamanho, senao lanca.
  if (esperado.length !== assinado.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(esperado), Buffer.from(assinado))) return null;

  try {
    const sessao = JSON.parse(Buffer.from(corpo, "base64url").toString("utf8")) as Sessao;
    if (!sessao?.id || sessao.exp * 1000 < Date.now()) return null;
    return sessao;
  } catch {
    return null;
  }
}

export const OPCOES_COOKIE = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: DURACAO_PADRAO_S,
};
