# TRANSPETRO STUDY 2026.3
## Plano geral das fases de desenvolvimento

**Projeto:** PisqueiPassei
**Concurso:** TRANSPETRO/PSP/TERRA/Nível Médio 2026.3
**Ênfase:** 18, Suprimento de Bens e Serviços
**Última referência de prova no projeto:** 06/12/2026

> Este documento é o mapa de execução do projeto. Cada fase possui entregas, testes e critérios objetivos de validação.

## Fase 1, Fundação e fidelidade ao edital
- [x] Taxonomia das disciplinas e tópicos alinhada ao conteúdo oficial.
- [x] Retificações incorporadas ao material do projeto.
- [x] RAG local estruturado por prioridade e tipo de fonte.
- [x] Separação entre fonte oficial, fonte normativa e referência pedagógica.
- [x] Regras para não apresentar questões de IA como questões reais da Cesgranrio.
- [x] Geração estruturada de aulas, questões e flashcards.
- [ ] Reconciliação final dos dados existentes no banco com a taxonomia atual.
- [ ] Verificar cobertura dos 47 tópicos cadastrados.
- [ ] Validar que cada tópico consegue abrir aula, questões e revisão.
- [ ] Validar fontes jurídicas críticas antes de considerar a fase encerrada.

### Testes da Fase 1
- [ ] Seed executado em banco limpo.
- [ ] Seed executado novamente sem duplicar disciplinas/tópicos.
- [ ] Busca RAG para cada disciplina.
- [ ] Busca RAG para cada legislação prevista.
- [ ] Geração de aula com JSON válido.
- [ ] Geração de questões com alternativas A-E válidas.
- [ ] Verificação de origem das questões geradas.
- [ ] Build de produção.
- [ ] Typecheck.

## Fase 2, Motor de estudo
- [ ] Fluxo completo de aula.
- [ ] Questões por tópico/disciplina.
- [ ] Treino de erros.
- [ ] Flashcards.
- [ ] SRS e revisões programadas.
- [ ] Registro de tempo, acertos, erros, XP e sequência.
- [ ] Recomendações baseadas no progresso real.

### Testes
- [ ] Resposta correta.
- [ ] Resposta incorreta.
- [ ] Resposta duplicada.
- [ ] Revisão de flashcard.
- [ ] Alteração de domínio.
- [ ] Atualização da sequência diária.
- [ ] Persistência após recarregar a página.

## Fase 3, Simulado e diagnóstico
- [ ] Caderno oficial com 60 questões.
- [ ] Distribuição 40 específicos + 10 Português + 10 Matemática.
- [ ] Cronômetro de 4 horas.
- [ ] Questões não respondidas.
- [ ] Correção por disciplina e por tópico.
- [ ] Regras de eliminação.
- [ ] Meta pessoal de estudo separada da regra oficial.
- [ ] Histórico de simulados.

### Testes
- [ ] 60 questões exatas.
- [ ] 10 Português.
- [ ] 10 Matemática.
- [ ] 40 específicos.
- [ ] ID de questões sem repetição.
- [ ] Todas as questões pertencem ao caderno.
- [ ] Pontuação correta.
- [ ] Eliminação correta.
- [ ] Simulado duplicado não gera segunda pontuação por clique acidental.

## Fase 4, Professor IA
- [ ] Contexto individual do aluno.
- [ ] Histórico de erros.
- [ ] Pontos fracos.
- [ ] RAG aplicado à pergunta.
- [ ] Histórico persistente da conversa.
- [ ] Respostas jurídicas fundamentadas em fonte disponível.
- [ ] Sinalização de informação complementar.
- [ ] Tratamento de ausência de fonte.

### Testes
- [ ] Pergunta comum.
- [ ] Pergunta sobre legislação.
- [ ] Pergunta fora do edital.
- [ ] Pergunta sem fonte jurídica suficiente.
- [ ] Conversa com histórico.
- [ ] Histórico não pode ser sobrescrito arbitrariamente pelo cliente.

## Fase 5, Desempenho e planejamento
- [ ] Dashboard consolidado.
- [ ] Desempenho por disciplina.
- [ ] Desempenho por tópico.
- [ ] Erros recorrentes.
- [ ] Horas estudadas.
- [ ] Sequência de estudos.
- [ ] Conteúdo ainda não iniciado.
- [ ] Revisões vencidas.
- [ ] Próximo estudo recomendado.

### Testes
- [ ] Usuário sem progresso.
- [ ] Usuário com progresso parcial.
- [ ] Tópico sem questões respondidas.
- [ ] Tópico com muitos erros.
- [ ] Revisão vencida.
- [ ] Dados coerentes entre dashboard e desempenho.

## Fase 6, Segurança e integridade
- [ ] Validar entradas de todas as APIs.
- [ ] Validar IDs antes de gravação.
- [ ] Evitar duplicação de XP.
- [ ] Evitar duplicação de tentativas.
- [ ] Evitar gravações concorrentes indevidas.
- [ ] Não expor segredos no cliente.
- [ ] Não confiar em dados de progresso enviados pelo navegador.
- [ ] Backup e restauração testados.

### Testes
- [ ] Payload vazio.
- [ ] Payload inválido.
- [ ] ID inexistente.
- [ ] Alternativa inválida.
- [ ] Tempo negativo/excessivo.
- [ ] Requisições repetidas.
- [ ] Requisições concorrentes.

## Fase 7, UX e acabamento
- [ ] Navegação completa.
- [ ] Estados de carregamento.
- [ ] Estados vazios.
- [ ] Mensagens de erro úteis.
- [ ] Responsividade.
- [ ] Acessibilidade básica.
- [ ] Confirmações antes de ações destrutivas.
- [ ] Feedback visual após respostas e revisões.

## Fase 8, QA final e publicação
- [ ] Typecheck verde.
- [ ] Build verde.
- [ ] CI verde.
- [ ] Banco de produção validado.
- [ ] Seed/reconciliação validados.
- [ ] Variáveis de ambiente conferidas.
- [ ] Fluxo de estudo completo testado de ponta a ponta.
- [ ] Simulado completo testado.
- [ ] Backup testado.
- [ ] Professor IA testado.
- [ ] Documentação atualizada.
- [ ] CHANGELOG atualizado.

## Critério de conclusão do projeto
A fase só deve ser marcada como concluída quando suas entregas estiverem implementadas **e** seus testes essenciais estiverem executados com resultado satisfatório. Checkbox de implementação não substitui validação.
