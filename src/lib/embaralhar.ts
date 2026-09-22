import crypto from "node:crypto";

/**
 * Fisher-Yates com fonte criptografica.
 *
 * Math.random() serviria, mas com uma turma inteira comecando a prova no mesmo
 * segundo vale usar a fonte forte: e barato e elimina qualquer chance de dois
 * alunos receberem exatamente o mesmo sorteio.
 */
export function embaralhar<T>(lista: readonly T[]): T[] {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

/** Token opaco usado na URL da tentativa do aluno. */
export function gerarToken(): string {
  return crypto.randomBytes(16).toString("hex"); // 32 caracteres
}

/** Slug para o link publico da avaliacao. */
export function gerarSlug(texto: string): string {
  const base = texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return base || "avaliacao";
}
