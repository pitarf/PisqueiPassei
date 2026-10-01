# CHANGELOG - TRANSPETRO STUDY 2026.3

Todas as alterações notáveis deste projeto são registradas neste documento.

## [0.1.35] - 2026-10-01

### Hardening do Motor Adaptativo, Histórico Estrito e Evolução do Treino
- **Histórico Estrito e Sem Destruição de Memória de Erros (`src/lib/adaptive-engine.ts`):**
  - Implementada função determinística `evaluateQuestionHistory()` que analisa todo o histórico de tentativas de cada questão sem apagar erros passados após um único acerto fortuito.
  - Mapeamento de status estritos de estudo por questão: `NUNCA_VISTA`, `PENDENTE` (erro recente ativo), `REVISAO_DEVIDA` (intervalo SRS vencido), `EM_CONSOLIDACAO` (questão com histórico de erro, mas em acerto recente ainda não consolidado) e `CONSOLIDADA` (três ou mais acertos consecutivos com espaçamento temporal adequado).
  - A fila de revisão de erros prioriza com rigor questões `PENDENTE` e `REVISAO_DEVIDA`, excluindo completamente itens consolidados.
- **Seleção Pseudoaleatória Determinística (PRNG Mulberry32):**
  - Adicionado gerador determinístico `createSeededRng(seed)` baseado em Mulberry32 e `seededShuffle()`, eliminando o uso imprevisível de `Math.random()` na composição de blocos de estudo.
  - Garantia de 100% de reproducibilidade em testes automatizados e emparelhamento determinístico de desempate por `statementHash` e `questionId`.
  - Suporte ao parâmetro `seed` nos endpoints `/api/questions/batch` e rotas do motor adaptativo.
- **Cadência Alinhada de Repetição Espaçada (SRS 1, 3, 7, 14, 30 Dias):**
  - Alinhamento da progressão em `/api/questions/submit` para os patamares de 1 dia, 3 dias, 7 dias, 14 dias e 30 dias de intervalo na persistência do banco de dados Neon.
- **Tela Pós-Sessão Enriquecida e Banner Pré-Treino (`QuestionSession.tsx`):**
  - Introduzido banner contextual antes do início do treino informando: tipo da sessão (adaptativa, erro ou padrão), contagem de questões novas vs de revisão e dificuldade esperada.
  - Implementado relatório pós-sessão completo exibindo: total respondido, acertos, erros, percentual de acerto, tempo decorrido formatado (`Xm Ys`), discriminação de acertos/erros por nível de dificuldade, nível cognitivo e tópico, listagem explícita dos itens que necessitam revisão e recomendação automatizada acionável para o próximo passo de estudo.
- **Painel de Desempenho Refinado (`/desempenho`):**
  - Distinção nítida entre "Questões Únicas Vistas" (IDs únicos do acervo de 940) e "Tentativas Totais Registradas", prevenindo inflação estatística e separando acurácia bruta de domínio bayesiano.
- **Validação e Homologação Integral:**
  - 87/87 testes unitários Bun aprovados (incluindo 19 testes em `adaptive-engine.test.ts` cobrindo cenários de 1 erro, 3 erros, erro seguido de acerto, ordenação cronológica e consolidação).
  - 100% de conformidade de integridade no banco Neon com 940 questões ativas (0 órfãos, 0 duplicidades).
  - TypeScript typecheck e Next.js build de produção finalizados com 0 erros.
  - 22/22 testes E2E Playwright aprovados em Desktop Chrome e Mobile Chrome.

## [0.1.34] - 2026-10-01

### Motor Adaptativo de Estudo sobre o Acervo de 940 Questões
- **Mecanismo de Domínio Bayesiano e Calibração Amostral (`src/lib/adaptive-engine.ts`):**
  - Implementado cálculo de domínio por tópico com encolhimento bayesiano empírico ($\frac{C + 4}{N + 8} \times 100 \times \text{diffMultiplier}$), eliminando distorções de amostras pequenas (ex: 2/2 não infla falsamente para 100%, estabilizando em ~60%, enquanto 22/30 atinge ~70%).
  - Mapeamento detalhado por tópico: questões respondidas, acertos, erros, sequências (streaks), dificuldade média ponderada (1 a 3), performance por nível cognitivo, tipo de questão e status de revisão SRS.
- **Fila Inteligente "ESTUDAR AGORA" (10 Questões):**
  - Montagem dinâmica com seleção de até 3 tópicos prioritários (priorizando menor domínio, erros recentes, tópicos nunca vistos e revisões vencidas).
  - Progressão adaptativa de dificuldade: $< 50\%$ direciona para FÁCIL; $50\% - 70\%$ para MÉDIA; $70\% - 85\%$ para MÉDIA/DIFÍCIL; $> 85\%$ para DIFÍCIL.
  - Prevenção determinística de questões repetidas imediatas por `statementHash` e priorização de questões inéditas dentro do acervo de 940 itens.
- **Fila "Revisar Meus Erros" com Repetição Espaçada (SRS):**
  - Questões erradas não são descartadas após um único acerto; passam por consolidação em intervalos espaçados (1 -> 3 -> 7 -> 14 -> 30 dias).
  - Re-erro em questão reinicia a cadência com penalização e priorização imediata na fila de revisão.
- **Enriquecimento Diagnóstico Pós-Simulado Oficial Cesgranrio (60 Questões):**
  - Preservação estrita do contrato do simulado de 60 questões (10 Português, 10 Matemática, 40 Específicas, 4 horas, eliminatórias oficiais e meta 47/60).
  - Diagnóstico detalhado: taxa de acerto por nível de dificuldade, nível cognitivo, questões não respondidas, tópicos com pior desempenho e geração de plano automatizado "Seu próximo estudo" com cartões e links de ação direta.
- **Integração de Interface e API:**
  - Novo endpoint `/api/study/adaptive` para diagnóstico global e prévia de sessão.
  - Endpoints `/api/questions/batch` e `/api/questions/submit` operando 100% sobre o banco mestre de 940 questões (zero geração IA redundante).
  - Painel da página inicial (`/`) e página de questões (`/questoes`) adaptadas para acionar o fluxo "ESTUDAR AGORA" e "Revisar Meus Erros".
- **Homologação e Testes:**
  - 74/74 testes unitários e de integração aprovados (`bun test src/lib`).
  - TypeScript typecheck (`tsc --noEmit`) 100% aprovado.
  - Next.js build de produção finalizado com sucesso.
  - 22/22 testes E2E do Playwright aprovados (11 Desktop Chrome e 11 Mobile Chrome).

## [0.1.33] - 2026-09-30

### Expansão Mestre do Acervo para 940 Questões Ativas (20 por Tópico em 47/47 Tópicos)
- **Expansão e Cobertura Total do Edital (Ênfase 18 - Suprimento de Bens e Serviços):**
  - O banco de questões ativas avançou de 470 para exatamente **940 questões ativas**.
  - **100% dos 47 tópicos oficiais** atingiram o patamar de excelência pedagógica (nível BOA: $\ge 20$ questões por tópico).
  - Distribuição estrita e balanceada por disciplina:
    - **Língua Portuguesa:** 160 questões (8 tópicos $\times$ 20)
    - **Matemática:** 200 questões (10 tópicos $\times$ 20)
    - **1. Noções de Administração e Logística:** 100 questões (5 tópicos $\times$ 20)
    - **2. Logística e Cadeia de Suprimentos:** 220 questões (11 tópicos $\times$ 20)
    - **3. Legislação:** 120 questões (6 tópicos $\times$ 20)
    - **4. Noções de Contabilidade e Informática:** 140 questões (7 tópicos $\times$ 20)
    - **Total no Acervo Ativo:** **940 questões**.
- **Equilíbrio Estatístico e Orgânico de Gabaritos (A-E):**
  - Distribuição global perfeitamente homogênea: **A (20,5%), B (20,9%), C (20,0%), D (20,3%), E (18,3%)**.
  - Simetria mantida em todas as 6 disciplinas (inclusive 20% cravado por letra em Logística e Cadeia de Suprimentos).
  - Viés de alternativa mais longa ou tamanho induzido: **0 ocorrências**.
  - Disparidade extrema de tamanho entre opções: **0 ocorrências**.
- **Blindagem Pedagógica e Curadoria Anti-Alucinação:**
  - Validação jurídica automática bloqueando citações de artigos inexistentes nas normas oficiais (Lei 13.303/2016, Lei 14.133/2021, Decreto 2.745/1998, LC 123/2006, RLCT e LGPD).
  - Validação estrita de funções e fórmulas de planilhas eletrônicas no Microsoft Excel em Português Brasil (PT-BR), expurgando funções inexistentes e admitindo fórmulas legítimas.
  - QA Risk Score de excelência: **920 questões (97,9%) em Baixo Risco** e **0 em Alto Risco**.
  - Comprimento médio das justificativas pedagógicas: **803,8 caracteres**.
- **Homologação e Validação Técnica:**
  - 68/68 testes unitários e de integração aprovados (`bun test src/lib`).
  - TypeScript typecheck (`tsc --noEmit`) com 0 erros.
  - Next.js 15.5.25 produção build finalizado com 100% de rotas compiladas com sucesso.
  - 22/22 testes E2E do Playwright aprovados (11 Desktop Chrome e 11 Mobile Chrome).
  - Auditoria relacional `scripts/check-db.js` aprovada com 0 órfãos e 0 duplicidades.

### Curadoria do Acervo, Eliminação de Boilerplate e Reequilíbrio de Gabarito
- **Reequilíbrio de Gabarito em Noções de Administração e Logística:**
  - Identificada a anomalia crítica herdada do seed sintético inicial (C = 88%, A = 0%).
  - 40 questões de Administração (tópicos 1.1 a 1.5) foram integralmente curadas e reescritas com temas aprofundados do edital (BSC, 5W2H, PDCA, Ishikawa, 5S, TQM, ISO 9001, BPMN, Teoria das Restrições, SLA, CRM, NPS, Ouvidoria, OTIF, IRA, Giro de Estoque, Ruptura, TCO, Fill Rate).
  - Distribuição de gabarito rebalanceada de forma orgânica e homogênea: **A (24%), B (28%), C (14%), D (22%), E (12%)**.
- **Erradicação Total de Boilerplates e Prefixos Sintéticos:**
  - 100% dos prefixos e templates repetitivos (`[Língua Portuguesa - Item X]`, `[Matemática - Item X]` e cópias de ponto de pedido) foram eliminados do acervo pedagógico ativo.
  - As 62 questões legadas foram substituídas por itens autênticos com enunciados situacionais e explicações didáticas completas.
- **Resolução e Classificação dos 149 Pares Semanticamente Suspeitos:**
  - Auditados todos os 149 pares com geração de `question-bank-semantic-review.json`.
  - Comprovado que 142 pares (95,3%) eram resultantes exclusivamente da repetição do seed sintético inicial de CI.
  - Após a curadoria, o total de pares suspeitos despencou de **149 para apenas 13** (redução de 91,3%), correspondentes a cobranças de facetas distintas de regras gramaticais da banca Cesgranrio, com **zero duplicações reais**.
- **Enriquecimento Integral de Metadados Pedagógicos:**
  - 100% das 470 questões agora possuem metadados completos de `questionType` e `cognitiveLevel` (redução de 60 ausências para zero).
- **Calibração do Motor de QA Risk Score:**
  - O algoritmo em `src/lib/pedagogical-audit.ts` e `scripts/pedagogical-audit-engine.js` agora penaliza severamente ausência de metadados (+30 pts), boilerplates sintéticos (+40 pts) e duplicidade semântica (+25 pts).
  - Adicionadas funções utilitárias `detectAnswerAnomaly` e `reorderOptionsSafely`.
- **Suíte de Testes Expandida:**
  - Novos testes automatizados em `src/lib/pedagogical-audit.test.ts` para detecção de anomalias de gabarito, penalização de metadados e reordenação segura de alternativas (68/68 testes unitários passando).

## [0.1.31] - 2026-09-30

### Auditoria de Qualidade Real das 470 Questões, Motor Semântico e Rigor Técnico
- **Auditoria Estrutural e Semântica do Acervo Completo:**
  - Implementado motor determinístico de auditoria em `src/lib/pedagogical-audit.ts` e `scripts/pedagogical-audit-engine.js`.
  - Detecção de repetição e duplicidade semântica por coeficiente de Sørensen-Dice e Jaccard sobre tokens conceituais e bigramas normalizados sem stopwords.
  - Identificação de 149 pares de questões suspeitas de reescrita conceitual para revisão editorial conservadora (sem remoção destrutiva automática).
- **Auditoria de Legislação e Rigor Normativo:**
  - Verificação e cruzamento sistemático de citações legais contra os textos de `documents/legislacao/` (Lei 13.303/2016, Lei 14.133/2021, Decreto 2.745/1998, LC 123/2006, LGPD 13.709/2018, RLCT e CF/88).
  - Teto de artigos por norma para flagrar alucinações e distinção correta de menções constitucionais (ex.: art. 173 da CF/88).
- **Auditoria de Informática e Planilhas:**
  - Catálogo canônico de funções oficiais do Microsoft Excel em Português Brasil (PT-BR) com mais de 60 funções validadas (`SOMA`, `PROCV`, `CONT.SE`, `SE`, etc.).
  - Filtro contra alucinações de fórmulas e validação de comandos do pacote Office 365.
- **Auditoria de Matemática e Cálculo Determinístico:**
  - 100/100 itens de Matemática auditados: 95% com dados numéricos explícitos nas alternativas e 97% com dados suficientes e 5 opções distintas para resolução determinística.
- **Auditoria de Alternativas e QA Risk Score (0 a 100):**
  - Detecção de viés de tamanho de alternativa (0 ocorrências de correta como outlier longo).
  - Detecção de distratores caricatos/absurdos e sinônimos internos entre opções.
  - 100% das 470 questões classificadas na faixa de Baixo Risco de QA (score 0-20), com comprimento médio de explicação de 735.5 caracteres.
- **Unificação do Mecanismo RAG:**
  - Atualizado `scripts/generate-question-bank.js` para utilizar motor pontuado com relevância multi-termo, prioridade de fontes locais e limites de caracteres idênticos ao RAG canônico (`src/lib/rag.ts`).
- **Testes e Validação:**
  - Criada suíte unitária `src/lib/pedagogical-audit.test.ts` (10/10 novos testes passando).
  - Suíte total ampliada para 65/65 testes unitários/integração Bun (`100% pass`).
  - Suíte E2E Playwright com 22/22 testes verdes (Desktop e Mobile).
  - Build de produção e `db:check` aprovados com zero falhas.

## [0.1.30] - 2026-09-30

### Abastecimento Integral do Acervo Pedagógico (470 Questões • 47/47 Tópicos)
- **Superação da Escassez de Questões:** O banco pedagógico foi expandido de 60 para **470 questões inéditas**, eliminando 100% dos 24 tópicos em nível crítico.
- **Cobertura Adequada Total (100%):** Todos os 47 tópicos oficiais da Ênfase 18 (6 disciplinas) possuem rigorosamente **pelo menos 10 questões ativas cadastradas**.
  - **Língua Portuguesa (8 tópicos):** 80 questões (10 por tópico).
  - **Matemática (10 tópicos):** 100 questões (10 por tópico).
  - **1. Noções de Administração e Logística (5 tópicos):** 50 questões (10 por tópico).
  - **2. Logística e Cadeia de Suprimentos (11 tópicos):** 110 questões (10 por tópico).
  - **3. Legislação (6 tópicos):** 60 questões (10 por tópico, fundamentadas estritamente nas normas oficiais).
  - **4. Noções de Contabilidade e Informática (7 tópicos):** 70 questões (10 por tópico).
- **Diversificação de Gabarito e Tipologia Pedagógica:**
  - Gabaritos equilibrados: A (19.4%), B (20.2%), C (27.2%), D (17.9%), E (15.3%).
  - Dificuldades: FACIL (136), MEDIA (275), DIFICIL (59).
  - Níveis cognitivos e tipologias: Aplicação (96), Conceito (108), Caso Prático (99), Procedimento (66), Cálculo (17), Comparação (12), Interpretação (10).
- **Automação Incremental:** Criado o comando `npm run generate:questions` (`scripts/generate-question-bank.js`) com suporte a `--target`, `--subject`, `--topic`, `--batch` e preenchimento exclusivo de déficit.
- **Validação e Estabilidade:** 55/55 testes unitários passando, 22/22 testes E2E Playwright (Desktop e Mobile) verdes, typecheck com 0 erros e montagem de simulados verificada com zero déficits.

## [0.1.29] - 2026-09-30

### Auditoria e Evolução Pedagógica (Ênfase 18 • TRANSPETRO 2026.3)
- **Auditoria de Qualidade e Cobertura dos 47 Tópicos:**
  - Criados os scripts `scripts/audit-question-quality.js` e `scripts/question-bank-quality-report.js` vinculados aos comandos `npm run audit:quality` e `npm run report:quality`.
  - Mapeamento detalhado dos 47 tópicos da Ênfase 18 por faixas de cobertura: 24 tópicos em nível CRÍTICO (0 questões), 18 em MUITO BAIXA (1 a 4) e 5 em BAIXA (5 a 9). Identificada concentração inicial em Noções de Administração e viés de gabarito C no seed sintético.
- **Blindagem Pedagógica e Proveniência de IA (`src/lib/gemini.ts` e `src/lib/question-validator.ts`):**
  - Forçado categoricamente que qualquer questão gerada por IA seja sanitizada com `origin: "INEDITA_IA"`, `banca: "IA (perfil Cesgranrio)"` e aviso explícito no `sourceRef`.
  - Implementado detector de alegações fraudulentas no validador (`FORBIDDEN_OFFICIAL_PATTERNS`) impedindo que enunciados ou explicações afirmem ter sido aplicadas em provas reais ou gabaritos oficiais Cesgranrio.
  - Implementado detector de anomalia métrica de tamanho (rejeição de questões onde a alternativa correta é um outlier com o triplo do tamanho dos distratores).
  - Rejeição de alternativas vazias ou duplicadas por normalização textual.
- **Motor Pedagógico de Questões Irmãs (`generateSiblingQuestionBatch`):**
  - Implementadas regras pedagógicas estritas para os 5 modos: `FACIL` (conceito direto, alternativas contrastadas), `EQUIVALENTE` (mesma densidade e complexidade), `DIFICIL` (análise crítica, exceções e cenários combinados), `NOVO_CENARIO` (transposição para operações Transpetro/Petrobras) e `DISTRATORES` (incorporação de 4 armadilhas clássicas da Cesgranrio com explicação das razões de cada distrator).
- **Motor Adaptativo de Estudo (`src/lib/study-priority.ts`):**
  - Prioridade pedagógica reequilibrada: tópicos não iniciados ou proficiência <50% recebem foco de consolidação de base com nível `FACIL`; domínio 50%-79% recebe treino intermediário `MEDIA`; domínio >=80% recebe `DIFICIL` e casos práticos; revisões vencidas mantêm prioridade máxima (+60 pontos).
- **Balanceamento do Simulado Cesgranrio (`src/lib/simulation.ts`):**
  - Implementado algoritmo estratificado (`selectStratifiedQuestions`) com round-robin por tópico, garantindo dispersão temática equilibrada e preservando os 60 itens (10 Port, 10 Mat, 40 Espec), 4 horas e critérios de corte.
- **Testes Automatizados:** 55 testes unitários/integração Bun passando 100%, 22/22 testes E2E Playwright (Desktop e Mobile) aprovados e typecheck sem erros.



### Homologação Final de CI com PostgreSQL 16, Migration Versionada e Endurecimento Estrutural
- **Migration Prisma Versionada (`20260930_add_statement_hash_unique`):** Criada migration SQL idempotente com bloco PL/pgSQL que detecta duplicidades preservando deterministamente a questão mais antiga (`createdAt` / `id`), redirecionando tentativas atreladas antes de aplicar o índice único `@@unique([topicId, statementHash])`.
- **PostgreSQL 16 Service Container no CI:** Integrado container de serviço Postgres 16 em `.github/workflows/ci.yml`, com healthcheck `pg_isready` e esteira determinística completa.
- **Pipeline CI de Alta Confiabilidade (Fail-Fast):** Execução encadeada: migração (`prisma db push`), seed determinístico (`seed-ci-e2e.ts`), auditoria profunda de integridade com bloqueio (`db:check`), checagem estrita de tipos (`tsc --noEmit`), 46 testes unitários e de integração (`bun test src/lib`), build de produção Next.js 15 e suíte E2E Playwright Chromium em Desktop e Mobile.
- **Centralização do Hash Determinístico:** Regra única e centralizada em `computeStatementHash` (`src/lib/question-validator.ts`) adotada em todos os scripts (`backfill-hashes.js`, `import-question-bank.js`, `seed-ci-e2e.ts`, `check-db.js`, rotas de API e testes).
- **Testes de Concorrência e Idempotência:**
  - `concurrency-hash.test.ts`: prova colisão `P2002` em inserções simultâneas com mesmo `(topicId, statementHash)` e absorção graciosa.
  - `idempotency.test.ts`: prova proteção estrita em `QuestionAttempt.idempotencyKey` e `Simulation.idempotencyKey` sob 5 requisições paralelas concorrentes.
  - `simulation.test.ts`: prova que `loadExamQuestions` carrega exatamente 60 questões (10 Português, 10 Matemática e 40 Específicas) com 60 IDs únicos e 0 déficits.
- **Suíte E2E Playwright Ampliada (22/22 testes):** 11 cenários completos em Desktop Chrome (1440x900) e Mobile Chrome (390x844) cobrindo home, edital, questões, filtro de dificuldade, simulado 60q 4h, simulado interativo com cronômetro, histórico, Professor IA, flashcards, desempenho e configurações.
- **Auditoria Estrita Aprovada:** 47 tópicos, 6 disciplinas, 0 órfãos, 0 duplicidades e distribuição 10/10/40 validada com `exit code 0`.

## [0.1.27] - 2026-09-30

### Sincronização de Banco Histórico, Questões Irmãs e E2E Playwright Expandido
- **Correção de Tipagem & Resiliência:** Corrigidos tipos estritos e assinaturas de métodos em `src/lib/gemini.ts`, `src/lib/question-validator.ts`, `src/app/api/questions/batch/route.ts` e `src/app/api/questions/siblings/route.ts`.
- **Módulo Central de Simulado (`src/lib/simulation.ts`):** Extração e unificação das funções de montagem de prova (`loadExamQuestions`, `refillStock`), evitando duplicação de regras entre a API (`/api/simulado`) e a Server Page (`/simulado`).
- **Aviso Transparente de Déficit:** Exibição clara no frontend caso haja déficit de questões para a composição 10/10/40, sem mascarar números e com opção direta de retry ou treino livre.
- **Sincronização de Schema Neon PostgreSQL:** Sincronizadas colunas e tabelas para `HistoricalExam` e `HistoricalQuestion` com suporte a metadados didáticos (`questionType`, `cognitiveLevel`, `subtopic`, `verificationStatus`).
- **Suíte E2E Playwright Ampliada (18/18 testes):** Cobertura expandida para simulação interativa, banco histórico (`/questoes/historico`), Professor IA (`/professor`), flashcards e desempenho em Desktop e Mobile Chrome (18 passed em 16.8s).
- **Validação Completa:** Typecheck 0 erros, 28 testes unitários passando 100%, auditoria de banco 100% íntegra (47 tópicos oficiais) e build de produção bem-sucedido.

## [0.1.26] - 2026-09-17

### Hardening Funcional Completo, Concorrência e Automação E2E
- **Taxonomia Estrita 47 Tópicos:** Removidas e corrigidas quaisquer menções residuais a "49 tópicos" em aliases do RAG e documentação. Taxonomia oficial homologada em 47 tópicos exatos divididos em 6 matérias.
- **Validador Estrutural de Questões (`src/lib/question-validator.ts`):** Módulo central que exige 5 alternativas não vazias e sem duplicatas internas, gabarito A-E, justificativa obrigatória e proveniência transparente (`AI_GENERATED`, perfil Cesgranrio).
- **Auto-suprimento Resiliente do Simulado (`/api/simulado`):** Se o estoque de questões tiver déficit para fechar as 60 questões (10 Português, 10 Matemática, 40 Específicas), o sistema aciona reposição automática e controlada com IA antes de falhar, evitando retornos 503 desnecessários.
- **Isolamento de Concorrência & Idempotência (`scripts/test-concurrency.js`):** Script aprimorado que testa disparos concorrentes simultâneos com a mesma chave. Validado com sucesso: 1 única gravação no banco, 1 único incremento de XP e rejeição protegida por chave única.
- **Testes Unitários Expandidos (`src/lib/exam.test.ts`):** Cobertura exaustiva de todas as fronteiras e critérios oficiais de eliminação da Cesgranrio (19 vs 20 específicas, 9 vs 10 gerais, 0 vs 1 em Português/Matemática, meta 47 não eliminatória). 28/28 testes passando 100%.
- **Suíte E2E Playwright Completa (`e2e/transpetro.spec.ts`):** Criada e validada suíte cobrindo toda a jornada do aluno (Início -> Edital -> Questões -> Simulado -> Flashcards -> Desempenho -> Configurações) tanto em Desktop Chrome (1440x900) quanto em Mobile Chrome (390x844). 12/12 testes E2E aprovados.
- **Auditoria de Integridade do Banco (`scripts/check-db.js`):** Auditoria profunda validando 0 órfãos, 0 alternativas duplicadas e integridade relacional total.
- **Build de Produção e Documentação:** Next.js 15 compilando com 0 erros, `README.md`, `MANUAL_DEV.md` e `MANUAL_USER.md` sincronizados.

## [0.1.25] - 2026-09-17

### Varredura Completa e Aplicação do Humanizer em Toda a Plataforma
- **Varredura Paralela com Subagentes Especializados:** Aplicadas as diretrizes do Humanizer (`blader/humanizer`) em todas as telas e fluxos de estudo da plataforma.
- **Dashboard & Navegação Global (`/`, `SidebarNav`, `AppHeader`, `BottomNav`):**
  - Substituídos clichês motivacionais inflados ("Rumo à Aprovação", slogans corporativos) por chamadas autênticas e diretas ("Transpetro 2026", "Continuar de onde parou", "Praticar erros").
- **Edital Verticalizado e Leitor Didático (`/edital`, `/aula/[topicId]`):**
  - Títulos e orientações reescritos com simplicidade ("O que você precisa saber", "Em poucas palavras", "Atenção às pegadinhas da banca").
  - Botões e notificações de estudo humanizados ("Aula pronta para estudo", "Tirar dúvida", "Preciso reaprender", "Entendi bem").
- **Banco de Questões e Simulado de Prova (`/questoes`, `/simulado`):**
  - Enunciados, instruções de prova e opções de treino reformulados ("Padrão Cesgranrio", "Prática de Questões", "Rever O Que Errei").
  - Feedbacks de resposta amigáveis e acolhedores ("Na mosca! Resposta certa", "Não foi dessa vez") e confirmações de envio transparentes ("Entregar Prova").
- **Flashcards SRS (`/flashcards`):**
  - Botões de classificação do algoritmo SRS substituídos por reações humanas naturais: "Não lembrei", "Lembrei com esforço" e "Lembrei fácil".
  - Explicação do intervalo espaçado simplificada e clara para o estudante.
- **Professor IA (`/professor`):**
  - Acolhimento inicial objetivo e descontraído, sem saudações robóticas ou apresentações pomposas. Status e sugestões rápidas mais amigáveis.
- **Desempenho e Configurações (`/desempenho`, `/configuracoes`):**
  - Vocabulário direto de concurseiro ("Seu progresso", "Questões de treino", "Domínio do edital", "Tempo estudado", "Tópicos para reforçar").
  - Configurações e cópias de segurança explicadas de forma simples e transparente.
- **Validação de Código e Testes:** 100% dos 20 testes unitários aprovados e compilação do TypeScript estritamente verificada.

## [0.1.24] - 2026-09-17

### Humanização da IA (Integração com Humanizer)
- **Instalação do Skill Humanizer:** Baixado e instalado o repositório oficial `blader/humanizer` em `~/.gemini/config/skills/humanizer`, padrão de referência na comunidade (gstack / Y Combinator) para remoção de vícios de escrita artificial de LLMs.
- **Aprimoramento de Tom do Professor IA:** Integradas diretrizes de escrita humana e natural em `src/lib/gemini.ts` (`SYSTEM_INSTRUCTION_TRANSPETRO`), instruindo o modelo a evitar clichês robóticos ("não apenas X, mas Y", "é fundamental lembrar", "ecossistema", introduções e conclusões pomposas vazias) e a adotar tom direto, prático, acolhedor e focado no concurso da Transpetro.

## [0.1.23] - 2026-09-17

### Correção de CI e Isolamento de Testes Unitários
- **Desacoplamento de Banco Remoto no CI:** Ajustado `src/lib/taxonomy.test.ts` para validar estritamente o manifesto tipado oficial em ambientes isolados de CI (onde a `DATABASE_URL` aponta para serviço dummy sem banco real), mantendo a checagem remota completa ativa quando executado em ambientes locais com credenciais válidas.
- **Pipeline de CI 100% Verde:** Validada a execução local simulando a variável de ambiente exata do GitHub Actions (`set DATABASE_URL=postgresql://ci:ci@localhost:5432/transpetro_ci`), passando em 100% dos 20 testes sem falhas de autenticação.

## [0.1.22] - 2026-09-17

### Proteção de Integridade de Dados, Taxonomia Estrita e CI
- **Reconciliação e Migração Segura:** Reestruturado `scripts/reconcile-topics.js` e `prisma/seed.ts` para migrar automaticamente lições, questões, tentativas, flashcards, sessões de estudo e progresso antes de remover qualquer tópico obsoleto, eliminando o risco de `onDelete: Cascade` apagar conteúdo gerado.
- **Taxonomia Tipada e Exata (47 Tópicos):** Criado o manifesto oficial tipado `src/lib/taxonomy.ts` e suíte estrita em `src/lib/taxonomy.test.ts`, garantindo os 47 tópicos exatos da Ênfase 18 (Português: 8, Matemática: 10, Administração: 5, Suprimentos: 11, Legislação: 6, Contabilidade e Informática: 7).
- **Pipeline de CI com Testes Automatizados:** Adicionado setup do Bun e execução de `npm test` em `.github/workflows/ci.yml` antes do build de produção.
- **Validação de Produção:** 100% dos 20 testes automatizados aprovados, TypeScript sem erros (`tsc --noEmit`), build de produção Next.js e smoke test aprovados com HTTP 200 em todas as rotas.

## [0.1.21] - 2026-09-17

### Auditoria Completa de UI/UX e Correções por Subagentes Especializados
- **Edital Verticalizado (`/edital`):** Criado o componente interativo `EditalVerticalizadoClient.tsx` com abas de filtro (*Específicas / Básicas*), busca instantânea em tempo real por título/código, filtro por status de domínio e acordeons retráteis com animação de expansão.
- **Banco de Questões (`/questoes`):** Corrigida a consulta de categorias no Treino Misto (`category: { in: ["GERAL", "BASICO"] }`) e adicionado padding inferior de segurança contra a barra inferior mobile.
- **Simulado Cesgranrio (`/simulado`):** Adicionados badges de identificação por área temática (*Língua Portuguesa*, *Matemática*, *Conhecimentos Específicos*) e bordas temáticas nos 60 botões do mapa de questões.
- **Flashcards (SRS) (`/flashcards`):** Melhorado o contraste em modo escuro, feedback tátil (`active:scale-95`) e foco por teclado nos botões de autoavaliação.
- **Professor IA (`/professor`):** Atualizado o modelo do Google Gemini em `src/lib/gemini.ts` para `gemini-3.6-flash`, resolvendo instabilidade da API.
- **Aula por Tópico (`/aula/[topicId]`):** Implementada barra de abas didáticas no leitor de aula (`LessonViewer.tsx`) para navegação direta entre *Teoria*, *Mnemônicos*, *Flashcards* e *Questões de Fixação*.
- **Desempenho (`/desempenho`):** Prevenção de quebra de layout em títulos longos com `min-w-0` e `truncate`.
- **Prevenção Global de Overflow:** Adicionado `overflow-x: hidden` nas regras raiz de `globals.css`.

## [0.1.20] - 2026-09-17

### QA Visual, Testes E2E e Responsividade Mobile
- Integrado o **Playwright com Chromium** para auditoria visual automatizada das 8 rotas do sistema.
- Criado script de inspeção visual (`scripts/audit-frontend.js`) com captura em resolução Mobile (iPhone 14) e Desktop (1440x900).
- Criado script de demonstração visível interativa (`scripts/live-demo.js`) para acompanhamento em tempo real na tela.
- Criado teste de interações e fluxos E2E (`scripts/test-e2e-interactions.js`) validando navegação, formulários e filtros.
- Corrigida a responsividade do cabeçalho do **Professor IA** (`src/components/ai/ProfessorChat.tsx`) no mobile (`flex-wrap`, badges flexíveis e altura dinâmica `100dvh`).

## [0.1.19] - 2026-09-17

### Governança e Processo de Execução
- Adicionado documento de diretrizes de execução mestre (`documents/fases/EXECUCAO-MESTRE-SUBAGENTES.md`), estruturando a atuação de 8 subagentes especializados, alinhamento aos 47 tópicos oficiais da Ênfase 18, checklist de critérios de pronto e matriz de validação ponta a ponta.

### Banco de Dados e Taxonomia Oficial
- Reconciliada a base de dados para refletir com exatidão os **47 tópicos oficiais** do edital (removidos os tópicos residuais 11 e 12 em Matemática).
- `prisma/seed.ts` e script `prisma:seed` atualizados com limpeza automática de tópicos obsoletos e compatibilidade com Node 24.
- Criado script de reconciliação e auditoria (`scripts/reconcile-topics.js` e `scripts/check-db.js`).

### Testes e Qualidade
- Suíte automatizada com 19 testes unitários e de integração nativos (`exam.test.ts`, `srs.test.ts`, `streak.test.ts`, `rag.test.ts`, `taxonomy.test.ts`) integrada via `npm test`.
- Refatorado `src/lib/streak.ts` com a função pura `calculateStreakProgress`.
- Smoke test automatizado (`scripts/smoke-test.js`) validando 100% das 9 rotas principais e páginas dinâmicas com HTTP 200 OK.
- Build de produção Next.js e verificação de tipos TypeScript (`tsc --noEmit`) 100% aprovados.

## [0.1.18] - 2026-09-16

### Dashboard e métricas
- Contagem regressiva da prova passou a considerar apenas a data oficial `06/12/2026`, sem inventar horário de início da prova.
- Domínio Global passou a considerar todos os tópicos do edital, atribuindo 0% aos tópicos ainda sem progresso, evitando uma média artificialmente alta baseada somente nos assuntos já estudados.
- O mesmo critério foi aplicado ao domínio exibido por disciplina.

### Progresso e sequência
- Feedback cognitivo das aulas passou a atualizar a sequência diária pelo mesmo motor usado em questões, flashcards e simulados.
- Mantida a proteção contra reenvios imediatos para evitar duplicação de XP, tempo e progresso.

### Geração de conteúdo
- Geração de aulas passou a revalidar dentro da transação se outro processo já salvou uma aula recente do mesmo tópico, reduzindo duplicações em chamadas concorrentes.
- Flashcards e questões de fixação continuam com validação estrutural antes da persistência.

### Qualidade
- CI de produção validado no GitHub Actions após as alterações de documentação anteriores.

## [0.1.17] - 2026-09-16

### Banco de questões
- Baterias de treino passaram a informar claramente quando o filtro solicitado possui menos questões disponíveis do que o tamanho pedido.
- Filtros sem questões passaram a apresentar uma mensagem específica, evitando que a tela pareça ter iniciado uma bateria vazia.
- Mantida a regra de não inventar questões oficiais para completar artificialmente uma bateria.

### Qualidade e CI
- CI de produção validado no GitHub Actions para o commit de integração do gstack: Prisma Generate, TypeScript e build de produção concluídos com sucesso.
- Roadmap atualizado para refletir que o build de produção já faz parte da validação contínua.

## [0.1.16] - 2026-09-16

### Ferramentas e Metodologia de Desenvolvimento (gstack)
- Integração da software factory **gstack** em modo equipe (`team-mode`), com runtime Bun, Playwright headless browser e registro de hooks em `.claude/hooks/check-gstack.sh`.
- Padronização do fluxo com skills especializadas de planejamento, qualidade, diagnóstico e liberação.

### RAG e Legislação Oficial
- Integração completa da Ênfase 18 (`documents/edital/enfase-18.md`) às fontes validadas do RAG (`src/lib/rag-sources.ts`).
- Transcrição integral oficial do Decreto nº 2.745/1998 e da Lei nº 13.303/2016 integradas e validadas na base legislativa local.
- Arts. 42 a 49 da Lei Complementar nº 123/2006 integrados e sincronizados.
- Critério de pontuação do RAG (`src/lib/rag.ts`) ajustado para exigir correspondência estrita de termos quando a busca não contém aliases diretos, eliminando falsos positivos em buscas por palavras avulsas.

## [0.1.15] - 2026-09-16

### Treino e desempenho
- Baterias por tópico ou disciplina passaram a embaralhar o banco disponível antes de selecionar as questões, reduzindo repetição da mesma ordem entre sessões.
- Bateria mista mantém aproximadamente 1/3 de Conhecimentos Gerais e 2/3 de Conhecimentos Específicos, com os blocos intercalados.
- Painel de desempenho passou a exibir a quantidade de erros por disciplina.
- Tópicos abaixo de 70% passaram a mostrar também o número de erros e questões respondidas quando houver dados.

### Progressão de estudo
- Criado motor de sequência diária de estudos (`src/lib/streak.ts`) usando o fuso `America/Sao_Paulo`.
- Respostas de questões, revisões de flashcards e conclusão de simulados atualizam a sequência sem contar duas vezes o mesmo dia.
- Dashboard passou a exibir a sequência atual de dias de estudo.

### Qualidade de código
- GitHub Actions passou a executar também o build de produção, além de gerar o Prisma Client e executar o typecheck.

## [0.1.14] - 2026-09-15

### Treino e transparência
- Modo "Treinar Meus Erros" passou a priorizar questões que o estudante realmente errou, usando tópicos de menor domínio apenas quando ainda não existem erros registrados.
- A tela de questões passou a diferenciar explicitamente questões oficiais de questões inéditas geradas por IA.
- A dificuldade da questão passou a ficar visível durante o treino.
- O texto da área de questões deixou de sugerir que todo o banco é composto por questões oficiais da Cesgranrio.

### Robustez
- Diagnóstico do simulado normaliza acertos e meta dentro dos limites válidos antes dos cálculos.
- Cronômetro de cada bateria de treino é reiniciado ao avançar para a próxima questão, evitando acumular o tempo da sessão inteira em uma única resposta.

## [0.1.13] - 2026-09-15

### Corrigido
- Diagnóstico do simulado passou a limitar e normalizar os acertos recebidos antes de calcular a pontuação.
- Feedback cognitivo da aula passou a proteger reenvios imediatos contra duplicação de XP e tempo de estudo.
- Submissões idênticas do simulado passaram a ser reconhecidas em uma janela curta, evitando duplicação de tentativas, sessão e XP.
- Flashcards deixaram de limitar o cálculo de vencimentos aos 100 cards mais recentes.
- Avaliações duplicadas de flashcards em janela curta não geram XP ou uma nova revisão.
- Backup completo passou a utilizar as relações existentes no schema Prisma para progresso, tentativas, simulados, revisões, sessões e conversas.

### Transparência e qualidade
- Questões inéditas continuam identificadas como geradas por IA e não são apresentadas como questões aplicadas pela Cesgranrio.
- Fontes legislativas classificadas como `pointer` continuam explicitamente tratadas como referências de escopo, não como transcrições integrais validadas.

## [0.1.12] - 2026-09-12

### Corrigido
- API do simulado passou a validar os tempos individuais recebidos para cada questão antes de persistir as tentativas.
- Seleção aleatória do simulado e das baterias usa Fisher-Yates.
- Treino de erros passou a priorizar questões que o estudante realmente errou, usando os tópicos dessas tentativas para completar a bateria quando necessário.
- Bateria por dificuldade deixou de misturar questões de outra dificuldade quando o banco ainda não possui quantidade suficiente da dificuldade solicitada.

### Qualidade
- Adicionado script `typecheck` com TypeScript.
- Adicionado GitHub Actions para executar `prisma generate` e `typecheck` em pushes e pull requests para `main`.

## [0.1.11] - 2026-09-13

### Corrigido
- Simulado passou a registrar o tempo real gasto em cada questão, em vez de distribuir artificialmente o tempo total entre os 60 itens.
- Bateria de questões passou a usar embaralhamento Fisher-Yates para seleção mais uniforme.
- Dificuldade solicitada passou a ser normalizada e validada entre `FACIL`, `MEDIA` e `DIFICIL`.
- Questões inéditas geradas por IA passaram a ser rejeitadas quando repetem o enunciado de uma questão existente ou de outra questão do mesmo lote.
- Geração de questões passou a exigir dificuldade válida antes da persistência.

### Transparência
- Questões geradas por IA continuam identificadas como inéditas e não são apresentadas como questões oficiais da Cesgranrio.

## [0.1.10] - 2026-09-12

### Corrigido
- Simulado passou a embaralhar os bancos de Português, Matemática e Específicas antes de selecionar 10/10/40 questões.
- Geração de questões por IA passou a validar estrutura mínima antes da persistência e distribuir novas questões entre os tópicos selecionados.
- SRS passou a diferenciar explicitamente o estado `EM_REVISAO` quando o estudante marca um tópico como `REVISAR`.

### Documentação
- SRS documentado como motor adaptativo por feedback e intervalos progressivos, sem classificá-lo como SM-2.
- Simulado permanece descrito como reprodução da estrutura do edital, não como prova oficial da Cesgranrio.

## [0.1.9] - 2026-09-12

### Corrigido
- Critérios do diagnóstico do simulado alinhados à separação entre Conhecimentos Gerais e Específicos, sem inventar um critério adicional de 50% da prova total.
- API do simulado passou a exigir exatamente 60 IDs de questões e validar a distribuição 10 Português, 10 Matemática e 40 Específicas antes de registrar o resultado.
- Simulado passou a registrar tentativa também para questões não respondidas, computando-as como erro, e atualizar o progresso por tópico.
- Respostas individuais passaram a validar alternativa A-E e tempo de resolução.
- Conversas do Professor IA passaram a ser carregadas somente quando pertencem ao usuário corrente.
- Flashcards passaram a respeitar a data da próxima revisão na tela de estudo.
- Avaliações de flashcards passaram a validar card e classificação antes de persistir.
- O banco deixou de sugerir a banca Cesgranrio como padrão para questões criadas por caminhos que não informem a origem.

### Observação
- O simulado reproduz a estrutura oficial, mas questões geradas por IA continuam sendo inéditas e não devem ser apresentadas como questões aplicadas pela Cesgranrio.
- As fontes legislativas ainda marcadas como `pointer` não são transcrições integrais validadas.

## [0.1.8] - 2026-09-12

### Adicionado
- Registro de fontes do RAG em `src/lib/rag-sources.ts`.
- Entradas oficiais em ponteiro para Lei nº 13.303/2016 e Decreto nº 2.745/1998.

### Alterado
- RAG prioriza fontes pelo assunto, disciplina e base oficial do tópico.
- Contexto enviado ao Gemini possui limite global de tamanho.
- Conteúdo Markdown é reutilizado em memória enquanto os arquivos não forem modificados.
- Professor IA e geradores distinguem fonte validada de ponteiro.
- Questões inéditas recebem origem explícita de IA.

## [0.1.7] - 2026-09-12

### Adicionado
- RAG local de fontes oficiais e grounding do Professor IA.
- Registro oficial da Lei nº 14.133/2021 como fonte ainda não validada integralmente.

## [0.1.6] - 2026-09-12

### Adicionado
- Arts. 42 a 49 da Lei Complementar nº 123/2006 em `documents/legislacao/lei-123-2006.md`.

## [0.1.2] - 2026-09-11

### Adicionado
- Edital original e retificações oficiais na base RAG.

## [0.1.1] - 2026-09-11

### Alterado
- Data da prova atualizada para **06/12/2026**.

## [0.1.0] - 2026-09-11

### Adicionado
- Arquitetura Next.js, PostgreSQL, Prisma, taxonomia oficial do edital, Dashboard, Edital Verticalizado, aulas IA, banco de questões, simulado de 60 questões, SRS, Professor IA, desempenho, configurações e documentação técnica.
