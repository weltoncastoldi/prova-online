# Prova Online

Sistema de avaliação por unidade curricular: o professor monta o banco de questões, seleciona quais entram em cada prova, e o aluno responde uma questão por tela, com ordem sorteada individualmente.

Feito em **Next.js 15 + TypeScript + Tailwind + MySQL 8** (SQL puro, sem ORM), pronto para rodar em Docker no localhost e para publicar na **Hostinger (plano Business, aplicação Node.js)**.

---

## Rodar no localhost

```bash
cp .env.example .env
docker compose up -d --build
```

| Serviço | Endereço |
|---|---|
| Aplicação | http://localhost:3000 |
| phpMyAdmin | http://localhost:8081 |
| MySQL (cliente externo) | localhost:3307 |

O banco sobe vazio e quem o constrói é a aplicação: o contêiner roda `npm install`, depois `npm run migrar` (cria as tabelas, a UC, os tópicos, o professor e as 30 questões) e só então o `next dev`. A primeira vez leva alguns minutos; depois sobe em segundos.

**Login inicial do professor:** `professor@senai.br` / `Senai@2026`

Troque a senha assim que entrar:

```bash
npm run hash -- "sua nova senha"
```

e rode o `UPDATE` que o comando imprime, pelo phpMyAdmin.

### Migrações

Todo o banco vive em `db/migrations/`, aplicado na ordem dos nomes. O **mesmo** script roda no Docker, no `npm run build` (postbuild) e no `npm start` (prestart) — ou seja, o caminho testado no localhost é exatamente o do deploy, e não existe passo manual de importar `.sql` em lugar nenhum.

```bash
npm run migrar     # aplica só o que falta; rodar de novo não repete nada
```

Para mudar o banco, crie o próximo arquivo numerado. Nunca edite um já aplicado, porque ele não roda de novo:

```sql
-- db/migrations/004_campo_turma.sql
ALTER TABLE tentativa ADD COLUMN turma VARCHAR(40) NULL;
```

O controle fica na tabela `migracao`. Se uma migração falhar, o script para ali e não a marca como aplicada — melhor um deploy que falha do que um banco meio construído.

### Recomeçar do zero

```bash
docker compose down -v && docker compose up -d --build
```

---

## Como o sistema se organiza

```
Unidade curricular (UC)
└── Tópicos                    agrupam o banco por assunto
    └── Banco de questões      todas as questões da UC
        └── Avaliação          seleciona N questões do banco
            └── Tentativa      a prova de um aluno, com ordem própria
```

O aluno entra em `/p/<slug-da-avaliacao>`, informa o nome completo e responde. A ordem das questões e das alternativas é sorteada **no início da tentativa** e gravada no banco: recarregar a página não reembaralha nada, e fechar o navegador não perde o progresso.

### Os 6 tipos de questão

Todos são corrigidos automaticamente, sem campo de texto livre. O critério é tudo ou nada.

| Tipo | Como o aluno responde |
|---|---|
| Múltipla escolha | Marca uma alternativa |
| Múltipla resposta | Marca várias; precisa acertar o conjunto exato |
| Verdadeiro ou falso | Julga uma afirmação |
| Completar lacunas | Escolhe numa lista o que preenche cada `{{1}}`, `{{2}}` do código |
| Ordenar | Arrasta (ou usa as setas) até a sequência ficar certa |
| Associação de colunas | Liga cada item da esquerda ao par da direita |

Cada questão pode ter **contexto** (o caso de uso que faz o aluno pensar), **enunciado**, **fragmento de código** e **explicação** do gabarito.

---

## Estrutura do código

```
db/migrations/       schema e dados iniciais, aplicados automaticamente
src/lib/             db, auth, sessão, corretor, embaralhamento
src/lib/repos/       consultas SQL por área
src/app/             rotas: aluno (/, /p, /prova, /resultado) e /admin
src/components/      widgets da prova e o editor de questões
```

Onde mexer primeiro:

- **Regras de correção** → `src/lib/corretor.ts`
- **Sorteio da ordem** → `src/lib/repos/tentativas.ts`
- **O que vai para o navegador** → `src/lib/exibicao.ts` (nada que revele a resposta passa por aqui)
- **Conexão com o banco** → `src/lib/db.ts`, configurado só por variáveis de ambiente

---

## Publicar na Hostinger

Veja [DEPLOY-HOSTINGER.md](DEPLOY-HOSTINGER.md).
