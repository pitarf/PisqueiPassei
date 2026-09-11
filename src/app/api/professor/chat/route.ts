import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { askProfessorAI } from "@/lib/gemini";

/**
 * Endpoint para conversa com o Professor IA
 * Injeta o contexto em tempo real de desempenho, pontos fracos e edital.
 */
export async function POST(req: NextRequest) {
  try {
    const { message, conversationId } = await req.json();

    if (!message) {
      return NextResponse.json(
        { error: "A mensagem não pode ser vazia." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: { email: "rafael@estudos.transpetro" },
      include: {
        progress: {
          include: { topic: true },
        },
        attempts: {
          where: { isCorrect: false },
          include: { question: { include: { topic: true } } },
          take: 5,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    }

    // Calcular pontos fracos
    const weakPoints = user.progress
      .filter((p) => p.status !== "NAO_INICIADO" && p.masteryScore < 70)
      .map((p) => `${p.topic.title} (${Math.round(p.masteryScore)}%)`);

    // Erros recentes
    const recentErrors = user.attempts.map(
      (a) => `${a.question.topic.title}: errou opção ${a.chosenOption} (correta era ${a.question.correctOption})`
    );

    // Média geral
    const totalMastery = user.progress.reduce((acc, p) => acc + p.masteryScore, 0);
    const averageMastery =
      user.progress.length > 0 ? totalMastery / user.progress.length : 0;

    // Buscar ou criar conversa
    let conv = conversationId
      ? await prisma.aIConversation.findUnique({
          where: { id: conversationId },
          include: { messages: { orderBy: { createdAt: "asc" } } },
        })
      : null;

    if (!conv) {
      conv = await prisma.aIConversation.create({
        data: {
          userId: user.id,
          title: message.slice(0, 40) + "...",
        },
        include: { messages: true },
      });
    }

    // Salvar mensagem do usuário
    await prisma.aIMessage.create({
      data: {
        conversationId: conv.id,
        role: "user",
        content: message,
      },
    });

    const chatHistory = conv.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Chamar Professor IA
    const aiResponse = await askProfessorAI(
      message,
      {
        studentName: user.name,
        currentMastery: averageMastery,
        weakPoints,
        recentErrors,
      },
      chatHistory
    );

    // Salvar resposta do assistente
    const assistantMessage = await prisma.aIMessage.create({
      data: {
        conversationId: conv.id,
        role: "assistant",
        content: aiResponse,
      },
    });

    return NextResponse.json({
      conversationId: conv.id,
      response: aiResponse,
      messageId: assistantMessage.id,
    });
  } catch (error) {
    console.error("Erro no chat do Professor IA:", error);
    return NextResponse.json(
      { error: "Erro ao se comunicar com o Professor IA. Tente novamente." },
      { status: 500 }
    );
  }
}
