import crypto from "node:crypto";

/**
 * Sessao do professor num cookie httpOnly assinado com HMAC-SHA256.
 *
 * Sem dependencia de JWT: o conteudo e pequeno e nao precisa ser lido por
 * ninguem alem deste servidor. O cookie nao e secreto, mas e inviolavel --
 * mudar o id dentro dele invalida a assinatura.
 */

const DURACAO_PADRAO_S = 60 * 60 * 8; // 8 horas: uma jornada de aula

export const COOKIE_SESSAO = "prova_professor";

export type Sessao = { id: number; nome: string; exp: number };

/** Erro de configuração do servidor, não erro do usuário. */
export class ConfiguracaoAusente extends Error {}

export const TAMANHO_MINIMO_SEGREDO = 16;

/** O segredo é conferido a cada uso, nunca guardado numa constante de módulo. */
export function segredoConfigurado(): boolean {
  const valor = process.env.APP_SECRET ?? "";
  return valor.length >= TAMANHO_MINIMO_SEGREDO;
}

function chave(): string {
  // Ler process.env aqui dentro, e não no topo do arquivo, é intencional:
  // no topo o valor seria lido uma única vez, quando o módulo é carregado,
  // e um build feito antes de a variável existir congelaria o valor vazio.
  const valor = process.env.APP_SECRET ?? "";
  if (valor.length < TAMANHO_MINIMO_SEGREDO) {
    throw new ConfiguracaoAusente(
      "APP_SECRET ausente ou com menos de 16 caracteres. Defina essa variável de " +
        "ambiente no painel da hospedagem (ou no .env, em desenvolvimento) e publique de novo."
    );
  }
  return valor;
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

  // Ler um cookie sem o segredo configurado significa "ninguém está logado",
  // não "derrube a página": quem avisa sobre a configuração é a tela de login.
  let esperado: string;
  try {
    esperado = assinatura(corpo);
  } catch {
    return null;
  }

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
