# Publicar na Hostinger (plano Business)

O Business roda aplicações Node.js pelo hPanel, com deploy a partir de um repositório GitHub. O Next.js sobe em modo servidor — `next.config.ts` já está com `output: "standalone"`, que é o formato esperado.

## 1. Criar o banco (vazio)

hPanel → **Bancos de dados → MySQL**: crie um banco e um usuário e anote **nome do banco, usuário, senha e host**.

**Não importe nada pelo phpMyAdmin.** O banco sobe vazio de propósito: as tabelas e os dados iniciais são criados pelas migrações, automaticamente, no deploy.

## 2. Subir o código para o GitHub

```bash
git init
git add .
git commit -m "Sistema de prova online"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/prova-online.git
git push -u origin main
```

O `.gitignore` já impede que o `.env` vá junto.

## 3. Criar a aplicação Node.js

hPanel → **Sites → Adicionar site → Aplicação Node.js**:

- Conecte o repositório do GitHub e escolha a branch `main`
- Comando de build: `npm run build`
- Comando de início: `npm start`
- Versão do Node: **22.x** (ou a mais alta disponível)

## 4. Variáveis de ambiente

Ainda no painel da aplicação, em **Variáveis de ambiente**:

| Variável | Valor |
|---|---|
| `DB_HOST` | `localhost` (ou o host que o hPanel mostrar no banco) |
| `DB_PORT` | `3306` |
| `DB_NAME` | nome do banco criado |
| `DB_USER` | usuário do banco |
| `DB_PASSWORD` | senha do banco |
| `APP_SECRET` | valor longo e aleatório — assina o cookie de login |
| `NODE_ENV` | `production` |

Gere o `APP_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Se a aplicação não conectar com `localhost`, ative **MySQL remoto** no hPanel, libere o IP e use o host que ele indicar em `DB_HOST`.

> As variáveis precisam estar salvas **antes** do primeiro deploy: é com elas que as migrações encontram o banco.

## 5. As migrações rodam sozinhas

Não há passo manual de banco. O `package.json` chama `scripts/migrar.mjs` em dois momentos:

- **`postbuild`** — logo depois do `npm run build`, que é quando a Hostinger monta a aplicação;
- **`prestart`** — antes de o servidor subir, cobrindo quem inicia o app direto.

O script aplica só o que falta, na ordem dos nomes de `db/migrations/`, e registra cada arquivo na tabela `migracao`. Rodar de novo não repete nada.

No primeiro deploy você verá no log de build:

```
[migrar] 3 migração(ões) pendente(s).
  aplicando 001_schema.sql ... ok
  aplicando 002_seed.sql ... ok
  aplicando 003_questoes_uc.sql ... ok
[migrar] Concluído.
```

Se uma migração falhar, o script **para ali**, não marca o arquivo como aplicado e devolve erro — o deploy falha em vez de deixar o banco meio construído.

## 6. Publicar e conferir

Depois do deploy, abra:

- `https://seudominio.com.br/admin` → entre e **troque a senha inicial**
- `https://seudominio.com.br/` → lista das provas publicadas

O link que você passa para a turma é `https://seudominio.com.br/p/<slug>`, mostrado na tela de configuração de cada avaliação.

---

## Se o build falhar por falta de memória

O build do Next é pesado e o plano compartilhado tem RAM limitada. Duas saídas:

**A. Buildar fora e subir pronto** — rode `npm run build` na sua máquina e publique `.next/standalone`, `.next/static` e `public` junto do código, deixando o comando de build do painel vazio. Leve junto a pasta `db/migrations` e mantenha o start como `npm start`, para o `prestart` aplicar as migrações.

**B. GitHub Actions** — deixe o build acontecer no GitHub e envie só o resultado. O `postbuild` do CI detecta que não há credenciais de banco, avisa e não falha; as migrações rodam depois, no `prestart`, já no servidor.

## Alterar o banco depois

Nunca edite um arquivo de migração já aplicado — ele não roda de novo. Crie o próximo número:

```sql
-- db/migrations/004_campo_turma.sql
ALTER TABLE tentativa ADD COLUMN turma VARCHAR(40) NULL;
```

Teste com `npm run migrar` no Docker, faça commit e o deploy aplica sozinho.

Duas coisas que o MySQL da Hostinger não aceita, e que já me pegaram: `ADD COLUMN IF NOT EXISTS` é sintaxe de MariaDB, e barra invertida dentro de string precisa ser dobrada (`/\\D/g`).

### Se o banco já existia antes deste sistema

Caso você tenha importado os `.sql` na mão em algum momento, marque as migrações como já aplicadas antes do primeiro deploy, senão elas tentarão recriar tudo:

```sql
CREATE TABLE IF NOT EXISTS migracao (
  nome VARCHAR(190) NOT NULL,
  aplicada_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (nome)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO migracao (nome) VALUES
  ('001_schema.sql'), ('002_seed.sql'), ('003_questoes_uc.sql');
```

## Atualizações depois de publicado

```bash
git add . && git commit -m "ajustes" && git push
```

A Hostinger rebuilda a cada push na branch conectada. **Alterar o conteúdo das questões não exige deploy** — isso é dado, e se edita pelo `/admin` ou pelo phpMyAdmin.

## Backup antes da prova

hPanel → phpMyAdmin → **Exportar** o banco inteiro. Faça isso antes de cada aplicação: é a cópia das notas.
