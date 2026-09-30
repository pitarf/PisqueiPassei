import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { PrismaClient, Prisma } from "@prisma/client";
import { computeStatementHash } from "./question-validator";

const prisma = new PrismaClient();

describe("Concorrência, Idempotência e Colisão P2002 (topicId, statementHash)", () => {
  let testTopicId: string;
  const createdQuestionIds: string[] = [];

  beforeAll(async () => {
    const topic = await prisma.topic.findFirst({ orderBy: { order: "asc" } });
    if (!topic) {
      throw new Error("Nenhum tópico encontrado no banco de dados para executar o teste de concorrência.");
    }
    testTopicId = topic.id;
  });

  afterAll(async () => {
    if (createdQuestionIds.length > 0) {
      await prisma.question.deleteMany({
        where: { id: { in: createdQuestionIds } },
      });
    }
    await prisma.$disconnect();
  });

  it("dispara erro Prisma P2002 ao tentar inserir simultaneamente questões com o mesmo topicId e statementHash", async () => {
    const timestamp = Date.now();
    const statement = `Questão de Teste Concorrente de Colisão P2002 #${timestamp}: Qual o impacto da unicidade de hash?`;
    const hash = computeStatementHash(statement);

    const questionData = {
      topicId: testTopicId,
      statement,
      statementHash: hash,
      optionA: "Garante idempotência e previne duplicação",
      optionB: "Causa lentidão no banco",
      optionC: "Apaga dados antigos sem aviso",
      optionD: "Não tem efeito",
      optionE: "Nenhuma das anteriores",
      correctOption: "A",
      explanation: "A constraint única @@unique([topicId, statementHash]) garante integridade absoluta.",
      difficulty: "MEDIA",
      origin: "AI_GENERATED",
      banca: "IA (perfil Cesgranrio)",
    };

    // Dispara duas inserções concorrentes idênticas no banco PostgreSQL real
    const results = await Promise.allSettled([
      prisma.question.create({ data: questionData }),
      prisma.question.create({ data: questionData }),
    ]);

    const fulfilled = results.filter(
      (r): r is PromiseFulfilledResult<any> => r.status === "fulfilled"
    );
    const rejected = results.filter(
      (r): r is PromiseRejectedResult => r.status === "rejected"
    );

    // Exatamente uma inserção deve ser bem-sucedida e a outra deve ser rejeitada
    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);

    // Registra ID criado para limpeza no afterAll
    createdQuestionIds.push(fulfilled[0].value.id);

    // Valida que o erro da inserção rejeitada é categoricamente P2002 (Unique constraint failed)
    const error = rejected[0].reason;
    expect(error).toBeInstanceOf(Prisma.PrismaClientKnownRequestError);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      expect(error.code).toBe("P2002");
      // O target deve envolver topicId e statementHash
      const target = String(error.meta?.target || "");
      expect(target).toContain("statementHash");
    }
  });

  it("absorve graciosamente colisão de inserção concorrente simulando o padrão dos endpoints", async () => {
    const timestamp = Date.now() + 1;
    const statement = `Questão Graciosa Absorvida P2002 #${timestamp}: Demonstração de absorção resiliente.`;
    const hash = computeStatementHash(statement);

    const questionData = {
      topicId: testTopicId,
      statement,
      statementHash: hash,
      optionA: "Opção correta",
      optionB: "Opção B",
      optionC: "Opção C",
      optionD: "Opção D",
      optionE: "Opção E",
      correctOption: "A",
      explanation: "Explicação resiliente.",
      difficulty: "MEDIA",
      origin: "AI_GENERATED",
      banca: "IA (perfil Cesgranrio)",
    };

    // Função que replica a estratégia adotada nas rotas /api/questions/batch e /api/questions/siblings
    async function safeInsertQuestion(data: typeof questionData) {
      try {
        const item = await prisma.question.create({ data });
        createdQuestionIds.push(item.id);
        return { status: "created", questionId: item.id };
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
          // Absorve colisão graciosamente buscando o registro preexistente
          const existing = await prisma.question.findUnique({
            where: {
              topicId_statementHash: {
                topicId: data.topicId,
                statementHash: data.statementHash,
              },
            },
          });
          return { status: "absorbed_duplicate", questionId: existing?.id };
        }
        throw err;
      }
    }

    const [res1, res2] = await Promise.all([
      safeInsertQuestion(questionData),
      safeInsertQuestion(questionData),
    ]);

    // Ambos os chamadores terminam com sucesso e apontam para o mesmo questionId
    expect(res1.questionId).toBeTruthy();
    expect(res2.questionId).toBeTruthy();
    expect(res1.questionId).toBe(res2.questionId);

    const statuses = [res1.status, res2.status].sort();
    expect(statuses).toEqual(["absorbed_duplicate", "created"]);
  });
});
