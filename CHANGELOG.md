# CHANGELOG - TRANSPETRO STUDY 2026.3

Todas as alterações notáveis deste projeto são registradas neste documento.

## [0.1.16] - 2026-09-16

### Ferramentas e Metodologia de Desenvolvimento (gstack)
- Integração da software factory **gstack** (Garry Tan / Y Combinator) em modo equipe (`team-mode`), com instalação do runtime Bun, Playwright headless browser e registro de hooks em `.claude/hooks/check-gstack.sh`.
- Padronização do fluxo com skills especializadas de planejamento (`/office-hours`, `/plan-eng-review`), qualidade e revisão (`/review`, `/qa`), diagnóstico (`/investigate`) e liberação (`/ship`).

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
