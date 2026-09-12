import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const RATINGS = ["FACIL", "MEDIO", "DIFICIL"] as const;

export async function GET() {
  try {
    const user = await prisma.user.findFirst({ where: { email: "rafael@estudos.transpetro" } });
    if (!user) return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });

    const flashcards = await prisma.flashcard.findMany({
      include: { topic: { include: { subject: true } }, reviews: { where: { userId: user.id }, orderBy: { reviewedAt: "desc" }, take: 1 } },
      take: 50,
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ flashcards });
  } catch (error) {
    console.error("Erro ao buscar flashcards:", error);
    return NextResponse.json({ error: "Erro ao carregar flashcards de revisão." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { flashcardId, rating } = await req.json();
    if (typeof flashcardId !== "string" || !flashcardId || !RATINGS.includes(rating)) {
      return NextResponse.json({ error: "Flashcard e avaliação válidos são obrigatórios." }, { status: 400 });
    }

    const user = await prisma.user.findFirst({ where: { email: "rafael@estudos.transpetro" } });
    if (!user) return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    const flashcard = await prisma.flashcard.findUnique({ where: { id: flashcardId } });
    if (!flashcard) return NextResponse.json({ error: "Flashcard não encontrado." }, { status: 404 });

    const intervalDays = rating === "FACIL" ? 7 : rating === "MEDIO" ? 3 : 1;
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + intervalDays);

    const review = await prisma.$transaction(async (tx) => {
      const created = await tx.flashcardReview.create({ data: { userId: user.id, flashcardId, rating, intervalDays, nextReviewDate } });
      await tx.user.update({ where: { id: user.id }, data: { xp: { increment: 5 }, lastStudyDate: new Date() } });
      return created;
    });
    return NextResponse.json({ success: true, review });
  } catch (error) {
    console.error("Erro ao salvar avaliação de flashcard:", error);
    return NextResponse.json({ error: "Erro ao atualizar revisão espaçada do flashcard." }, { status: 500 });
  }
}
