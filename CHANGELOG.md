# CHANGELOG - TRANSPETRO STUDY 2026.3

Todas as alterações notáveis deste projeto são registradas neste documento.

## [0.1.7] - 2026-09-12

### Adicionado
- **RAG local de fontes oficiais:** novo `src/lib/rag.ts` para localizar documentos Markdown do edital e legislação por relevância textual e fornecer trechos controlados ao modelo.
- **Grounding do Professor IA:** aulas, baterias de questões e conversas agora recebem contexto recuperado da biblioteca local antes da geração.
- **Fonte da Lei nº 14.133/2021:** registro oficial em `documents/legislacao/lei-14133-2021.md`, explicitamente marcado como fonte ainda não validada como transcrição integral.

### Segurança de conteúdo
- O Professor IA foi reforçado para não tratar texto gerado por IA como citação oficial de lei.
- Questões inéditas continuam separadas das questões reais da Cesgranrio.
- Quando o RAG não sustentar uma afirmação normativa, o modelo deve declarar a limitação em vez de inventar fundamento.

## [0.1.6] - 2026-09-12

### Adicionado
- **Base Legislativa Oficial para RAG:** inclusão dos arts. 42 a 49 da Lei Complementar nº 123/2006 em `documents/legislacao/lei-123-2006.md`.

## [0.1.2] - 2026-09-11

### Adicionado
- **Documentação Oficial de Editais:** edital original e retificações oficiais na base RAG.

## [0.1.1] - 2026-09-11

### Alterado
- Data da prova atualizada para **06/12/2026**.

## [0.1.0] - 2026-09-11

### Adicionado
- Arquitetura Next.js, PostgreSQL, Prisma, taxonomia oficial do edital, Dashboard, Edital Verticalizado, aulas IA, banco de questões, simulado de 60 questões, SRS, Professor IA, desempenho, configurações e documentação técnica.
