import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Endpoint para listar flashcards para revisão ou registrar avaliação (Fácil, Médio, Difícil)
 */
export async function GET(req: NextRequest) {
  try {
    const user = await prisma.user.findFirst({
      where: { email: "rafael@estudos.transpetro" },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    }

    // Buscar todos os flashcards ou cards vinculados aos tópicos
    const flashcards = await prisma.flashcard.findMany({
      include: {
        topic: { include: { subject: true } },
        reviews: {
          where: { userId: user.id },
          orderBy: { reviewedAt: "desc" },
          take: 1,
        },
      },
      take: 50,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ flashcards });
  } catch (error) {
    console.error("Erro ao buscar flashcards:", error);
    return NextResponse.json(
      { error: "Erro ao carregar flashcards de revisão." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { flashcardId, rating } = await req.json();

    if (!flashcardId || !rating) {
      return NextResponse.json(
        { error: "Parâmetros 'flashcardId' e 'rating' são obrigatórios." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: { email: "rafael@estudos.transpetro" },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    }

    // Calcular próximo intervalo
    let intervalDays = 1;
    if (rating === "FACIL") {
      intervalDays = 7;
    } else if (rating === "MEDIO") {
      intervalDays = 3;
    } else {
      intervalDays = 1; // DIFICIL volta para amanhã
    }

    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + intervalDays);

    // Salvar avaliação no banco
    const review = await prisma.flashcardReview.create({
      data: {
        userId: user.id,
        flashcardId,
        rating,
        intervalDays,
        nextReviewDate,
      },
    });

    // Conceder XP
    await prisma.user.update({
      where: { id: user.id },
      data: {
        xp: { increment: 5 },
        lastStudyDate: new Date(),
      },
    });

    return NextResponse.json({ success: true, review });
  } catch (error) {
    console.error("Erro ao salvar avaliação de flashcard:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar revisão espaçada do flashcard." },
      { status: 500 }
    );
  }
}
