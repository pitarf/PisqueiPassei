import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rankStudyPriorities } from "@/lib/study-priority";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await prisma.user.findFirst({ where: { email: "rafael@estudos.transpetro" }, select: { id: true } });
    if (!user) return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });

    const topics = await prisma.topic.findMany({
      include: {
        subject: true,
        userProgress: { where: { userId: user.id } },
        _count: { select: { questions: true, historicalQuestions: true } },
      },
      orderBy: [{ subject: { order: "asc" } }, { order: "asc" }],
    });

    const ranked = rankStudyPriorities(topics.map((topic) => {
      const p = topic.userProgress[0];
      return {
        topicId: topic.id,
        masteryScore: p?.masteryScore ?? 0,
        status: p?.status ?? "NAO_INICIADO",
        totalQuestions: p?.totalQuestions ?? 0,
        correctAnswers: p?.correctAnswers ?? 0,
        nextReviewDate: p?.nextReviewDate ?? null,
        questionCount: topic._count.questions,
        historicalQuestionCount: topic._count.historicalQuestions,
      };
    })).map((item) => {
      const topic = topics.find((candidate) => candidate.id === item.topicId)!;
      return {
        topicId: topic.id,
        code: topic.code,
        title: topic.title,
        subject: topic.subject.name,
        mastery: Math.round(item.masteryScore),
        accuracy: item.totalQuestions ? Math.round((item.correctAnswers / item.totalQuestions) * 100) : 0,
        attempts: item.totalQuestions,
        historicalQuestions: item.historicalQuestionCount,
        availableQuestions: item.questionCount,
        priority: item.priority,
        reason: item.reason,
        suggestedDifficulty: item.suggestedDifficulty,
      };
    });

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      strategy: "prioridade = revisão + lacunas de estudo + domínio/acerto + cobertura histórica + disponibilidade do banco",
      recommendations: ranked.slice(0, 10),
    });
  } catch (error) {
    console.error("Erro ao calcular prioridades de estudo:", error);
    return NextResponse.json({ error: "Não foi possível calcular as prioridades." }, { status: 500 });
  }
}
