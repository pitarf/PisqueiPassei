# ROADMAP DE TAREFAS - TRANSPETRO STUDY 2026.3

## 📋 Status do Projeto

- **Fase Atual:** MVP Concluído & Validado
- **Alvo:** Concurso TRANSPETRO 2026.3 - Nível Técnico - Ênfase 18: Suprimento de Bens e Serviços
- **Banca:** Fundação Cesgranrio
- **Data Prevista da Prova:** 06/12/2026
- **Meta Inicial:** 47/60 pontos (78,3%)

---

## 📌 Pendentes (Versões Futuras / Fase 2)

- [ ] Autenticação social com Google OAuth e multi-tenancy para comercialização pública
- [ ] Módulo de upload de apostilas e PDFs de terceiros com OCR e indexador de chunks RAG
- [ ] Modo Ranking e comunidade de estudos
- [ ] Aplicativo móvel compilado nativo (PWA já ativo)

---

## ⏳ Fazendo

- [x] Testes de build de produção e verificação de integridade

---

## ✅ Concluído

- [x] Análise aprofundada do edital oficial e requisitos do usuário
- [x] Criação do plano de arquitetura e implementação (`implementation_plan.md`)
- [x] Inicialização do projeto Next.js 15 com TypeScript e Tailwind CSS
- [x] Configuração do Docker Compose com PostgreSQL e volumes persistentes (`postgres-data`)
- [x] Modelagem do Prisma ORM (`schema.prisma`) com transações seguras
- [x] Execução de sincronização do banco de dados relacional PostgreSQL
- [x] Script de Seed com 100% da taxonomia oficial do edital (6 matérias, 49 tópicos) e usuário Rafael
- [x] Componentes de Layout Mobile-First (AppHeader, BottomNav, SidebarNav)
- [x] Dashboard Principal (Contador de dias para 29/11/2026, meta 47/60, ações rápidas, pontos fracos)
- [x] Edital Verticalizado com níveis de domínio (0 a 100%), status e badges normativos
- [x] Motor de Aulas por IA estruturada em 9 passos com cache em banco de dados para custo zero
- [x] Gerador de Questões (10, 20, 40, 60) e Treino de Pontos Fracos (aproveitamento < 70%)
- [x] Simulado Oficial Cesgranrio (60 questões com cronômetro de 4h, grade de respostas e diagnóstico de eliminação)
- [x] Sistema de Flashcards e Motor de Repetição Espaçada (SRS - SM-2 adaptativo)
- [x] Professor IA contextualizado com histórico, notas e pontos fracos do Rafael
- [x] Dashboard de Desempenho e Estatísticas por disciplina
- [x] Painel de Configurações para alteração de metas, horas diárias e exportação de backup JSON
- [x] Compilação estática e validação com `npm run build` (0 erros)
- [x] Elaboração dos Manuais: `MANUAL_DEV.md`, `MANUAL_USER.md`, `CHANGELOG.md`
- [x] Criação do acervo oficial do edital (`documents/edital/edital-2026.3.md` e `documents/edital/retificacao-edital-2026.3.md`) para RAG
