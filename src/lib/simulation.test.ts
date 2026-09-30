import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { loadExamQuestions, EXAM_TOTAL, PORT_TOTAL, MATH_TOTAL, SPECIFIC_TOTAL } from "./simulation";
import { prisma } from "./prisma";

describe("loadExamQuestions - Validação Rigorosa da Prova Oficial Cesgranrio", () => {
  it("carrega exatamente 60 questões com distribuição 10 Português, 10 Matemática e 40 Específicas", async () => {
    const result = await loadExamQuestions();

    assert.equal(result.questions.length, EXAM_TOTAL, "A prova deve conter exatamente 60 questões");
    assert.equal(result.distribution.portuguese, PORT_TOTAL, "Devem ser 10 questões de Português");
    assert.equal(result.distribution.math, MATH_TOTAL, "Devem ser 10 questões de Matemática");
    assert.equal(result.distribution.specific, SPECIFIC_TOTAL, "Devem ser 40 questões de Conhecimentos Específicos");

    assert.equal(result.deficits.portuguese, 0, "Déficit de Português deve ser zero");
    assert.equal(result.deficits.math, 0, "Déficit de Matemática deve ser zero");
    assert.equal(result.deficits.specific, 0, "Déficit de Específicas deve ser zero");

    // Valida unicidade dos IDs retornados
    const uniqueIds = new Set(result.questions.map((q) => q.id));
    assert.equal(uniqueIds.size, EXAM_TOTAL, "Todos os 60 IDs das questões devem ser estritamente únicos");

    // Valida consistência de cada questão
    for (const q of result.questions) {
      assert.ok(q.id, "Questão deve ter ID");
      assert.ok(q.statement, "Questão deve ter enunciado");
      assert.ok(q.optionA, "Questão deve ter optionA");
      assert.ok(q.optionB, "Questão deve ter optionB");
      assert.ok(q.optionC, "Questão deve ter optionC");
      assert.ok(q.optionD, "Questão deve ter optionD");
      assert.ok(q.optionE, "Questão deve ter optionE");
      assert.match(q.correctOption, /^[A-E]$/, "Gabarito deve estar entre A e E");
      assert.ok(q.topic?.subject?.name, "Questão deve ter disciplina vinculada");
    }

    // Valida que os primeiros 10 itens são de Língua Portuguesa
    const portSlice = result.questions.slice(0, 10);
    for (const q of portSlice) {
      assert.equal(q.topic.subject.name, "Língua Portuguesa");
    }

    // Valida que os itens de 10 a 19 são de Matemática
    const mathSlice = result.questions.slice(10, 20);
    for (const q of mathSlice) {
      assert.equal(q.topic.subject.name, "Matemática");
    }

    // Valida que os itens de 20 a 59 são de Conhecimentos Específicos
    const specSlice = result.questions.slice(20, 60);
    for (const q of specSlice) {
      assert.equal(q.topic.subject.category, "ESPECIFICO");
    }
  });

  it("verifica integridade e consistência direta no banco de dados Neon", async () => {
    const totalQuestions = await prisma.question.count();
    assert.ok(totalQuestions >= 60, `Banco de dados deve possuir no mínimo 60 questões (encontradas: ${totalQuestions})`);

    const portCount = await prisma.question.count({
      where: { topic: { subject: { name: "Língua Portuguesa" } } },
    });
    assert.ok(portCount >= 10, `Banco deve possuir no mínimo 10 questões de Português (encontradas: ${portCount})`);

    const mathCount = await prisma.question.count({
      where: { topic: { subject: { name: "Matemática" } } },
    });
    assert.ok(mathCount >= 10, `Banco deve possuir no mínimo 10 questões de Matemática (encontradas: ${mathCount})`);

    const specCount = await prisma.question.count({
      where: { topic: { subject: { category: "ESPECIFICO" } } },
    });
    assert.ok(specCount >= 40, `Banco deve possuir no mínimo 40 questões Específicas (encontradas: ${specCount})`);
  });
});
