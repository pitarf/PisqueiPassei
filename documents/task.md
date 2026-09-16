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

## 🛠️ Próxima frente de hardening

- [ ] Validar transcrição integral da Lei nº 14.133/2021 necessária ao escopo do edital
- [ ] Ingestão automatizada e versionada das fontes normativas oficiais
- [ ] Revisar UX de cronômetro, saída e recuperação de sessão em baterias e simulados
- [ ] Revisar desempenho das consultas de desempenho, flashcards e banco de questões
- [ ] Adicionar testes de integração com banco PostgreSQL real

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
