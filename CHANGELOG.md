# CHANGELOG - TRANSPETRO STUDY 2026.3

Todas as alterações notáveis deste projeto são registradas neste documento.

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
