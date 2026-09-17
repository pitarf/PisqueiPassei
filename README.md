# TRANSPETRO STUDY 2026.3 • Ênfase 18: Suprimento de Bens e Serviços

Plataforma especializada de alto rendimento para preparação individual no concurso público da **TRANSPETRO 2026.3** (Edital Oficial • Processo Seletivo Público • Fundação Cesgranrio).

---

## 🎯 Visão Geral do Projeto

- **Cargo / Ênfase:** Profissional Transpetro de Nível Técnico • Ênfase 18: Suprimento de Bens e Serviços
- **Banca Examinadora:** Fundação Cesgranrio
- **Data da Prova:** 06 de Dezembro de 2026
- **Distribuição de Prova Oficial (60 Questões • 4 horas):**
  - **Língua Portuguesa:** 10 questões (Básicas)
  - **Matemática:** 10 questões (Básicas)
  - **Conhecimentos Específicos:** 40 questões (Específicas)
- **Critérios Oficiais de Eliminação (Edital Cesgranrio):**
  - Menos de 50% em Conhecimentos Gerais (menos de 10/20)
  - Menos de 50% em Conhecimentos Específicos (menos de 20/40)
  - Nota 0 em Língua Portuguesa
  - Nota 0 em Matemática
- **Meta de Estudo da Plataforma:** 47/60 pontos (78,3%) — meta interna configurável para garantir competitividade.

---

## 📚 Taxonomia Oficial Rigorosa (47 Tópicos)

O sistema segue com fidelidade estrita o conteúdo programático do edital:
1. **Língua Portuguesa (8 tópicos):** Compreensão de textos, ortografia, coesão, classes de palavras, concordância, crase, pontuação, significação das palavras.
2. **Matemática (10 tópicos):** Conjuntos, razão/proporção, funções, equações e sistemas, análise combinatória, probabilidade, estatística básica, matemática financeira, geometria plana, geometria espacial.
3. **Noções de Administração e Logística (5 tópicos):** Planejamento estratégico/tático/operacional, administração da qualidade, gestão por processos, atendimento ao cliente, KPIs logísticos.
4. **Logística e Cadeia de Suprimentos (11 tópicos):** Conceitos de logística e SCM, gestão de compras, estoques e almoxarifados, negociação, e-commerce, seleção de fornecedores, modalidades de transporte, gestão de transporte de cargas, gestão/fiscalização de contratos, sustentabilidade, logística 4.0.
5. **Legislação (6 tópicos):** Decreto nº 2.745/1998, Lei nº 13.303/2016 (Arts. 28 a 91), LC nº 123/2006 (Arts. 42 a 49), Lei nº 14.133/2021, RLCT Transpetro, LGPD em contratações públicas.
6. **Noções de Contabilidade e Informática (7 tópicos):** Conceitos e objetivos contábeis, receitas/despesas/custos, documentos fiscais e NF, administração tributária, Excel, Word, PowerPoint.

---

## 🛠️ Stack Tecnológica

- **Framework:** [Next.js 15.1 (App Router)](https://nextjs.org/) & [React 19](https://react.dev/)
- **Linguagem & Tipagem:** TypeScript 5.7+ (estrito)
- **Estilização:** Tailwind CSS & Lucide Icons
- **Banco de Dados & ORM:** PostgreSQL (Neon Serverless) com Prisma ORM v6
- **Testes Unitários:** Bun Test Runner nativo (28 testes com isolamento de CI)
- **Testes E2E:** Playwright (Desktop Chrome 1440x900 & Mobile Chrome 390x844)
- **Inteligência Artificial:** Google Gemini (`gemini-3.6-flash`) integrado com RAG local e diretrizes do Humanizer

---

## 🚀 Como Executar Localmente

### 1. Pré-requisitos
- Node.js 20+ ou 24
- Bun (opcional para rodar testes ultrarrápidos)
- PostgreSQL local ou instância remota (ex: Neon)

### 2. Variáveis de Ambiente
Crie um arquivo `.env` na raiz com base nas chaves do projeto:
```env
DATABASE_URL="postgresql://usuario:senha@host:5432/transpetro_study?sslmode=require"
GEMINI_API_KEY="sua_chave_gemini_aqui"
```

### 3. Instalação e Preparação do Banco
```bash
npm install
npm run prisma:generate
npm run prisma:push
npm run prisma:seed
```

### 4. Executando os Testes
```bash
# Testes unitários (Regras de exame, taxonomia 47, SRS, RAG e streak)
npm test

# Testes de Concorrência e Idempotência
node scripts/test-concurrency.js

# Auditoria Completa do Banco
node scripts/check-db.js

# Testes End-to-End (Playwright)
npx playwright test
```

### 5. Executando a Aplicação
```bash
npm run dev
# Acesse em: http://localhost:3000
```
