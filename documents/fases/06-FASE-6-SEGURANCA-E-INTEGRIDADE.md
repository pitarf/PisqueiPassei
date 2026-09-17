# Fase 6, Segurança e integridade

## Objetivo
Impedir que entradas inválidas, repetição de requisições ou manipulação do cliente corrompam o progresso do aluno.

## Entregas
- [x] Validação de payload em respostas.
- [x] Validação de alternativas A-E.
- [x] Validação de tempo de resposta.
- [x] Validação de payload de simulado.
- [x] Validação de distribuição do simulado.
- [x] Proteção básica contra submissões duplicadas.
- [x] API de backup.
- [x] Configurações com seleção segura de dados.
- [x] Chave Gemini mantida no servidor.

## Pendências
- [ ] Testar concorrência real em endpoints de gravação.
- [ ] Avaliar idempotência por token para respostas.
- [ ] Avaliar idempotência por token para simulados.
- [ ] Auditar todas as APIs quanto a entradas externas.
- [ ] Testar restauração do backup.
- [ ] Confirmar que nenhum segredo aparece no bundle cliente.
- [ ] Revisar tratamento de erros sem exposição de detalhes internos.

## Testes
- [ ] JSON vazio.
- [ ] JSON inválido.
- [ ] ID inexistente.
- [ ] Alternativa fora de A-E.
- [ ] Tempo negativo.
- [ ] Tempo acima do limite.
- [ ] 60 IDs duplicados.
- [ ] Menos de 60 questões no simulado.
- [ ] Questão inexistente no simulado.
- [ ] Requisições repetidas.
- [ ] Requisições simultâneas.
- [ ] Backup com dados existentes.
- [ ] Backup sem dados opcionais.

## Critério de conclusão
Não basta o endpoint rejeitar um payload simples. Os casos de repetição e concorrência devem ser considerados antes de declarar integridade garantida.
