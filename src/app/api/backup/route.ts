import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const USER_EMAIL = "rafael@estudos.transpetro";

export async function GET() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: USER_EMAIL },
      select: {
        id: true,
        name: true,
        email: true,
        targetScore: true,
        dailyStudyHours: true,
        currentStreak: true,
        lastStudyDate: true,
        xp: true,
        createdAt: true,
        updatedAt: true,
        progress: {
          include: { topic: { include: { subject: true } } },
          orderBy: { updatedAt: "desc" },
        },
        attempts: {
          include: { question: { include: { topic: true } } },
          orderBy: { createdAt: "desc" },
        },
        simulations: { orderBy: { completedAt: "desc" } },
        flashcardReviews: { orderBy: { reviewedAt: "desc" } },
        studySessions: { orderBy: { createdAt: "desc" } },
        aiConversations: {
          orderBy: { updatedAt: "desc" },
          include: { messages: { orderBy: { createdAt: "asc" } } },
        },
      },
    });

    if (!user) return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });

    const payload = {
      app: "TRANSPETRO STUDY 2026.3",
      backupVersion: 1,
      exportedAt: new Date().toISOString(),
      student: {
        id: user.id,
        name: user.name,
        email: user.email,
        targetScore: user.targetScore,
        dailyStudyHours: user.dailyStudyHours,
        currentStreak: user.currentStreak,
        lastStudyDate: user.lastStudyDate,
        xp: user.xp,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      progress: user.progress,
      questionAttempts: user.attempts,
      simulations: user.simulations,
      flashcardReviews: user.flashcardReviews,
      studySessions: user.studySessions,
      aiConversations: user.aiConversations,
    };

    return new NextResponse(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="transpetro-study-backup-${new Date().toISOString().slice(0, 10)}.json"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Erro ao gerar backup:", error);
    return NextResponse.json({ error: "Não foi possível gerar o backup completo." }, { status: 500 });
  }
}
