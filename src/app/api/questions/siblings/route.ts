import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateSiblingQuestionBatch } from "@/lib/gemini";
import { validateAiQuestion, normalizeText, VALID_DIFFICULTIES } from "@/lib/question-validator";

const VARIANTS = ["FACIL", "EQUIVALENTE", "DIFICIL", "NOVO_CENARIO", "DISTRATORES"] as const;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const questionId = typeof body.questionId === "string" ? body.questionId : "";
    const requestedVariants = Array.isArray(body.variants) ? body.variants : ["FACIL", "EQUIVALENTE", "DIFICIL"];

    if (!questionId) {
      return NextResponse.json({ error: "questionId é obrigatório." }, { status: 400 });
    }

    const variants = [...new Set(requestedVariants
      .map((item: unknown) => String(item).toUpperCase())
      .filter((item: string): item is typeof VARIANTS[number] => (VARIANTS as readonly string[]).includes(item)))]
      .slice(0, 5);

    if (!variants.length) {
      return NextResponse.json({ error: "Nenhuma variação válida foi solicitada." }, { status: 400 });
    }

    const reference = await prisma.question.findUnique({
      where: { id: questionId },
      include: { topic: { include: { subject: true } } },
    });

    if (!reference) {
      return NextResponse.json({ error: "Questão de referência não encontrada." }, { status: 404 });
    }

    const generated = await generateSiblingQuestionBatch(
      {
        statement: reference.statement,
        correctOption: reference.correctOption,
        explanation: reference.explanation,
        difficulty: reference.difficulty,
        origin: reference.origin,
        questionType: reference.questionType,
        cognitiveLevel: reference.cognitiveLevel,
        subtopic: reference.subtopic || undefined,
        sourceRef: reference.sourceRef || undefined,
        topicTitle: reference.topic.title,
        subjectName: reference.topic.subject.name,
      },
      variants.map((mode) => ({
        mode,
        difficulty: mode === "FACIL" ? "FACIL" : mode === "DIFICIL" ? "DIFICIL" : reference.difficulty,
      })),
    );

    const rawList = Array.isArray(generated?.questions) ? generated.questions : [];
    const existing = await prisma.question.findMany({
      where: { topicId: reference.topicId },
      select: { statement: true },
    });
    const seen = new Set(existing.map((item) => normalizeText(item.statement)));
    const created = [];

    for (const raw of rawList) {
      const validation = validateAiQuestion(raw, VALID_DIFFICULTIES.has(String(raw?.difficulty).toUpperCase()) ? String(raw.difficulty).toUpperCase() : "MEDIA");
      if (!validation.valid) continue;

      const q = validation.question;
      const key = normalizeText(q.statement);
      if (seen.has(key)) continue;

      const alreadyExists = await prisma.question.findFirst({
        where: { topicId: reference.topicId, statement: q.statement },
        select: { id: true },
      });
      if (alreadyExists) continue;

      const item = await prisma.question.create({
        data: {
          topicId: reference.topicId,
          statement: q.statement,
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: q.optionD,
          optionE: q.optionE,
          correctOption: q.correctOption,
          explanation: q.explanation,
          difficulty: q.difficulty,
          origin: "INEDITA_IA",
          banca: q.banca,
          sourceRef: q.sourceRef || `Questão inédita derivada da referência ${reference.id}`,
          questionType: q.questionType,
          cognitiveLevel: q.cognitiveLevel,
          subtopic: q.subtopic || reference.subtopic || null,
          referenceIdsJson: [reference.id],
          verificationStatus: "PENDENTE",
        },
        include: { topic: { include: { subject: true } } },
      });

      created.push(item);
      seen.add(key);
    }

    return NextResponse.json({
      referenceQuestionId: reference.id,
      generated: created.length,
      variants,
      questions: created,
    });
  } catch (error) {
    console.error("Erro ao gerar questões irmãs:", error);
    return NextResponse.json({ error: "Não foi possível gerar variações desta questão." }, { status: 500 });
  }
}
