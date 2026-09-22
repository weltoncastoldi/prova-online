// Tipos e rotulos compartilhados por todo o sistema.

export const TIPOS_QUESTAO = [
  "multipla_escolha",
  "multipla_resposta",
  "verdadeiro_falso",
  "lacunas",
  "ordenacao",
  "associacao",
] as const;

export type TipoQuestao = (typeof TIPOS_QUESTAO)[number];

export const ROTULO_TIPO: Record<TipoQuestao, string> = {
  multipla_escolha: "Múltipla escolha",
  multipla_resposta: "Múltipla resposta",
  verdadeiro_falso: "Verdadeiro ou falso",
  lacunas: "Completar lacunas",
  ordenacao: "Ordenar",
  associacao: "Associação de colunas",
};

export const DESCRICAO_TIPO: Record<TipoQuestao, string> = {
  multipla_escolha: "Várias alternativas, apenas uma correta.",
  multipla_resposta: "Várias alternativas, mais de uma correta. Vale tudo ou nada.",
  verdadeiro_falso: "Uma afirmação para julgar como verdadeira ou falsa.",
  lacunas: "Um código com buracos {{1}}, {{2}}; o aluno escolhe o que completa cada um.",
  ordenacao: "O aluno coloca as linhas ou etapas na sequência correta.",
  associacao: "Duas colunas: o aluno liga cada item da esquerda ao par da direita.",
};

export type Dificuldade = "facil" | "media" | "dificil";

export const ROTULO_DIFICULDADE: Record<Dificuldade, string> = {
  facil: "Fácil",
  media: "Média",
  dificil: "Difícil",
};

export type StatusAvaliacao = "rascunho" | "publicada" | "encerrada";
export type ExibirResultado = "nenhum" | "nota" | "nota_gabarito";

export const ROTULO_EXIBIR_RESULTADO: Record<ExibirResultado, string> = {
  nenhum: "Apenas confirmação de envio",
  nota: "Mostrar a nota",
  nota_gabarito: "Mostrar a nota e o gabarito comentado",
};

// ---------------------------------------------------------------------------
// Registros do banco
// ---------------------------------------------------------------------------

export type Uc = {
  id: number;
  codigo: string;
  nome: string;
  descricao: string | null;
  carga_horaria: number | null;
  ativo: number;
};

export type Topico = { id: number; uc_id: number; nome: string; ordem: number };

export type Questao = {
  id: number;
  uc_id: number;
  topico_id: number | null;
  tipo: TipoQuestao;
  dificuldade: Dificuldade;
  contexto: string | null;
  enunciado: string;
  codigo: string | null;
  codigo_linguagem: string;
  explicacao: string | null;
  pontos: number;
  embaralhar_itens: number;
  ativa: number;
};

export type QuestaoItem = {
  id: number;
  questao_id: number;
  texto: string;
  texto_par: string | null;
  correta: number;
  posicao_correta: number | null;
  grupo_lacuna: number | null;
  ordem: number;
};

export type QuestaoCompleta = Questao & { itens: QuestaoItem[]; topico_nome?: string | null };

export type Avaliacao = {
  id: number;
  uc_id: number;
  titulo: string;
  descricao: string | null;
  instrucoes: string | null;
  slug: string;
  embaralhar_questoes: number;
  embaralhar_alternativas: number;
  tempo_limite_min: number | null;
  exibir_resultado: ExibirResultado;
  nota_minima: number;
  permite_voltar: number;
  tentativa_unica: number;
  abre_em: Date | null;
  fecha_em: Date | null;
  status: StatusAvaliacao;
};

export type Tentativa = {
  id: number;
  avaliacao_id: number;
  aluno_nome: string;
  aluno_nome_norm: string;
  token: string;
  status: "em_andamento" | "finalizada" | "expirada";
  iniciada_em: Date;
  finalizada_em: Date | null;
  questao_atual: number;
  total_questoes: number;
  acertos: number;
  pontos_obtidos: number;
  pontos_possiveis: number;
  nota: number | null;
};

// ---------------------------------------------------------------------------
// Ordem embaralhada dos itens, congelada quando a tentativa comeca.
// Fica gravada em tentativa_questao.itens_ordem para que recarregar a pagina
// nao gere um novo sorteio.
// ---------------------------------------------------------------------------
export type ItensOrdem =
  | { tipo: "lista"; ids: number[] } // escolha, resposta, v/f, ordenacao
  | { tipo: "lacunas"; grupos: Record<string, number[]> }
  | { tipo: "associacao"; esquerda: number[]; direita: number[] };

// ---------------------------------------------------------------------------
// O que o aluno respondeu, ja normalizado a partir do formulario
// ---------------------------------------------------------------------------
export type Resposta =
  | { tipo: "unica"; itemId: number | null }
  | { tipo: "varias"; itemIds: number[] }
  | { tipo: "lacunas"; escolhas: Record<string, number> } // grupo -> item escolhido
  | { tipo: "ordenacao"; ordem: number[] } // ids na ordem montada pelo aluno
  | { tipo: "associacao"; pares: Record<string, number> }; // item da esquerda -> id do par escolhido
