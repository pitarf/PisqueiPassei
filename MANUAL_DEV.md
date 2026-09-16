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

- O edital oficial define o escopo do conteúdo.
- Fontes normativas locais complementam o edital para detalhes legais e regulamentares.
- Fontes `pointer` indicam apenas escopo e não sustentam detalhes jurídicos específicos.
- A IA deve separar conteúdo oficial, complementar e material didático gerado.
- Questões da IA são inéditas e ficam identificadas como `AI_GENERATED`, com banca `IA (perfil Cesgranrio)`. Nunca apresentá-las como questões realmente aplicadas pela Cesgranrio.
- Aulas e questões passam por validação estrutural antes da persistência.

## 🔁 Progresso, SRS e sequência diária

- `src/lib/srs.ts` contém a regra própria de repetição espaçada da plataforma. Não descrevê-la como SM-2.
- `src/lib/streak.ts` calcula a sequência diária usando `America/Sao_Paulo`.
- Questões, flashcards, simulados e feedback de aula atualizam a sequência quando a atividade é efetivamente registrada.
- As rotas possuem proteções contra reenvios imediatos para reduzir XP e progresso duplicados. Essas proteções não substituem idempotência persistente para concorrência de produção.

## 🧪 CI

O `.github/workflows/ci.yml` roda em pushes e pull requests para `main` e executa:

1. `npm ci`
2. `npm run prisma:generate`
3. `npm run typecheck`
4. `npm run build`

O build usa uma `DATABASE_URL` de CI e não depende do banco de produção.
