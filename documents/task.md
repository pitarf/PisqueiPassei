# ROADMAP DE TAREFAS - TRANSPETRO STUDY 2026.3

## 📋 Status do Projeto

- **Fase Atual:** Fase 1, produto funcional + hardening + conteúdo orientado por fontes oficiais
- **Alvo:** Concurso TRANSPETRO 2026.3 - Nível Técnico - Ênfase 18: Suprimento de Bens e Serviços
- **Banca:** Fundação Cesgranrio
- **Data da Prova:** 06/12/2026
- **Meta pessoal inicial:** 47/60 pontos (78,3%). Não é critério oficial de eliminação.

---

## 📌 Pendentes por dependência externa ou expansão de produto

- [ ] Validar transcrição integral da Lei nº 14.133/2021 necessária ao escopo do edital
- [ ] Ingestão automatizada e versionada das fontes normativas oficiais
- [ ] Banco de questões reais Cesgranrio com fonte/ano/prova individualizados
- [ ] Módulo de upload de apostilas e PDFs de terceiros com OCR e indexador RAG
- [ ] Autenticação social com Google OAuth e multi-tenancy para comercialização pública
- [ ] Modo Ranking e comunidade de estudos
- [ ] Aplicativo móvel compilado nativo (PWA já ativo)

## ⏳ Em evolução

- [x] Hardening e histórico estrito de erros do motor adaptativo (`evaluateQuestionHistory` com status PENDENTE, REVISAO_DEVIDA, EM_CONSOLIDACAO e CONSOLIDADA)
- [x] Seleção determinística pseudoaleatória com PRNG Mulberry32 (`createSeededRng`, `seededShuffle`) e desempate por hash
- [x] Alinhamento da cadência SRS de repetição espaçada (1, 3, 7, 14, 30 dias)
- [x] Banner pré-sessão e tela pós-treino com breakdown por dificuldade, nível cognitivo, tópico, lista de revisão e próximo passo
- [x] Distinção estrita no dashboard entre Questões Únicas Vistas e Total de Tentativas
- [x] Expansão da suíte unitária do motor adaptativo para 19 testes (totalizando 87/87 testes unitários Bun aprovados)
- [x] Motor adaptativo de estudo inteligente sobre o acervo mestre de 940 questões ativas (`src/lib/adaptive-engine.ts`)
- [x] Diagnóstico granular de domínio bayesiano por tópico com amortecimento empírico ($\frac{C + 4}{N + 8}$) eliminando distorção de amostras pequenas
- [x] Sessão "ESTUDAR AGORA" (10 questões adaptativas) com seleção automática de tópicos prioritários e calibração de dificuldade
- [x] Fila de revisão de erros com repetição espaçada (SRS) progressiva (1 -> 3 -> 7 -> 14 -> 30 dias) e proteção contra remoção por sorte
- [x] Enriquecimento do diagnóstico pós-simulado Cesgranrio: gráficos por dificuldade, nível cognitivo, não respondidas e plano "Seu próximo estudo" com cartões acionáveis
- [x] Suíte de testes unitários do motor adaptativo (`src/lib/adaptive-engine.test.ts`, 6/6 testes, totalizando 74/74 testes)
- [x] Integração da API `/api/study/adaptive` e desacoplamento de chamadas de geração em tempo real (operação 100% sobre as 940 questões)
- [x] Expansão mestre do banco de questões ativas de 470 para 940 questões ativas (exatamente 20 questões em cada um dos 47 tópicos oficiais)
- [x] Cobertura de 100% dos tópicos da Ênfase 18 no nível de excelência BOA (20+ questões por tópico)
- [x] Equilíbrio cirúrgico de gabarito A-E global (A: 20,5%, B: 20,9%, C: 20,0%, D: 20,3%, E: 18,3%) e nas 6 disciplinas
- [x] Validação jurídica automatizada com bloqueio de artigos inexistentes e catálogo de leis reais
- [x] Validação técnica de planilhas eletrônicas com catálogo oficial de fórmulas do Excel PT-BR e Office 365
- [x] Curadoria do acervo de 470 itens: reescrita integral de 62 questões legadas de seed (40 em Administração, 10 em Português, 10 em Matemática)
- [x] Reequilíbrio homogêneo de gabarito em Noções de Administração (A: 24%, B: 28%, C: 14%, D: 22%, E: 12%)
- [x] Erradicação de 100% dos boilerplates e prefixos de seed no banco pedagógico ativo
- [x] Resolução e classificação dos 149 pares de similaridade semântica (redução de 91,3% para 13 pares legítimos)
- [x] Enriquecimento de 100% dos metadados pedagógicos (questionType e cognitiveLevel)
- [x] Calibração do motor de QA Risk Score para penalizar metadados faltantes, boilerplates e duplicidades
- [x] Auditoria de qualidade real e semântica das 470 questões cadastradas (100% dos 47 tópicos auditados)
- [x] Motor determinístico de detecção de duplicidades semânticas (Sørensen-Dice / Jaccard / bigramas sem stopwords)
- [x] Verificação estrita de legislação e artigos oficiais (`documents/legislacao/`, Lei 13.303, 14.133, 2.745, LC 123, LGPD e CF/88)
- [x] Catálogo e validação de funções legítimas do Microsoft Excel em Português Brasil (PT-BR) e recursos do Office 365
- [x] Auditoria de consistência matemática e cálculo determinístico para 100% dos itens da disciplina
- [x] Avaliação de distratores (termos categóricos/denunciadores, caricatos e sinônimos internos) com QA Risk Score
- [x] Unificação do motor RAG no gerador de questões (`scripts/generate-question-bank.js`) com o RAG oficial (`src/lib/rag.ts`)
- [x] Suíte unitária `pedagogical-audit.test.ts` (10/10 testes passando, totalizando 65/65 testes Bun)
- [x] Abastecimento integral do banco pedagógico com 470 questões inéditas (100% dos 47 tópicos com >= 10 questões)
- [x] Script automatizado de suprimento incremental por disciplina e tópico (`npm run generate:questions`)
- [x] Auditoria de qualidade pedagógica e cobertura dos 47 tópicos oficiais (`npm run audit:quality`)
- [x] Blindagem estrita contra alucinação e falsa atribuição de banca nas questões geradas por IA
- [x] Calibração de regras pedagógicas nos 5 modos de questões irmãs (`siblings`)
- [x] Algoritmo estratificado de dispersão temática no simulado Cesgranrio
- [x] Motor adaptativo com priorização por proficiência (<50% fácil, >80% difícil)
- [x] Registro de fontes normativas oficiais e status de validação
- [x] Estruturação oficial da Ênfase 18 no RAG
- [x] Mapa pedagógico alinhado aos 47 tópicos do programa oficial
- [x] RAG com prioridade por fonte e assunto
- [x] Limite de contexto enviado à IA para reduzir ruído e custo
- [x] Cache em memória dos arquivos Markdown do RAG
- [x] Proveniência explícita para questões inéditas geradas por IA
- [x] Auditoria das regras do simulado, respostas, progresso e SRS
- [x] Pipeline CI com Prisma Generate + TypeScript + build de produção
- [x] Suíte automatizada de testes para RAG, regras de prova e SRS
- [x] Integração da Software Factory gstack em modo equipe com hook de verificação e browser headless
- [x] Idempotência por chave para respostas individuais e simulados
- [x] Migração Prisma preparada para as chaves de idempotência
- [x] Comando de deploy de migrações Prisma
- [x] Diagnóstico de disponibilidade do simulado com distribuição 10/10/40
- [x] Formalização do documento de execução mestre com subagentes em documents/fases/EXECUCAO-MESTRE-SUBAGENTES.md
- [x] Reconciliação do banco de dados para exatamente 47 tópicos oficiais (remoção dos tópicos residuais 11 e 12 em Matemática)
- [x] Seed idempotente com autocura e remoção automática de tópicos obsoletos
- [x] Suíte automatizada com 28 testes nativos (Simulado, limites oficiais, SRS, Streak, RAG e Taxonomia 47) rodando via npm test
- [x] Smoke test aprovado com 200 OK em 100% das rotas e páginas dinâmicas da aplicação
- [x] Varredura completa de UI copy e tom com o Humanizer em 100% das telas da plataforma
- [x] Validador estrutural e proveniência de questões inéditas geradas por IA (`question-validator.ts`)
- [x] Auto-suprimento resiliente de estoque para o Simulado Cesgranrio (60 questões com retry controlado)
- [x] Teste de concorrência e idempotência com transação ACID e constraint P2002 aprovado
- [x] Suíte E2E automatizada com Playwright (Desktop e Mobile Chrome) 100% verde (22 testes cobrindo 11 fluxos essenciais)
- [x] Auditoria profunda do banco de dados com script `db:check` e bloqueio com `exit code 1` se houver anomalias
- [x] Unificação e desacoplamento do carregador de simulado em `src/lib/simulation.ts` com aviso transparente de déficit
- [x] Integração de catálogo e padrões de provas históricas (`/questoes/historico`) e geração de questões irmãs (`/api/questions/siblings`)
- [x] Migration Prisma versionada (`20260930_add_statement_hash_unique`) com resolução determinística de duplicidades e remapeamento relacional
- [x] Endurecimento estrutural contra duplicidade de enunciados (`statementHash` + `@@unique([topicId, statementHash])`)
- [x] Tratamento gracioso de concorrência P2002 no auto-refill, rotas em lote e questões irmãs
- [x] Testes de concorrência com colisão P2002 e idempotência sob múltiplas requisições paralelas simultâneas
- [x] Teste de integração de `loadExamQuestions` garantindo 60 questões (10/10/40), 60 IDs únicos e 0 déficits
- [x] Script de seed determinístico e desacoplado de APIs externas para CI e testes E2E (`scripts/seed-ci-e2e.ts`)
- [x] Pipeline de CI real no GitHub Actions com PostgreSQL 16 em container de serviço, fail-fast, typecheck, testes unitários, build e Playwright E2E

## 🛠️ Próxima frente de hardening

- [ ] Validar transcrição integral da Lei nº 14.133/2021 necessária ao escopo do edital
- [ ] Ingestão automatizada e versionada das fontes normativas oficiais
- [ ] Revisar UX de cronômetro, saída e recuperação de sessão em baterias e simulados

## ✅ Concluído na Fase 1

- [x] Análise do edital oficial e requisitos do usuário
- [x] Arquitetura Next.js, TypeScript, Tailwind, PostgreSQL e Prisma
- [x] Docker Compose com PostgreSQL e volume persistente
- [x] Taxonomia oficial: 6 disciplinas e 47 tópicos
- [x] Dashboard com contador para 06/12/2026, meta pessoal 47/60, ações rápidas e pontos fracos
- [x] Edital Verticalizado com domínio, status e badges normativos
- [x] Aulas IA estruturadas em 9 etapas com cache em banco
- [x] Gerador de questões e treino de pontos fracos
- [x] Simulado estruturado em 60 questões, 10 Português, 10 Matemática e 40 Específicas, com cronômetro de 4 horas
- [x] Validação no servidor da distribuição do simulado e dos 60 IDs antes do resultado
- [x] Diagnóstico com os critérios de eliminação previstos e separação da meta pessoal
- [x] Registro das tentativas do simulado, inclusive não respondidas, e atualização do progresso por tópico
- [x] Respostas individuais com validação de alternativa e tempo
- [x] Tempo individual das questões do simulado enviado e validado no servidor
- [x] Flashcards com agenda de revisão por vencimento e avaliações Fácil/Médio/Difícil
- [x] Professor IA contextualizado com histórico, notas e pontos fracos
- [x] Proteção da conversa do Professor IA contra acesso por ID de outro usuário
- [x] Dashboard de desempenho e estatísticas
- [x] Configurações com metas, horas diárias e backup JSON
- [x] Edital e retificações oficiais no RAG
- [x] Conteúdo pedagógico organizado por disciplina para alimentar aulas e Professor IA

## ⚠️ Limitações importantes

- O banco atual trabalha com questões inéditas geradas por IA. Elas devem permanecer identificadas como IA, mesmo quando seguem o perfil Cesgranrio.
- O simulado reproduz a estrutura e os critérios do edital, mas não representa uma prova oficial aplicada pela Cesgranrio.
- A autenticação ainda é de usuário único de desenvolvimento, portanto o MVP não está pronto para comercialização multiusuário.
- A Lei 14.133/2021 está cadastrada como ponteiro de fonte oficial e ainda precisa de transcrição/ingestão validada para sustentar detalhes jurídicos no RAG.
- A migração de idempotência precisa ser aplicada ao banco de produção antes de usar as novas chaves; o código continua aceitando submissões legadas sem chave.
