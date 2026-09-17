# Banco histórico de questões, TRANSPETRO Study 2026.3

## Objetivo

Construir um banco de questões útil para treino da Ênfase 18, combinando questões históricas identificadas por fonte com questões inéditas elaboradas a partir dos mesmos conteúdos e padrões observados.

O banco não deve ser tratado como uma coleção genérica de perguntas de IA. Cada questão precisa preservar sua origem e seu vínculo com um tópico oficial do edital.

## Taxonomia de origem

- `OFICIAL_TRANSPETRO`: questão de prova oficial da Transpetro.
- `OFICIAL_PETROBRAS`: questão de prova oficial da Petrobras usada como referência.
- `OFICIAL_CESGRANRIO`: questão oficial da banca Cesgranrio, quando a fonte estiver identificada.
- `OFICIAL_OUTRA`: outra prova oficial relevante.
- `ADAPTADA`: questão reescrita ou adaptada, sem apresentar o texto como questão oficial.
- `INEDITA_IA`: questão original elaborada pelo sistema.

O campo `sourceRef` deve registrar a proveniência disponível. Para questões oficiais, priorizar prova, ano, número da questão e página quando essas informações forem conhecidas. Para questões inéditas, registrar que são originais e, quando aplicável, quais questões ou padrões históricos serviram de referência.

## Vínculo com o edital

Toda questão deve apontar para um dos 47 tópicos oficiais cadastrados. Não criar tópicos artificiais apenas para acomodar uma questão.

Quando uma questão envolver mais de um assunto, o vínculo principal deve ser o tópico que representa o conhecimento efetivamente cobrado. A explicação pode registrar conhecimentos auxiliares.

## Classificação

Sempre que houver evidência suficiente, classificar:

- dificuldade: `FACIL`, `MEDIA`, `DIFICIL`;
- tipo: conceitual, interpretação, cálculo, aplicação, caso prático, legislação, comparação ou análise de cenário;
- nível cognitivo: reconhecer, compreender, aplicar ou analisar.

A classificação de dificuldade de uma questão histórica é descritiva, não uma medida absoluta. Para questões inéditas, ela representa a dificuldade pretendida no momento da elaboração.

## Geração de questões irmãs

A partir de uma questão histórica ou de um padrão identificado, o sistema pode produzir:

1. uma versão mais acessível, cobrando o mesmo núcleo conceitual;
2. uma versão equivalente, preservando a complexidade aproximada;
3. uma versão mais exigente, adicionando dados, cenário, comparação ou combinação de conceitos;
4. uma versão em cenário diferente;
5. uma versão com distratores plausíveis, sem depender de ambiguidade artificial.

As questões irmãs precisam ser originais e não podem ser apresentadas como questões oficiais.

## Integridade

Antes de liberar um banco para treino:

- não aceitar alternativas repetidas;
- não aceitar gabarito fora de A-E;
- não aceitar questão oficial/inédita sem proveniência mínima;
- detectar enunciados duplicados ou quase duplicados;
- verificar cobertura dos 47 tópicos;
- verificar distribuição de dificuldades;
- preservar a distinção entre fonte histórica e conteúdo gerado.

## Auditoria

Executar:

`node scripts/audit-question-bank.js`

Para transformar problemas de qualidade em falha explícita de automação:

`STRICT=1 node scripts/audit-question-bank.js`

O relatório deve ser usado antes de montar bancos grandes ou simulados.
