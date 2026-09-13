import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const MIN_TARGET_SCORE = 30;
const MAX_TARGET_SCORE = 60;
const MIN_DAILY_HOURS = 1;
const MAX_DAILY_HOURS = 12;

export async function GET() {
  try {
    const user = await prisma.user.findFirst({
      where: { email: "rafael@estudos.transpetro" },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Erro ao buscar configurações:", error);
    return NextResponse.json({ error: "Erro ao buscar configurações." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawTargetScore = body?.targetScore;
    const rawDailyHours = body?.dailyStudyHours;

    const targetScore = Number(rawTargetScore);
    const dailyStudyHours = Number(rawDailyHours);

    if (!Number.isInteger(targetScore) || targetScore < MIN_TARGET_SCORE || targetScore > MAX_TARGET_SCORE) {
      return NextResponse.json(
        { error: `A meta de prova deve ser um número inteiro entre ${MIN_TARGET_SCORE} e ${MAX_TARGET_SCORE}.` },
        { status: 400 }
      );
    }

    if (!Number.isFinite(dailyStudyHours) || dailyStudyHours < MIN_DAILY_HOURS || dailyStudyHours > MAX_DAILY_HOURS) {
      return NextResponse.json(
        { error: `A meta diária deve estar entre ${MIN_DAILY_HOURS} e ${MAX_DAILY_HOURS} horas.` },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: { email: "rafael@estudos.transpetro" },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { targetScore, dailyStudyHours },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Erro ao atualizar configurações:", error);
    return NextResponse.json({ error: "Falha ao salvar configurações." }, { status: 500 });
  }
}
