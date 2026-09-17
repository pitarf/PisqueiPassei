# Fase 3, Simulado e diagnóstico

## Objetivo
Reproduzir no sistema a estrutura da prova e transformar o resultado em diagnóstico de estudo, sem confundir meta pessoal com regra oficial do processo seletivo.

## Entregas
- [x] Simulado de 60 questões.
- [x] 40 questões específicas.
- [x] 10 questões de Português.
- [x] 10 questões de Matemática.
- [x] Cronômetro de 4 horas.
- [x] Registro das respostas.
- [x] Registro de questões não respondidas.
- [x] Correção por tópico.
- [x] Diagnóstico de eliminação.
- [x] Meta pessoal configurável.
- [x] Histórico de simulados.

## Pendências
- [ ] Teste completo de uma prova 60/60.
- [ ] Teste com questões não respondidas.
- [ ] Teste de eliminação por específicos.
- [ ] Teste de eliminação por conhecimentos gerais.
- [ ] Teste de zero em Português.
- [ ] Teste de zero em Matemática.
- [ ] Teste de pontuação na fronteira dos critérios.
- [ ] Teste contra submissão repetida.
- [ ] Teste de concorrência na submissão.
- [ ] Conferir consistência entre resultado, histórico e desempenho.

## Casos de validação
- [ ] 20/40 específicos, 10/20 gerais, Português > 0, Matemática > 0: não eliminar por desempenho.
- [ ] 19/40 específicos: eliminar.
- [ ] 9/20 gerais: eliminar.
- [ ] 0/10 Português: eliminar.
- [ ] 0/10 Matemática: eliminar.
- [ ] 60 questões respondidas.
- [ ] Algumas questões sem resposta.
- [ ] IDs duplicados no payload.
- [ ] Questão fora do caderno.

## Critério de conclusão
O simulado deve corrigir exatamente o caderno submetido, aplicar os critérios oficiais configurados no projeto e gerar diagnóstico reproduzível.
