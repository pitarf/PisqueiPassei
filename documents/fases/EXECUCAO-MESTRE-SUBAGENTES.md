# TRANSPETRO STUDY 2026.3
## Diretrizes de Execução Mestre com Subagentes

**Repositório:** `pitarf/PisqueiPassei`  
**Concurso:** TRANSPETRO / PSP / TERRA / Nível Médio - 2026.3  
**Ênfase:** 18 - Suprimento de Bens e Serviços  
**Data Oficial da Prova:** 06/12/2026  
**Documentos de Referência:** Diretório `documents/fases/`

---

## 🎯 Objetivo

Continuar a execução completa do projeto até deixá-lo pronto para uso real, seguindo os documentos de fases existentes no diretório `documents/fases/`:

- `00-PLANO-GERAL-FASES.md`
- `01-FASE-1-FUNDACAO-E-EDITAL.md`
- `02-FASE-2-MOTOR-DE-ESTUDO.md`
- `03-FASE-3-SIMULADO-E-DIAGNOSTICO.md`
- `04-FASE-4-PROFESSOR-IA.md`
- `05-FASE-5-DESEMPENHO-E-PLANEJAMENTO.md`
- `06-FASE-6-SEGURANCA-E-INTEGRIDADE.md`
- `07-FASE-7-UX-E-ACABAMENTO.md`
- `08-FASE-8-QA-FINAL-E-PUBLICACAO.md`

> [!IMPORTANT]
> **Foco na Execução:** Não produzir apenas análises ou listas de tarefas. Implementar, corrigir, testar e validar o máximo possível de forma autônoma e contínua, sem interrupções desnecessárias a cada etapa.

---

## 👥 1. Estratégia de Subagentes Especializados

Utilizar subagentes especializados com permissão explícita para alteração real de código, executando tarefas independentes em paralelo:

### SUBAGENTE 1: Fase 1 – Fundação e Edital
- Conferir a estrutura do projeto e arquitetura de pastas.
- Conferir schemas do Prisma e migrations aplicadas.
- Conferir e auditar `prisma/seed.ts`.
- Conferir disciplinas e garantir os **47 tópicos oficiais**.
- Conferir edital original e retificações oficiais.
- Conferir a data oficial da prova (**06/12/2026**).
- Corrigir qualquer divergência entre banco, seed, documentos e interface.
- Validar fontes oficiais do RAG.

### SUBAGENTE 2: Fase 2 – Motor de Estudo
- Fluxo didático e completo de Aulas.
- Sessões e filtros de Questões.
- Flashcards e algoritmo adaptativo de repetição espaçada (SRS).
- Progresso e cálculo de domínio por tópico.
- Geração de conteúdo por IA e validação rigorosa de payloads JSON.
- Prevenção de duplicidade em submissões.
- Histórico de erros e modo "Treinar Meus Erros".
- Cálculo e consistência de XP e sequência diária (Streak).
- Garantir coerência entre frontend, rotas de API e banco de dados.

### SUBAGENTE 3: Fase 3 – Simulado e Diagnóstico
- Simulado oficial com **60 questões** (40 específicas, 10 Português, 10 Matemática).
- Duração e cronômetro estrito de **4 horas**.
- Aplicação das regras oficiais de eliminação da banca Cesgranrio:
  - Elimina se nota de Português for zero.
  - Elimina se nota de Matemática for zero.
  - Elimina se total de Conhecimentos Básicos < 50% (10/20).
  - Elimina se total de Conhecimentos Específicos < 50% (20/40).
- Meta pessoal de estudo (**47/60** pontos) tratada como meta pedagógica, e não como critério oficial de aprovação.
- Diagnóstico detalhado de desempenho e cobertura.
- Distribuição e validação dos 60 IDs no servidor.
- Cronometragem individual por questão.
- Persistência e prevenção de submissões duplicadas (idempotência).

### SUBAGENTE 4: Fase 4 – Professor IA
- Assistente tutor interativo contextualizado com o aluno.
- Grounding via RAG nas fontes oficiais do projeto.
- Integração com histórico de erros, flashcards e dúvidas.
- Proteção ativa contra alucinações jurídicas.
- Diferenciação inequívoca entre fontes oficiais validadas e referências complementares.
- **Regra inegociável:** Jamais apresentar questões geradas por IA como questões reais aplicadas pela Cesgranrio.

### SUBAGENTE 5: Fase 5 – Desempenho e Planejamento
- Dashboard com indicadores consolidados e consistentes.
- Painel de desempenho com separação de acertos e erros por disciplina e tópico.
- Mapeamento dinâmico de pontos fracos e tópicos críticos (< 70%).
- Planejamento de metas e horas diárias de estudo.
- Monitoramento de Streak (fuso `America/Sao_Paulo`).
- Garantir que tópicos nunca estudados permaneçam como `NAO_INICIADO` (nunca como dominados).

### SUBAGENTE 6: Fase 6 – Segurança e Integridade
- Proteção e autorização em todas as rotas de API.
- Validação estrita de payloads recebidos.
- Integridade transacional via `prisma.$transaction`.
- Proteção de segredos e chaves de API exclusivamente no backend.
- Concorrência, bloqueio de cliques múltiplos e chaves de idempotência (`idempotencyKey`).
- Isolamento de histórico do Professor IA por usuário.
- Exportação segura de backup completo (`/api/backup`).
- Proteção de endpoints e remoção de vazamento de dados.

### SUBAGENTE 7: Fase 7 – UX e Acabamento
- Interface moderna, limpa e padronizada com Tailwind CSS.
- Design **Mobile-First** e responsividade rigorosa.
- Tratamento de estados vazios (empty states), loading e esqueletos visuais.
- Mensagens de erro e feedback específicos (não-genéricos).
- Notificações visuais modernas via toast (Sonner).
- Acessibilidade semântica e correção de falhas visuais via navegador.

### SUBAGENTE 8: Fase 8 – QA Final e Publicação
- Suíte completa de testes automatizados.
- Build de produção (`next build`) sem erros.
- Verificação de tipos (`tsc --noEmit`).
- Linting do código.
- Testes automatizados das APIs e integridade do banco.
- Testes ponta a ponta dos fluxos críticos via navegador headless.
- Atualização completa de manuais e changelog.
- Checklist final de publicação.

---

## 🔍 2. Primeiro Passo Obrigatório

Antes de qualquer alteração de código:

1. Ler integralmente todos os documentos de `documents/fases/`.
2. Ler e confrontar:
   - `README.md`
   - `CHANGELOG.md`
   - `MANUAL_DEV.md`
   - `MANUAL_USER.md`
   - `documents/task.md`
   - `walkthrough.md`
3. Inspecionar o **estado real atual** do repositório (não assumir que documentos estão 100% atualizados).
4. Confrontar matriz: `Documentação x Código x Banco x Seed x Interface`.
5. Consolidar internamente a matriz de acompanhamento:

| FASE | IMPLEMENTADO | PARCIAL | PENDENTE | TESTADO | VALIDADO |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Fase 1 - Fundação e Edital | [ ] | [ ] | [ ] | [ ] | [ ] |
| Fase 2 - Motor de Estudo | [ ] | [ ] | [ ] | [ ] | [ ] |
| Fase 3 - Simulado e Diagnóstico | [ ] | [ ] | [ ] | [ ] | [ ] |
| Fase 4 - Professor IA | [ ] | [ ] | [ ] | [ ] | [ ] |
| Fase 5 - Desempenho e Planejamento | [ ] | [ ] | [ ] | [ ] | [ ] |
| Fase 6 - Segurança e Integridade | [ ] | [ ] | [ ] | [ ] | [ ] |
| Fase 7 - UX e Acabamento | [ ] | [ ] | [ ] | [ ] | [ ] |
| Fase 8 - QA Final e Publicação | [ ] | [ ] | [ ] | [ ] | [ ] |

---

## 📜 3. Fonte Oficial do Conteúdo e Taxonomia

- **Concurso:** TRANSPETRO / PSP / TERRA / Nível Médio - 2026.3
- **Cargo / Ênfase:** Ênfase 18 - Suprimento de Bens e Serviços
- **Banca:** Fundação Cesgranrio
- **Data da Prova:** **06/12/2026** (vigente conforme retificação)

### Taxonomia Oficial: 47 Tópicos
O banco de dados e a interface devem refletir estritamente os **47 tópicos oficiais**:

| Disciplina | Qtd. Tópicos |
| :--- | :---: |
| Língua Portuguesa | 8 |
| Matemática | 10 |
| Noções de Administração e Logística | 5 |
| Logística e Cadeia de Suprimentos | 11 |
| Legislação | 6 |
| Noções de Contabilidade e Informática | 7 |
| **TOTAL OFICIAL** | **47** |

> [!WARNING]
> Não permitir que a interface ou banco apresente 49 tópicos resultantes de agrupamentos pedagógicos desatualizados.

### Estrutura da Prova
- **Total:** 60 questões
  - 10 questões de Língua Portuguesa (1 ponto cada)
  - 10 questões de Matemática (1 ponto cada)
  - 40 questões de Conhecimentos Específicos (1 ponto cada)
- **Duração:** 4 horas
- **Critérios de Eliminação:**
  - Grau zero em Língua Portuguesa.
  - Grau zero em Matemática.
  - Menos de 50% em Conhecimentos Básicos (< 10 acertos no somatório de Português + Matemática).
  - Menos de 50% em Conhecimentos Específicos (< 20 acertos).
- **Meta Pessoal:** 47/60 (78,3%) é uma meta pessoal de estudo para competitividade, nunca critério de eliminação do edital.

---

## 🗄️ 4. Atenção Especial ao Seed e Reconciliação do Banco

- Inspecionar obrigatoriamente `prisma/seed.ts` e `prisma/schema.prisma`.
- Prevenir duplicações de registros existentes durante re-execuções de seed.
- Caso existam tópicos legados no banco:
  1. Identificar registros obsoletos.
  2. Verificar vínculos com aulas, questões, tentativas e progresso do usuário.
  3. Migrar vínculos para os tópicos oficiais equivalentes.
  4. Remover tópicos órfãos apenas quando for 100% seguro.
  5. Preservar o histórico do usuário.

---

## 🧠 5. RAG e Documentos Normativos

- Arquivos em `documents/edital/` e `documents/legislacao/`.
- Prioridade máxima para as **retificações oficiais** sobre o edital original.
- Grounding jurídico embasado em fontes integrais salvas no repositório:
  - Decreto nº 2.745/1998 (integral).
  - Lei nº 13.303/2016 (integral, com destaque aos arts. 28 a 91).
  - LC nº 123/2006 (arts. 42 a 49).
- Documentos classificados como `pointer` (ex: Lei nº 14.133/2021) não devem ser tratados como fontes integrais validadas.
- O sistema é expressamente proibido de inventar artigos, incisos ou regras.
- Questões de IA devem ser marcadas com proveniência explícita (`INEDITA_IA`).

---

## 🤖 6. Diretrizes para Inteligência Artificial (Gemini)

- Validação rigorosa de payloads antes da persistência no banco.
- Tratamento de timeout, fallbacks e respostas truncadas.
- Requisitos obrigatórios para questões geradas:
  - Enunciado claro contextualizado.
  - 5 alternativas (A, B, C, D, E).
  - Apenas uma resposta correta.
  - Justificativa detalhada para o gabarito.
  - Dificuldade válida (`FACIL`, `MEDIA`, `DIFICIL`).
  - Vinculação a um tópico oficial válido.
  - Marcação de origem inédita.

---

## 🛡️ 7. Duplicidade, Concorrência e Idempotência

- Proteger contra cliques duplos e requisições simultâneas em:
  - Submissão de respostas de questões.
  - Finalização e envio de simulados.
  - Registro de feedback de aula e ganho de XP.
  - Avaliação de flashcards.
- Utilização obrigatória de chaves de idempotência (`idempotencyKey`) e restrições únicas no banco de dados.
- Bloqueio de interface durante operações de mutação ativas.

---

## 🧪 8. Estratégia de Testes Automatizados

Critério de aprovação após cada etapa:
1. `npm run typecheck` (zero erros).
2. `npx prisma validate` e `prisma generate`.
3. `npm run test` (testes unitários e de integração).
4. `npm run build` (compilação de produção sem falhas).

Áreas prioritárias de cobertura:
- Motor de eliminação e cálculo do simulado.
- SRS e cálculo de intervalos de revisão.
- Streak diário e cálculo de fuso horário.
- Deduplicação e idempotência em endpoints de submissão.
- Mecanismo de busca e ranking do RAG.

---

## 🌐 9. Roteiro de Smoke Test no Navegador (Headless)

Execução ponta a ponta dos fluxos de usuário:
1. Carregamento do Dashboard inicial.
2. Navegação pelo Edital Verticalizado.
3. Abertura de tópico oficial e geração/leitura de aula.
4. Registro de feedback cognitivo.
5. Resolução de questão de treino com verificação de gabarito e explicação.
6. Registro de erro e encaminhamento para "Treinar Meus Erros".
7. Estudo e avaliação de Flashcard via SRS.
8. Verificação do painel de Desempenho e evolução de domínio.
9. Início e submissão de bateria de questões.
10. Execução e submissão de Simulado Oficial de 60 questões.
11. Análise do diagnóstico de aprovação/eliminação.
12. Abertura do Professor IA e envio de pergunta embasada no RAG.
13. Consulta da página de Configurações e exportação de Backup JSON.

---

## 🧰 10. Uso da Software Factory gstack

- Utilizar as ferramentas do **gstack** (Garry Tan) instaladas no ambiente:
  - `/office-hours` e `/plan-eng-review` para alinhamento arquitetural.
  - `/review` para auditoria estrita de código e segurança.
  - `/qa` e `/qa-only` para navegação e inspeção visual via Playwright.
  - `/investigate` para diagnóstico metódico de causa-raiz.
  - `/ship` para liberação e conferência final.

---

## 📦 11. Boas Práticas de Git

- Commits semânticos e atômicos em Português (PT-BR):
  - `feat:` Nova funcionalidade
  - `fix:` Correção de bug
  - `refactor:` Refatoração de código
  - `test:` Inclusão ou ajuste de testes
  - `docs:` Atualizações de documentação
  - `chore:` Tarefas de manutenção ou build

---

## 🔄 12. Loop de Execução Contínua

Para cada módulo ou fase:

$$\text{ANALISAR} \longrightarrow \text{IMPLEMENTAR} \longrightarrow \text{REVISAR} \longrightarrow \text{TESTAR} \longrightarrow \text{CORRIGIR} \longrightarrow \text{VALIDAR} \longrightarrow \text{COMMIT} \longrightarrow \text{ATUALIZAR DOCS} \longrightarrow \text{PRÓXIMA FASE}$$

> [!CAUTION]
> **Proibido Parar para Pedir Autorização:** Não interromper a execução com perguntas como "Posso continuar?" ou "Deseja que eu corrija isso?". Corrigir, testar, validar, registrar e avançar.

---

## 🕵️ 13. Subagente Auditor Final (Revisão Cruzada)

Ao concluir as implementações, o Auditor Final inspeciona:
- Inconsistências de código e dead code.
- Valores hardcoded ou divergentes entre páginas.
- Precisão da taxonomia de tópicos (exatamente 47).
- Fidelidade matemática dos indicadores de desempenho.
- Ausência de vulnerabilidades ou vazamentos de chaves de API.
- Responsividade e usabilidade mobile.

---

## ✅ 14. Critérios de Conclusão ("Definição de Pronto")

- [ ] 47 tópicos oficiais rigorosamente estruturados e coerentes.
- [ ] Edital e retificações sincronizados no RAG.
- [ ] Data oficial da prova fixada em 06/12/2026.
- [ ] Dashboard com contador, meta, streak e pontos fracos ativos.
- [ ] Edital Verticalizado funcional com status de domínio.
- [ ] Aulas com roteiro pedagógico e cache em banco.
- [ ] Treino de questões com baterias e filtro de erros.
- [ ] Flashcards com agendamento adaptativo (SRS).
- [ ] Simulado oficial com 60 questões (40/10/10) e 4 horas.
- [ ] Diagnóstico com regras oficiais de eliminação e meta 47/60 separada.
- [ ] Professor IA com grounding no RAG e sem alucinação jurídica.
- [ ] Idempotência contra envios duplicados ativa no backend.
- [ ] Exportação completa de backup em JSON funcional.
- [ ] Responsividade mobile impecável.
- [ ] `tsc --noEmit` passando com 0 erros.
- [ ] `next build` compilando sem falhas.
- [ ] Suíte de testes automatizados aprovada.
- [ ] Smoke test no navegador concluído com sucesso.
- [ ] `CHANGELOG.md`, `task.md` e manuais atualizados.

---

## 📋 15. Regra de Entrega e Relatório Final

Entregar ao final relatório objetivo contendo:
1. O que foi implementado.
2. O que foi corrigido.
3. O que foi testado.
4. O que foi validado.
5. Lista de commits realizados.
6. Resultados de build, typecheck e testes.
7. Resultados do smoke test via navegador.
8. Eventuais pendências externas documentadas.

---

## ⚡ Regra Especial para Subagentes

> [!IMPORTANT]
> **Modificação Real de Código:** Cada subagente tem autorização explícita para modificar código. O resultado esperado é:
>
> $$\text{ANÁLISE} \longrightarrow \text{ALTERAÇÃO REAL} \longrightarrow \text{TESTE} \longrightarrow \text{CORREÇÃO} \longrightarrow \text{ENTREGA/COMMIT}$$
>
> Não considerar "analisado" como "feito". Não considerar "implementado" como "validado".
