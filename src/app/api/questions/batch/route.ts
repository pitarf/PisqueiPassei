import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateQuestionBatch } from "@/lib/gemini";

/**
 * Endpoint para obter ou gerar uma bateria de questões estilo Cesgranrio
 */
export async function POST(req: NextRequest) {
  try {
    const {
      subjectId,
      topicId,
      mode = "normal", // "normal" | "erros" | "revisao"
      count = 10,
      difficulty = "MEDIA",
    } = await req.json();

    const user = await prisma.user.findFirst({
      where: { email: "rafael@estudos.transpetro" },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    }

    let targetTopicIds: string[] = [];

    // Modo Pontos Fracos: buscar tópicos com menor domínio (< 70%)
    if (mode === "erros") {
      const weakProgresses = await prisma.userTopicProgress.findMany({
        where: {
          userId: user.id,
          masteryScore: { lt: 70 },
        },
        orderBy: { masteryScore: "asc" },
        take: 5,
        select: { topicId: true },
      });

      if (weakProgresses.length > 0) {
        targetTopicIds = weakProgresses.map((p) => p.topicId);
      } else {
        // Se não tiver registros < 70, pegar os 5 primeiros tópicos
        const fallbackTopics = await prisma.topic.findMany({ take: 5 });
        targetTopicIds = fallbackTopics.map((t) => t.id);
      }
    } else if (topicId) {
      targetTopicIds = [topicId];
    } else if (subjectId) {
      const subjectTopics = await prisma.topic.findMany({
        where: { subjectId },
        select: { id: true },
      });
      targetTopicIds = subjectTopics.map((t) => t.id);
    }

    // 1. Buscar questões existentes no banco
    const existingQuestions = await prisma.question.findMany({
      where: targetTopicIds.length > 0 ? { topicId: { in: targetTopicIds } } : {},
      include: { topic: { include: { subject: true } } },
      take: count,
      orderBy: { createdAt: "desc" },
    });

    // Se já temos a quantidade desejada, retornar imediatamente
    if (existingQuestions.length >= count) {
      return NextResponse.json({ questions: existingQuestions.slice(0, count) });
    }

    // 2. Se faltarem questões, gerar novas via IA com o edital
    const needed = count - existingQuestions.length;

    // Selecionar tópico alvo para geração
    let generatorTopic;
    if (targetTopicIds.length > 0) {
      generatorTopic = await prisma.topic.findFirst({
        where: { id: targetTopicIds[0] },
        include: { subject: true },
      });
    } else {
      generatorTopic = await prisma.topic.findFirst({
        include: { subject: true },
      });
    }

    if (generatorTopic) {
      const generated = await generateQuestionBatch(
        generatorTopic.title,
        generatorTopic.subject.name,
        Math.min(needed, 10),
        difficulty
      );

      // Salvar no banco
      const newlyCreated = [];
      for (const q of generated.questions || []) {
        const createdQ = await prisma.question.create({
          data: {
            topicId: generatorTopic.id,
            statement: q.statement,
            optionA: q.optionA,
            optionB: q.optionB,
            optionC: q.optionC,
            optionD: q.optionD,
            optionE: q.optionE,
            correctOption: q.correctOption,
            explanation: q.explanation,
            difficulty: q.difficulty || "MEDIA",
            origin: "AI_GENERATED",
            banca: "Cesgranrio",
          },
          include: { topic: { include: { subject: true } } },
        });
        newlyCreated.push(createdQ);
      }

      return NextResponse.json({
        questions: [...existingQuestions, ...newlyCreated].slice(0, count),
      });
    }

    return NextResponse.json({ questions: existingQuestions });
  } catch (error) {
    console.error("Erro ao gerar/carregar bateria de questões:", error);
    return NextResponse.json(
      { error: "Não foi possível carregar as questões. Tente novamente." },
      { status: 500 }
    );
  }
}
