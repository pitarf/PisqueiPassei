# Formato de importação do banco histórico

O importador `scripts/import-question-bank.js` aceita um array JSON ou um objeto com `questions[]`.

Exemplo mínimo:

```json
{
  "questions": [
    {
      "subject": "2. Logística e Cadeia de Suprimentos",
      "topicCode": "2.2",
      "statement": "Enunciado original ou inédito, conforme a origem declarada.",
      "optionA": "Alternativa A",
      "optionB": "Alternativa B",
      "optionC": "Alternativa C",
      "optionD": "Alternativa D",
      "optionE": "Alternativa E",
      "correctOption": "C",
      "explanation": "Explicação objetiva e verificável.",
      "difficulty": "MEDIA",
      "origin": "OFICIAL_CESGRANRIO",
      "examYear": 2024,
      "banca": "Cesgranrio",
      "sourceRef": "Prova/ano/questão/página ou referência da fonte"
    }
  ]
}
```

## Regras

- `subject` e `topicCode` devem corresponder à taxonomia oficial dos 47 tópicos.
- `origin` deve ser um valor da taxonomia do banco.
- `correctOption` deve ser A, B, C, D ou E.
- As cinco alternativas precisam ser diferentes após normalização.
- Questões com enunciado já existente no banco são ignoradas pelo importador.
- O importador não apaga nem altera questões existentes.
- Use `--dry-run` para validar e contabilizar sem inserir.

Comandos:

```bash
npm run import:questions -- ./caminho/arquivo.json --dry-run
npm run import:questions -- ./caminho/arquivo.json
npm run audit:questions
STRICT=1 npm run audit:questions
```
