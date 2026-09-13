import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { askProfessorAI } from "@/lib/gemini";

const USER_EMAIL = "rafael@estudos.transpetro";
const MAX_MESSAGE_LENGTH = 4000;
const MAX_HISTORY_MESSAGES = 30;

export async function POST(req: NextRequest) {
  try {
    const { message, conversationId } = await req.json();
    const cleanMessage = typeof message === "string" ? message.trim() : "";
    if (!cleanMessage) return NextResponse.json({ error: "A mensagem não pode ser vazia." }, { status: 400 });
    if (cleanMessage.length > MAX_MESSAGE_LENGTH) return NextResponse.json({ error: `A mensagem deve ter no máximo ${MAX_MESSAGE_LENGTH} caracteres.` }, { status: 400 });
    if (conversationId !== undefined && (typeof conversationId !== "string" || !conversationId.trim())) return NextResponse.json({ error: "Conversa inválida." }, { status: 400 });

    const user = await prisma.user.findUnique({
      where: { email: USER_EMAIL },
      include: {
        progress: { include: { topic: true } },
        attempts: { where: { isCorrect: false }, include: { question: { include: { topic: true } } }, take: 5, orderBy: { createdAt: "desc" } },
      },
    });
    if (!user) return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });

    const weakPoints = user.progress.filter((p) => p.status !== "NAO_INICIADO" && p.masteryScore < 70).sort((a, b) => a.masteryScore - b.masteryScore).slice(0, 10).map((p) => `${p.topic.title} (${Math.round(p.masteryScore)}%)`);
    const recentErrors = user.attempts.map((a) => `${a.question.topic.title}: errou opção ${a.chosenOption} (correta era ${a.question.correctOption})`);
    const totalMastery = user.progress.reduce((acc, p) => acc + p.masteryScore, 0);
    const averageMastery = user.progress.length ? totalMastery / user.progress.length : 0;

    let conv = conversationId
      ? await prisma.aIConversation.findFirst({ where: { id: conversationId, userId: user.id }, include: { messages: { orderBy: { createdAt: "desc" }, take: MAX_HISTORY_MESSAGES } } })
      : null;

    if (!conv) {
      conv = await prisma.aIConversation.create({ data: { userId: user.id, title: cleanMessage.slice(0, 40) + (cleanMessage.length > 40 ? "..." : "") }, include: { messages: true } });
    }

    const history = [...conv.messages].reverse().map((m) => ({ role: m.role, content: m.content }));
    await prisma.aIMessage.create({ data: { conversationId: conv.id, role: "user", content: cleanMessage } });

    const aiResponse = (await askProfessorAI(cleanMessage, { studentName: user.name, currentMastery: averageMastery, weakPoints, recentErrors }, history)).trim();
    if (!aiResponse) return NextResponse.json({ error: "O Professor IA não retornou uma resposta." }, { status: 502 });

    const assistantMessage = await prisma.aIMessage.create({ data: { conversationId: conv.id, role: "assistant", content: aiResponse } });
    return NextResponse.json({ conversationId: conv.id, response: aiResponse, messageId: assistantMessage.id });
  } catch (error) {
    console.error("Erro no chat do Professor IA:", error);
    return NextResponse.json({ error: "Erro ao se comunicar com o Professor IA. Tente novamente." }, { status: 500 });
  }
}
