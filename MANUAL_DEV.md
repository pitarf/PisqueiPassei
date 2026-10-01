# MANUAL DO DESENVOLVEDOR (MANUAL_DEV.md) - TRANSPETRO STUDY 2026.3

Este documento fornece as diretrizes técnicas para configuração, manutenção e evolução da plataforma TRANSPETRO STUDY.

## 🛠️ Stack Tecnológica

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript
- **Estilização:** Tailwind CSS v3/v4, Lucide React
- **Notificações:** Sonner
- **ORM & Banco:** Prisma ORM com PostgreSQL
- **Containerização:** Docker Compose
- **IA:** Google Gemini API (`@google/genai`)

## 🚀 Como Rodar

```bash
npm install
cp .env.example .env
docker-compose up -d
npx prisma db push
npm run prisma:seed
npm run dev
```

## 📁 Estrutura

- `/src/app`: rotas e páginas do Next.js App Router
- `/src/components`: componentes visuais reutilizáveis
- `/src/lib`: Prisma, RAG, SRS, sequência diária e IA
- `/src/services`: regras de negócio e serviços auxiliares
- `/src/types`: tipos TypeScript
- `/documents`: fontes Markdown usadas pelo RAG
- `/prisma`: schema e seed do edital

## 🧠 IA, RAG e confiabilidade

- O edital oficial define o escopo do conteúdo (exatamente 47 tópicos oficiais da Ênfase 18).
- Fontes normativas locais complementam o edital para detalhes legais e regulamentares.
- Fontes `pointer` indicam apenas escopo e não sustentam detalhes jurídicos específicos.
- O modelo utilizado é o **`gemini-3.6-flash`**, configurado com `temperature: 0.2` e parsing de JSON resiliente com autocura.
- A IA deve separar conteúdo oficial, complementar e material didático gerado.
- Questões da IA são inéditas e ficam identificadas como `origin: AI_GENERATED`, com banca `IA (perfil Cesgranrio)` e `sourceRef` descritivo. Nunca apresentá-las como questões oficiais aplicadas pela Cesgranrio.
- Aulas e questões passam pelo validador estrutural central `src/lib/question-validator.ts` antes da persistência.

## 🔁 Progresso, SRS e sequência diária

- `src/lib/srs.ts` contém a regra própria de repetição espaçada da plataforma. Não descrevê-la como SM-2.
- `src/lib/streak.ts` calcula a sequência diária usando `America/Sao_Paulo`.
- Questões, flashcards, simulados e feedback de aula atualizam a sequência quando a atividade é efetivamente registrada.
- As rotas contam com travas de concorrência via chave de idempotência persistente (`idempotencyKey` com constraint `@unique`) e transações `$transaction`.

## 🧪 Testes, Auditoria e Qualidade

- **Expansão Mestre para 940 Questões:** `node -r dotenv/config scripts/expand-bank-to-940.js --subject="Nome"` (orquestrador com verificação semântica em tempo real, balanceamento ativo de gabarito A-E e blindagem jurídica/planilhas).
- **Testes Unitários & Integração:** `npm test` (`bun test src/lib` executando 68 testes cobrindo limites oficiais, taxonomia, SRS, streak, RAG, idempotência P2002, simulado estratificado, motor de auditoria semântica e QA Risk Score calibrado).
- **Auditoria Estrutural de Banco:** `npm run db:check` (`node -r ts-node/register scripts/check-db.js`, fail-fast se houver qualquer anomalia de hash, órfãos ou taxonomia divergente).
- **Auditoria Pedagógica e Semântica:** `npm run audit:quality` (`node scripts/audit-question-quality.js`, avalia cobertura de 940 questões, viés de gabarito A-E, pares de similaridade semântica, conformidade normativa em legislação, funções Excel PT-BR e QA Risk Score com penalização estrita).
- **Relatório Executivo de Qualidade:** `npm run report:quality` (`node scripts/question-bank-quality-report.js`, exporta `question-bank-quality-report.json`).
- **Classificação Semântica:** `node scripts/classify-semantic-pairs.js` (classifica pares suspeitos e exporta `question-bank-semantic-review.json`).
- **Curadoria e Reescrita:** `node scripts/curate-seed-questions.js` (curadoria cirúrgica de itens legados e eliminação de boilerplates).
- **Suprimento Incremental por IA:** `npm run generate:questions -- --subject="Nome" --target=10 --batch=5` (`scripts/generate-question-bank.js`, preenchimento de estoque com RAG ponderado multi-termo).
- **Testes E2E (Playwright):** `npm run test:e2e` (`playwright test`, 22 testes automatizados em Desktop Chrome 1440x900 e Mobile Chrome 390x844).

## 🧪 CI (GitHub Actions)

- Pipeline automatizado em `.github/workflows/ci.yml` com container de serviço PostgreSQL 16.
- Esteira sequencial fail-fast: Migrations Prisma (`prisma db push`), Seed determinístico de 60 itens (`seed:ci`), Auditoria estrita (`db:check`), Checagem de tipos estrita (`tsc --noEmit`), Testes unitários/integração (`bun test src/lib`), Build de produção (`next build`) e Testes E2E Playwright (22/22 Desktop e Mobile).

O `.github/workflows/ci.yml` roda em pushes e pull requests para `main` e executa:
1. `npm ci`
2. `npm run prisma:generate`
3. `npm run typecheck`
4. Setup Bun & `npm test`
5. `npm run build` (com `DATABASE_URL` isolada de CI)
