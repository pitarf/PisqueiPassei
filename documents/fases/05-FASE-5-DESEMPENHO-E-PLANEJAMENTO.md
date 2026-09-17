# Fase 5, Desempenho e planejamento

## Objetivo
Usar os dados registrados pelo sistema para mostrar evolução, lacunas e próximas ações de estudo.

## Entregas
- [x] Dashboard.
- [x] Desempenho por disciplina.
- [x] Desempenho por tópico.
- [x] Pontos fracos.
- [x] Questões recentes.
- [x] Histórico de simulados.
- [x] Horas de estudo.
- [x] Sequência de estudos.
- [x] Contagem regressiva para a prova.
- [x] Próximo tópico recomendado.

## Pendências
- [ ] Garantir que métricas de tópicos não iniciados sejam consistentes em todas as telas.
- [ ] Validar coerência entre Dashboard e Desempenho.
- [ ] Validar ordenação de revisões vencidas.
- [ ] Validar recomendação de próximo tópico.
- [ ] Validar cenário de usuário sem atividade.
- [ ] Validar cenário com atividade parcial.
- [ ] Garantir que os indicadores não sejam apresentados como previsão de nota na prova.

## Testes
- [ ] Zero questões respondidas.
- [ ] Um tópico estudado.
- [ ] Vários tópicos estudados.
- [ ] Tópico abaixo de 70%.
- [ ] Tópico acima de 85%.
- [ ] Revisão vencida.
- [ ] Simulado recente.
- [ ] Sem simulados.
- [ ] Sequência de um dia.
- [ ] Sequência de vários dias.
- [ ] Data da prova após mudança de calendário.

## Critério de conclusão
Todas as métricas devem ser calculadas a partir dos mesmos dados persistidos e apresentar definições claras, sem misturar desempenho de treino com nota de simulado.
