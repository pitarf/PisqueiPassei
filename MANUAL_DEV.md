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

## 🧪 Testes e Qualidade

- **Testes Unitários:** `npm test` (Bun test com 28 asserts de limites oficiais, taxonomia, SRS, streak e RAG).
- **Auditoria de Banco:** `node scripts/check-db.js` (inspeciona taxonomia 47, relações órfãs, duplicatas e distribuição).
- **Teste de Concorrência:** `node scripts/test-concurrency.js` (valida deduplicação sob concorrência e integridade de XP).
- **Testes E2E (Playwright):** `npx playwright test` (executa fluxos completos em Desktop Chrome 1440x900 e Mobile Chrome 390x844).

## 🧪 CI

O `.github/workflows/ci.yml` roda em pushes e pull requests para `main` e executa:
1. `npm ci`
2. `npm run prisma:generate`
3. `npm run typecheck`
4. Setup Bun & `npm test`
5. `npm run build` (com `DATABASE_URL` isolada de CI)
