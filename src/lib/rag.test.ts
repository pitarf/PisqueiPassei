import { describe, expect, it } from "vitest";
import { getRagContext } from "./rag";

describe("getRagContext", () => {
  it("prioriza a retificação oficial quando a consulta trata de cronograma", () => {
    const context = getRagContext("data da prova cronograma inscrição", { maxDocuments: 2 });
    expect(context).toContain("retificacao-edital-2026.3.md");
    expect(context).toContain("OFICIAL");
  });

  it("retorna mensagem explícita quando não há documentos relevantes", () => {
    const context = getRagContext("zzzz consulta sem correspondência provável");
    expect(context).toContain("Nenhum documento local relevante");
  });
});
