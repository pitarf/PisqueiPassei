import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";

describe("Taxonomia Oficial do Edital (Ênfase 18)", () => {
  it("contém exatamente 47 tópicos oficiais e 6 disciplinas no banco", async () => {
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
