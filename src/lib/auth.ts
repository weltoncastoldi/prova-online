import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { consultarUm } from "./db";
import { COOKIE_SESSAO, criarCookie, lerCookie, OPCOES_COOKIE, type Sessao } from "./session";

type LinhaProfessor = { id: number; nome: string; email: string; senha_hash: string; ativo: number };

/** Sessao do professor logado, ou null. */
export async function sessaoAtual(): Promise<Sessao | null> {
  const cookieStore = await cookies();
  return lerCookie(cookieStore.get(COOKIE_SESSAO)?.value);
}

/** Usar no topo de toda pagina/acao administrativa. */
export async function exigirProfessor(): Promise<Sessao> {
  const sessao = await sessaoAtual();
  if (!sessao) redirect("/admin/login");
  return sessao;
}

// Freio simples contra tentativa de senha em sequencia. Mora na memoria do
// processo: zera num redeploy, o que e aceitavel para um painel de um professor.
const tentativasLogin = new Map<string, { contador: number; ate: number }>();
const LIMITE = 8;
const BLOQUEIO_MS = 5 * 60 * 1000;

export async function autenticar(
  email: string,
  senha: string
): Promise<{ ok: true } | { ok: false; erro: string }> {
  const chave = email.trim().toLowerCase();
  const registro = tentativasLogin.get(chave);

  if (registro && registro.contador >= LIMITE && registro.ate > Date.now()) {
    const minutos = Math.ceil((registro.ate - Date.now()) / 60000);
    return { ok: false, erro: `Muitas tentativas. Tente novamente em ${minutos} min.` };
  }

  const professor = await consultarUm<LinhaProfessor>(
    "SELECT id, nome, email, senha_hash, ativo FROM professor WHERE email = ? LIMIT 1",
    [chave]
  );

  // Compara mesmo sem achar o usuario, para o tempo de resposta nao revelar
  // se o e-mail existe.
  const hash = professor?.senha_hash ?? "$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinv";
  const senhaConfere = await bcrypt.compare(senha, hash);

  if (!professor || !professor.ativo || !senhaConfere) {
    const atual = registro && registro.ate > Date.now() ? registro : { contador: 0, ate: 0 };
    tentativasLogin.set(chave, { contador: atual.contador + 1, ate: Date.now() + BLOQUEIO_MS });
    return { ok: false, erro: "E-mail ou senha incorretos." };
  }

  tentativasLogin.delete(chave);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_SESSAO, criarCookie({ id: professor.id, nome: professor.nome }), OPCOES_COOKIE);
  return { ok: true };
}

export async function encerrarSessao(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_SESSAO);
}

export async function gerarHashSenha(senha: string): Promise<string> {
  return bcrypt.hash(senha, 10);
}
