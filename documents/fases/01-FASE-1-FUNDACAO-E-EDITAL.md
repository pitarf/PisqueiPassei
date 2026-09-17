# Fase 1, Fundação e fidelidade ao edital

## Objetivo
Garantir que o sistema tenha uma base confiável antes de ampliar funcionalidades: edital, retificações, taxonomia, banco, RAG, fontes jurídicas e geração de conteúdo.

## Implementado
- [x] Edital 2026.3 armazenado no projeto.
- [x] Retificações armazenadas no projeto.
- [x] Ênfase 18 documentada.
- [x] Taxonomia oficial organizada por disciplina.
- [x] RAG local com classificação das fontes.
- [x] Prioridade para edital e retificações.
- [x] Fontes normativas identificadas.
- [x] Regras de segurança editorial no Professor IA.
- [x] Validação estrutural de aulas.
- [x] Validação estrutural de questões.
- [x] Deduplicação básica de conteúdo gerado.

## Pendente
- [ ] Executar reconciliação do banco existente.
- [ ] Confirmar exatamente 47 tópicos oficiais após a reconciliação.
- [ ] Remover/arquivar eventuais tópicos antigos que não pertençam à taxonomia atual.
- [ ] Conferir todas as referências jurídicas críticas.
- [ ] Confirmar que o RAG encontra a fonte correta para cada tópico jurídico.
- [ ] Confirmar que o RAG não trata ponteiro como transcrição normativa.
- [ ] Testar geração para todos os tipos de disciplina.

## Checklist de teste
### Banco
- [ ] Seed em banco vazio.
- [ ] Seed repetido.
- [ ] Contagem de disciplinas.
- [ ] Contagem de tópicos.
- [ ] Códigos únicos por disciplina.
- [ ] Progresso inicial em todos os tópicos.

### RAG
- [ ] Português.
- [ ] Matemática.
- [ ] Administração e Logística.
- [ ] Logística e Cadeia de Suprimentos.
- [ ] Decreto 2.745/1998.
- [ ] Lei 13.303/2016.
- [ ] LC 123/2006.
- [ ] Lei 14.133/2021.
- [ ] Regulamento Transpetro.
- [ ] LGPD.

### IA
- [ ] Aula retorna JSON válido.
- [ ] Aula contém as 9 etapas esperadas.
- [ ] Flashcards têm frente e verso.
- [ ] Questões têm A-E.
- [ ] Questões têm gabarito.
- [ ] Questões têm explicação.
- [ ] Questões IA não são rotuladas como questões reais da Cesgranrio.
- [ ] Conteúdo jurídico não é inventado quando a fonte não sustenta a afirmação.

### Build
- [ ] `npm run typecheck`.
- [ ] `npm run build`.
- [ ] CI.

## Evidência para encerramento
A fase fica concluída somente após registrar a contagem final da taxonomia, resultado do seed, resultado do RAG e resultado dos testes de build/CI.
