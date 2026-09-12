# CHANGELOG - TRANSPETRO STUDY 2026.3

Todas as alterações notáveis deste projeto são registradas neste documento, em conformidade com as Diretrizes Mestres de Desenvolvimento.

## [0.1.6] - 2026-09-12

### Adicionado
- **Base Legislativa Oficial para RAG:**
  - Inclusão dos arts. 42 a 49 da Lei Complementar nº 123/2006 em `documents/legislacao/lei-123-2006.md`.
  - Conteúdo preservado conforme a fonte oficial do Portal da Legislação, com redação vigente e indicações de alterações, revogações e remissões relevantes.
  - Documento vinculado ao conteúdo prioritário da Ênfase 18 - Suprimento de Bens e Serviços.

## [0.1.2] - 2026-09-11

### Adicionado
- **Documentação Oficial de Editais (Base RAG):**
  - Inclusão do edital original completo e integral em `documents/edital/edital-2026.3.md` (sem alterações ou resumos).
  - Inclusão do documento oficial de retificações em `documents/edital/retificacao-edital-2026.3.md` (compilação integral das 4 retificações do DOU).

## [0.1.1] - 2026-09-11

### Alterado
- **Retificação Oficial de Edital:** Atualizada a data prevista da prova para **06 de Dezembro de 2026 (06/12/2026)** em todos os componentes, contadores regressivos, prompts do Professor IA e banco de dados.

## [0.1.0] - 2026-09-11

### Adicionado
- **Arquitetura Base:** Projeto configurado com Next.js 15 (App Router), TypeScript, Tailwind CSS, Lucide Icons e Toaster Sonner.
- **Banco de Dados & Persistência:** Esquema relacional Prisma com PostgreSQL (suporte a Docker com volume `postgres-data`), transações com `prisma.$transaction` e isolamento de dados.
- **Seed Oficial do Edital:** Cadastro de 100% da taxonomia do edital Transpetro 2026.3 (Ênfase 18) com 6 matérias e 49 tópicos oficiais sem abreviações ou alterações.
- **Dashboard Principal (`/`):**
  - Card "Rumo à Aprovação" com contagem regressiva para 29/11/2026 e comparativo contínuo com a meta de 47/60 pontos.
  - Widget inteligente "Continuar Estudando" que recomenda o próximo tópico prioritário.
  - Seções de "Revisar Agora" (itens com repetição espaçada pendente) e "Seus Pontos Fracos" (< 70% de domínio).
  - Acompanhamento de domínio por matéria e evolução dos últimos simulados.
- **Edital Verticalizado (`/edital`):** Árvore completa de conteúdos com níveis de domínio (0 a 100%), status cognitivo e atalhos rápidos para aula e treino de questões.
- **Motor de Aulas Interativas (`/aula/[topicId]`):**
  - Geração estruturada em 9 passos didáticos (objetivos, explicação simples, conceitos com distinção edital vs complementar, casos práticos Petrobras/Transpetro, pegadinhas Cesgranrio, memorização, resumo, flashcards e questões de fixação).
  - Cache no PostgreSQL para custo zero em acessos repetidos.
  - Barra de feedback cognitivo (Não entendi / Preciso revisar / Entendi) integrada ao algoritmo SRS.
- **Banco de Questões & Treino de Erros (`/questoes`):**
  - Baterias configuráveis de questões (10, 20, 40, 60) no padrão Cesgranrio (alternativas A a E).
  - Modo "Treinar Meus Erros" focado exclusivamente em tópicos com aproveitamento inferior a 70%.
  - Identificação visual obrigatória de origem (IA vs Cesgranrio Real).
- **Simulado Oficial Cesgranrio (`/simulado`):**
  - Estrutura de 60 questões (40 Específicas, 10 Português, 10 Matemática).
  - Cronômetro regressivo de 4 horas e folha de respostas rápida para navegação.
  - Diagnóstico pós-prova com cálculo de nota, critérios de eliminação do edital e recomendações pedagógicas.
- **Sistema de Flashcards Espaçados (`/flashcards`):**
  - Cartões interativos 3D com classificação Fácil (7 dias), Médio (3 dias) e Difícil (1 dia).
- **Professor IA (`/professor`):**
  - Assistente conversacional conectado ao histórico do Rafael, com injeção de pontos fracos, erros recentes e regras anti-alucinação normativa.
- **Desempenho & Estatísticas (`/desempenho`):**
  - Métricas de acertos, erros, taxa de aproveitamento, horas estudadas e barras de domínio por matéria.
- **Configurações & Backup (`/configuracoes`):**
  - Ajuste de meta de pontos, horas diárias de estudo e exportação de backup de dados em arquivo JSON.
- **Documentação Técnica:** `MANUAL_DEV.md`, `MANUAL_USER.md`, `.env.example` e `docker-compose.yml`.
