-- =========================================================================
--  Prova Online - estrutura do banco
--  UC (unidade curricular) -> topicos -> banco de questoes -> avaliacoes
--
--  Sem CREATE DATABASE e sem DEFINER: importavel direto no phpMyAdmin da
--  Hostinger, bastando selecionar o banco criado no hPanel antes de importar.
-- =========================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- -------------------------------------------------------------------------
-- Professores (acesso ao painel administrativo)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS professor (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome        VARCHAR(120)  NOT NULL,
  email       VARCHAR(160)  NOT NULL,
  senha_hash  VARCHAR(255)  NOT NULL,
  ativo       TINYINT(1)    NOT NULL DEFAULT 1,
  criado_em   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_professor_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- Unidade curricular
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS uc (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo        VARCHAR(30)   NOT NULL,
  nome          VARCHAR(160)  NOT NULL,
  descricao     TEXT          NULL,
  carga_horaria INT UNSIGNED  NULL,
  ativo         TINYINT(1)    NOT NULL DEFAULT 1,
  criado_em     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_uc_codigo (codigo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- Topicos: subdivisao da UC, usada para filtrar o banco de questoes
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS topico (
  id     INT UNSIGNED NOT NULL AUTO_INCREMENT,
  uc_id  INT UNSIGNED NOT NULL,
  nome   VARCHAR(160) NOT NULL,
  ordem  INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_topico_uc (uc_id, ordem),
  CONSTRAINT fk_topico_uc FOREIGN KEY (uc_id) REFERENCES uc (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- Banco de questoes da UC
--
--   contexto   -> o caso de uso/cenario que faz o aluno pensar (opcional)
--   enunciado  -> a pergunta em si
--   codigo     -> fragmento de codigo exibido em bloco (opcional)
--                 no tipo 'lacunas', marque os buracos com {{1}}, {{2}}, ...
--   explicacao -> gabarito comentado, exibido no resultado quando permitido
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS questao (
  id                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  uc_id             INT UNSIGNED NOT NULL,
  topico_id         INT UNSIGNED NULL,
  tipo              ENUM('multipla_escolha','multipla_resposta','verdadeiro_falso',
                         'lacunas','ordenacao','associacao') NOT NULL,
  dificuldade       ENUM('facil','media','dificil') NOT NULL DEFAULT 'media',
  contexto          TEXT         NULL,
  enunciado         TEXT         NOT NULL,
  codigo            TEXT         NULL,
  codigo_linguagem  VARCHAR(20)  NOT NULL DEFAULT 'javascript',
  explicacao        TEXT         NULL,
  pontos            DECIMAL(5,2) NOT NULL DEFAULT 1.00,
  embaralhar_itens  TINYINT(1)   NOT NULL DEFAULT 1,
  ativa             TINYINT(1)   NOT NULL DEFAULT 1,
  criado_em         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_questao_banco (uc_id, ativa, tipo),
  KEY idx_questao_topico (topico_id),
  CONSTRAINT fk_questao_uc     FOREIGN KEY (uc_id)     REFERENCES uc (id)     ON DELETE CASCADE,
  CONSTRAINT fk_questao_topico FOREIGN KEY (topico_id) REFERENCES topico (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- Itens da questao. Uma tabela so atende os 6 tipos:
--
--   multipla_escolha  -> texto + correta (um unico correta=1)
--   multipla_resposta -> texto + correta (varios correta=1)
--   verdadeiro_falso  -> dois itens fixos, um com correta=1
--   lacunas           -> grupo_lacuna = numero do {{n}}; dentro de cada grupo
--                        um item tem correta=1 (vira um select)
--   ordenacao         -> texto + posicao_correta (1..n)
--   associacao        -> texto = coluna A, texto_par = coluna B do mesmo par
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS questao_item (
  id               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  questao_id       INT UNSIGNED NOT NULL,
  texto            TEXT         NOT NULL,
  texto_par        TEXT         NULL,
  correta          TINYINT(1)   NOT NULL DEFAULT 0,
  posicao_correta  INT UNSIGNED NULL,
  grupo_lacuna     INT UNSIGNED NULL,
  ordem            INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_item_questao (questao_id, ordem),
  CONSTRAINT fk_item_questao FOREIGN KEY (questao_id) REFERENCES questao (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- Avaliacoes montadas a partir do banco da UC
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS avaliacao (
  id                      INT UNSIGNED NOT NULL AUTO_INCREMENT,
  uc_id                   INT UNSIGNED NOT NULL,
  titulo                  VARCHAR(180) NOT NULL,
  descricao               TEXT         NULL,
  instrucoes              TEXT         NULL,
  slug                    VARCHAR(80)  NOT NULL,
  embaralhar_questoes     TINYINT(1)   NOT NULL DEFAULT 1,
  embaralhar_alternativas TINYINT(1)   NOT NULL DEFAULT 1,
  tempo_limite_min        INT UNSIGNED NULL,
  exibir_resultado        ENUM('nenhum','nota','nota_gabarito') NOT NULL DEFAULT 'nota',
  nota_minima             DECIMAL(4,2) NOT NULL DEFAULT 6.00,
  permite_voltar          TINYINT(1)   NOT NULL DEFAULT 0,
  tentativa_unica         TINYINT(1)   NOT NULL DEFAULT 1,
  abre_em                 DATETIME     NULL,
  fecha_em                DATETIME     NULL,
  status                  ENUM('rascunho','publicada','encerrada') NOT NULL DEFAULT 'rascunho',
  criado_por              INT UNSIGNED NULL,
  criado_em               DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_avaliacao_slug (slug),
  KEY idx_avaliacao_uc (uc_id, status),
  CONSTRAINT fk_avaliacao_uc        FOREIGN KEY (uc_id)      REFERENCES uc (id)        ON DELETE CASCADE,
  CONSTRAINT fk_avaliacao_professor FOREIGN KEY (criado_por) REFERENCES professor (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Quais questoes do banco entram nesta avaliacao
CREATE TABLE IF NOT EXISTS avaliacao_questao (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  avaliacao_id INT UNSIGNED NOT NULL,
  questao_id   INT UNSIGNED NOT NULL,
  ordem        INT UNSIGNED NOT NULL DEFAULT 0,
  pontos       DECIMAL(5,2) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_avaliacao_questao (avaliacao_id, questao_id),
  KEY idx_aq_questao (questao_id),
  CONSTRAINT fk_aq_avaliacao FOREIGN KEY (avaliacao_id) REFERENCES avaliacao (id) ON DELETE CASCADE,
  CONSTRAINT fk_aq_questao   FOREIGN KEY (questao_id)   REFERENCES questao (id)   ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- Tentativa: uma prova respondida por um aluno
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tentativa (
  id               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  avaliacao_id     INT UNSIGNED NOT NULL,
  aluno_nome       VARCHAR(160) NOT NULL,
  aluno_nome_norm  VARCHAR(160) NOT NULL,
  token            CHAR(32)     NOT NULL,
  status           ENUM('em_andamento','finalizada','expirada') NOT NULL DEFAULT 'em_andamento',
  iniciada_em      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  finalizada_em    DATETIME     NULL,
  questao_atual    INT UNSIGNED NOT NULL DEFAULT 1,
  total_questoes   INT UNSIGNED NOT NULL DEFAULT 0,
  acertos          INT UNSIGNED NOT NULL DEFAULT 0,
  pontos_obtidos   DECIMAL(7,2) NOT NULL DEFAULT 0.00,
  pontos_possiveis DECIMAL(7,2) NOT NULL DEFAULT 0.00,
  nota             DECIMAL(4,2) NULL,
  ip               VARCHAR(45)  NULL,
  user_agent       VARCHAR(255) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tentativa_token (token),
  KEY idx_tentativa_avaliacao (avaliacao_id, status),
  KEY idx_tentativa_aluno (avaliacao_id, aluno_nome_norm),
  CONSTRAINT fk_tentativa_avaliacao FOREIGN KEY (avaliacao_id) REFERENCES avaliacao (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- As questoes daquela tentativa, ja na ordem sorteada para aquele aluno.
-- itens_ordem guarda a ordem embaralhada dos itens em JSON, fixada no inicio:
-- e o que garante que recarregar a pagina nao reembaralhe as alternativas.
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tentativa_questao (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  tentativa_id   INT UNSIGNED NOT NULL,
  questao_id     INT UNSIGNED NOT NULL,
  ordem          INT UNSIGNED NOT NULL,
  itens_ordem    TEXT         NULL,
  pontos         DECIMAL(5,2) NOT NULL DEFAULT 1.00,
  respondida     TINYINT(1)   NOT NULL DEFAULT 0,
  respondida_em  DATETIME     NULL,
  correta        TINYINT(1)   NULL,
  pontos_obtidos DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tq_tentativa_ordem (tentativa_id, ordem),
  UNIQUE KEY uq_tq_tentativa_questao (tentativa_id, questao_id),
  KEY idx_tq_questao (questao_id),
  CONSTRAINT fk_tq_tentativa FOREIGN KEY (tentativa_id) REFERENCES tentativa (id) ON DELETE CASCADE,
  CONSTRAINT fk_tq_questao   FOREIGN KEY (questao_id)   REFERENCES questao (id)   ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------------------
-- O que o aluno marcou. Uma linha por marcacao:
--   multipla_escolha / multipla_resposta / verdadeiro_falso -> item_id
--   lacunas    -> item_id (opcao escolhida) + grupo_lacuna
--   ordenacao  -> item_id + valor (posicao informada pelo aluno)
--   associacao -> item_id (linha da coluna A) + valor (id do par escolhido em B)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tentativa_resposta (
  id                   INT UNSIGNED NOT NULL AUTO_INCREMENT,
  tentativa_questao_id INT UNSIGNED NOT NULL,
  item_id              INT UNSIGNED NULL,
  valor                INT          NULL,
  grupo_lacuna         INT UNSIGNED NULL,
  PRIMARY KEY (id),
  KEY idx_resposta_tq (tentativa_questao_id),
  KEY idx_resposta_item (item_id),
  CONSTRAINT fk_resposta_tq   FOREIGN KEY (tentativa_questao_id) REFERENCES tentativa_questao (id) ON DELETE CASCADE,
  CONSTRAINT fk_resposta_item FOREIGN KEY (item_id)              REFERENCES questao_item (id)      ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
