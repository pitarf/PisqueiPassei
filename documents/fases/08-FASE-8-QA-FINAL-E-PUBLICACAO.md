# Fase 8, QA final e publicação

## Objetivo
Executar uma bateria final antes de considerar o TRANSPETRO STUDY pronto para uso contínuo.

## Checklist técnico
- [ ] TypeScript sem erros.
- [ ] Build de produção sem erros.
- [ ] CI verde.
- [ ] Prisma Client gerado corretamente.
- [ ] Banco de produção acessível.
- [ ] Variáveis de ambiente configuradas.
- [ ] GEMINI_API_KEY configurada somente no servidor.
- [ ] Seed/reconciliação executados.

## Checklist funcional
- [ ] Dashboard.
- [ ] Edital.
- [ ] Aula.
- [ ] Questões.
- [ ] Treino de erros.
- [ ] Flashcards.
- [ ] SRS.
- [ ] Simulado.
- [ ] Professor IA.
- [ ] Desempenho.
- [ ] Configurações.
- [ ] Backup.

## Teste ponta a ponta
1. Abrir o dashboard.
2. Escolher um tópico não iniciado.
3. Abrir a aula.
4. Estudar a aula.
5. Responder questões.
6. Registrar pelo menos um erro.
7. Abrir treino de erros.
8. Revisar um flashcard.
9. Confirmar alteração do progresso.
10. Conferir dashboard/desempenho.
11. Executar um simulado.
12. Conferir diagnóstico.
13. Perguntar algo ao Professor IA.
14. Exportar backup.
15. Recarregar a aplicação e confirmar persistência.

## Regressão
- [ ] Nenhuma funcionalidade anterior quebrada.
- [ ] Nenhuma rota retorna erro 500 em uso normal.
- [ ] Nenhum dado duplicado por ações normais.
- [ ] Nenhum conteúdo fora da taxonomia oficial aparece como tópico de estudo.

## Publicação
- [ ] Documentação atualizada.
- [ ] CHANGELOG atualizado.
- [ ] Commit final identificado.
- [ ] CI do commit final verde.
- [ ] Smoke test pós-deploy.

## Critério de conclusão
A publicação só deve ser considerada concluída depois do teste ponta a ponta e da confirmação do CI/build no commit final.
