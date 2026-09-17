import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getRagContext } from "./rag";

describe("getRagContext", () => {
  it("prioriza a retificação oficial quando a consulta trata de cronograma", () => {
    const context = getRagContext("data da prova cronograma inscrição", { maxDocuments: 2 });
    assert.ok(context.includes("retificacao-edital-2026.3.md"));
    assert.ok(context.includes("OFICIAL"));
  });

  it("retorna mensagem explícita quando não há documentos relevantes", () => {
    const context = getRagContext("zzzz consulta sem correspondência provável");
    assert.ok(context.includes("Nenhum documento local relevante"));
  });

  it("encontra fontes legais específicas para decreto 2745", () => {
    const context = getRagContext("decreto 2.745 procedimento licitatorio simplificado petrobras", { maxDocuments: 2 });
    assert.ok(context.includes("decreto-2745-1998.md"));
  });

  it("encontra a Lei 13.303 para estatuto das estatais", () => {
    const context = getRagContext("lei 13.303 estatuto juridico empresas estatais", { maxDocuments: 2 });
    assert.ok(context.includes("lei-13303-2016.md"));
  });
});
