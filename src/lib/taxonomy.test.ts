import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";
import { OFFICIAL_TAXONOMY, TOTAL_OFFICIAL_TOPICS } from "./taxonomy";

describe("Taxonomia Oficial do Edital (Ênfase 18)", () => {
  it("contém exatamente 47 tópicos oficiais e 6 disciplinas no manifesto estático", () => {
    assert.equal(OFFICIAL_TAXONOMY.length, 6);
    assert.equal(TOTAL_OFFICIAL_TOPICS, 47);

    const port = OFFICIAL_TAXONOMY.find((s) => s.name === "Língua Portuguesa");
    const math = OFFICIAL_TAXONOMY.find((s) => s.name === "Matemática");
    const adm = OFFICIAL_TAXONOMY.find((s) => s.name === "1. Noções de Administração e Logística");
    const log = OFFICIAL_TAXONOMY.find((s) => s.name === "2. Logística e Cadeia de Suprimentos");
    const leg = OFFICIAL_TAXONOMY.find((s) => s.name === "3. Legislação");
    const cont = OFFICIAL_TAXONOMY.find((s) => s.name === "4. Noções de Contabilidade e Informática");

    assert.equal(port?.topics.length, 8);
    assert.equal(math?.topics.length, 10);
    assert.equal(adm?.topics.length, 5);
    assert.equal(log?.topics.length, 11);
    assert.equal(leg?.topics.length, 6);
    assert.equal(cont?.topics.length, 7);
  });

  it("contém exatamente 47 tópicos oficiais no banco de dados Neon", async (t) => {
    const dbUrl = process.env.DATABASE_URL || "";
    // Se estiver em ambiente CI sem banco de dados real disponível, ignora o teste de banco remoto
    if (!dbUrl || dbUrl.includes("localhost:5432/transpetro_ci") || dbUrl.includes("ci:ci@")) {
      console.log("⏩ Pulando verificação de banco remoto no ambiente de CI sem serviço PostgreSQL ativo.");
      return;
    }

    const prisma = new PrismaClient();
    try {
      const subjects = await prisma.subject.findMany({
        include: { topics: true },
        orderBy: { order: "asc" },
      });

      assert.equal(subjects.length, 6);

      const subjectMap = new Map(subjects.map((s) => [s.name, s.topics.length]));

      assert.equal(subjectMap.get("Língua Portuguesa"), 8);
      assert.equal(subjectMap.get("Matemática"), 10);
      assert.equal(subjectMap.get("1. Noções de Administração e Logística"), 5);
      assert.equal(subjectMap.get("2. Logística e Cadeia de Suprimentos"), 11);
      assert.equal(subjectMap.get("3. Legislação"), 6);
      assert.equal(subjectMap.get("4. Noções de Contabilidade e Informática"), 7);

      const totalTopics = subjects.reduce((sum, s) => sum + s.topics.length, 0);
      assert.equal(totalTopics, 47);
    } finally {
      await prisma.$disconnect();
    }
  });
});
