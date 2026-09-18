import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await prisma.user.findFirst({ where: { email: "rafael@estudos.transpetro" } });
    if (!user) return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });

    const topics = await prisma.topic.findMany({
      include: {
        subject: true,
        userProgress: { where: { userId: user.id } },
        _count: { select: { questions: true, historicalQuestions: true } },
      },
      orderBy: [{ subject: { order: "asc" } }, { order: "asc" }],
    });

    const ranked = topics.map(topic => {
      const p = topic.userProgress[0];
      const mastery = p?.masteryScore ?? 0;
      const studied = Boolean(p && p.status !== "NAO_INICIADO");
      const due = Boolean(p?.nextReviewDate && p.nextReviewDate <= new Date());
      const attempts = p?.totalQuestions ?? 0;
      const accuracy = attempts ? Math.round(((p?.correctAnswers ?? 0) / attempts) * 100) : 0;
      const historical = topic._count.historicalQuestions;
      const noQuestions = topic._count.questions === 0;

      let priority = 0;
      const reasons: string[] = [];
      if (due) { priority += 45; reasons.push("revisão vencida"); }
      if (!studied) { priority += 35; reasons.push("ainda não estudado"); }
      if (mastery < 70 && studied) { priority += Math.round((70 - mastery) * 0.8); reasons.push("domínio abaixo de 70%"); }
      if (accuracy < 70 && attempts >= 3) { priority += 12; reasons.push("acerto abaixo de 70%"); }
      if (historical > 0) { priority += Math.min(historical, 8); reasons.push("há histórico catalogado"); }
      if (noQuestions) { priority += 8; reasons.push("sem questões no banco"); }

      return {
        topicId: topic.id,
        code: topic.code,
        title: topic.title,
        subject: topic.subject.name,
        mastery: Math.round(mastery),
        accuracy,
        attempts,
        historicalQuestions: historical,
        availableQuestions: topic._count.questions,
        priority,
        reasons,
      };
    }).sort((a,b) => b.priority - a.priority);

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
