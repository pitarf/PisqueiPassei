import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateNextSRS } from "@/lib/srs";
import { updateStudyStreak } from "@/lib/streak";

const RATINGS = ["FACIL", "MEDIO", "DIFICIL"] as const;
const RESPONSE_LIMIT = 50;
const DUPLICATE_WINDOW_MS = 10_000;

export async function GET() {
  try {
    const user = await prisma.user.findFirst({ where: { email: "rafael@estudos.transpetro" } });
    if (!user) return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    const now = new Date();
    const flashcards = await prisma.flashcard.findMany({ include: { topic: { include: { subject: true } }, reviews: { where: { userId: user.id }, orderBy: { reviewedAt: "desc" }, take: 1 } }, orderBy: { createdAt: "desc" } });
    const due = flashcards.filter((card) => !card.reviews[0] || card.reviews[0].nextReviewDate <= now);
    return NextResponse.json({ flashcards: due.slice(0, RESPONSE_LIMIT), dueCount: due.length, totalCount: flashcards.length });
  } catch (error) {
    console.error("Erro ao buscar flashcards:", error);
    return NextResponse.json({ error: "Erro ao carregar flashcards de revisão." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { flashcardId, rating } = await req.json();
    if (typeof flashcardId !== "string" || !flashcardId.trim() || !RATINGS.includes(rating)) return NextResponse.json({ error: "Flashcard e avaliação válidos são obrigatórios." }, { status: 400 });
    const user = await prisma.user.findFirst({ where: { email: "rafael@estudos.transpetro" } });
    if (!user) return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    const flashcard = await prisma.flashcard.findUnique({ where: { id: flashcardId }, select: { id: true } });
    if (!flashcard) return NextResponse.json({ error: "Flashcard não encontrado." }, { status: 404 });

    const now = new Date();
    const result = await prisma.$transaction(async (tx) => {
      const recentReview = await tx.flashcardReview.findFirst({ where: { userId: user.id, flashcardId, rating, reviewedAt: { gte: new Date(now.getTime() - DUPLICATE_WINDOW_MS) } }, orderBy: { reviewedAt: "desc" } });
      if (recentReview) return { review: recentReview, duplicate: true };

      const previous = await tx.flashcardReview.findFirst({ where: { userId: user.id, flashcardId }, orderBy: { reviewedAt: "desc" } });
      const currentInterval = previous?.intervalDays ?? 0;
      const feedback = rating === "DIFICIL" ? "NAO_ENTENDI" : rating === "MEDIO" ? "REVISAR" : "ENTENDI";
      const srs = calculateNextSRS({ currentIntervalDays: currentInterval, currentMasteryScore: 0, feedback });
      const nextReviewDate = new Date(now);
      nextReviewDate.setDate(nextReviewDate.getDate() + srs.nextIntervalDays);

      const review = await tx.flashcardReview.create({ data: { userId: user.id, flashcardId, rating, intervalDays: srs.nextIntervalDays, nextReviewDate } });
      await updateStudyStreak(tx, user.id, now);
      await tx.user.update({ where: { id: user.id }, data: { xp: { increment: 5 }, lastStudyDate: now } });
      return { review, duplicate: false };
    });
    return NextResponse.json({ success: true, duplicate: result.duplicate, review: result.review });
  } catch (error) {
    console.error("Erro ao salvar avaliação de flashcard:", error);
    return NextResponse.json({ error: "Erro ao atualizar revisão espaçada do flashcard." }, { status: 500 });
  }
}
