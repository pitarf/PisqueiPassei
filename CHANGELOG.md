# CHANGELOG - TRANSPETRO STUDY 2026.3

Todas as alterações notáveis deste projeto são registradas neste documento.

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
