import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { askProfessorAI } from "@/lib/gemini";

/** Endpoint para conversa com o Professor IA. */
export async function POST(req: NextRequest) {
  try {
    const { message, conversationId } = await req.json();
    if (typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "A mensagem não pode ser vazia." }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: { email: "rafael@estudos.transpetro" },
      include: {
        progress: { include: { topic: true } },
        attempts: {
          where: { isCorrect: false },
          include: { question: { include: { topic: true } } },
          take: 5,
          orderBy: { createdAt: "desc" },
        },
      },
    });
    if (!user) return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });

    const weakPoints = user.progress
      .filter((p) => p.status !== "NAO_INICIADO" && p.masteryScore < 70)
      .map((p) => `${p.topic.title} (${Math.round(p.masteryScore)}%)`);
    const recentErrors = user.attempts.map(
      (a) => `${a.question.topic.title}: errou opção ${a.chosenOption} (correta era ${a.question.correctOption})`
    );
    const totalMastery = user.progress.reduce((acc, p) => acc + p.masteryScore, 0);
    const averageMastery = user.progress.length ? totalMastery / user.progress.length : 0;

    // Nunca aceitar uma conversa de outro usuário.
    let conv = conversationId
      ? await prisma.aIConversation.findFirst({
          where: { id: conversationId, userId: user.id },
          include: { messages: { orderBy: { createdAt: "asc" } } },
        })
      : null;

    if (!conv) {
      conv = await prisma.aIConversation.create({
        data: { userId: user.id, title: message.trim().slice(0, 40) + "..." },
        include: { messages: true },
      });
    }

    await prisma.aIMessage.create({
      data: { conversationId: conv.id, role: "user", content: message.trim() },
    });

    const aiResponse = await askProfessorAI(
      message.trim(),
      { studentName: user.name, currentMastery: averageMastery, weakPoints, recentErrors },
      conv.messages.map((m) => ({ role: m.role, content: m.content }))
    );

    const assistantMessage = await prisma.aIMessage.create({
      data: { conversationId: conv.id, role: "assistant", content: aiResponse },
    });

    return NextResponse.json({ conversationId: conv.id, response: aiResponse, messageId: assistantMessage.id });
  } catch (error) {
    console.error("Erro no chat do Professor IA:", error);
    return NextResponse.json({ error: "Erro ao se comunicar com o Professor IA. Tente novamente." }, { status: 500 });
  }
}
