# Fase 2, Motor de estudo

## Objetivo
Transformar a taxonomia do edital em um ciclo de estudo persistente: aprender, praticar, errar, revisar e medir evolução.

## Entregas
- [x] Página de edital.
- [x] Página de aula por tópico.
- [x] Questões por tópico/disciplina.
- [x] Treino de erros.
- [x] Flashcards.
- [x] SRS baseado no feedback do aluno.
- [x] Registro de acertos e erros.
- [x] Registro de tempo.
- [x] XP.
- [x] Sequência diária.
- [x] Recomendações de estudo.

## Pendências
- [ ] Teste ponta a ponta do ciclo aula -> questão -> erro -> revisão.
- [ ] Teste do SRS com os três feedbacks.
- [ ] Confirmar que o progresso é persistente após reload.
- [ ] Confirmar que treino de erros prioriza erros reais.
- [ ] Confirmar que fallback para tópicos fracos funciona quando não há erros.
- [ ] Confirmar que tópicos não iniciados aparecem corretamente como pendentes.
- [ ] Melhorar proteção contra concorrência em registros de resposta, se necessário.

## Testes obrigatórios
- [ ] Acerto em questão.
- [ ] Erro em questão.
- [ ] Duplo clique em resposta.
- [ ] Flashcard `NAO_ENTENDI`.
- [ ] Flashcard `REVISAR`.
- [ ] Flashcard `ENTENDI`.
- [ ] Revisão vencida.
- [ ] Questão sem progresso prévio.
- [ ] Questão de tópico já estudado.
- [ ] Sequência no mesmo dia.
- [ ] Sequência em dia consecutivo.
- [ ] Quebra de sequência.

## Critério de conclusão
O aluno deve conseguir completar um ciclo real de estudo sem perda de estado e sem duplicação perceptível de progresso/XP.
