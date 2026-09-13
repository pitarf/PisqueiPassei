import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const USER_EMAIL = "rafael@estudos.transpetro";
const MIN_TARGET_SCORE = 30;
const MAX_TARGET_SCORE = 60;
const MIN_DAILY_HOURS = 1;
const MAX_DAILY_HOURS = 12;

export async function GET() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: USER_EMAIL },
      select: { id: true, name: true, targetScore: true, dailyStudyHours: true },
    });
    if (!user) return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    return NextResponse.json({ user });
  } catch (error) {
    console.error("Erro ao buscar configurações:", error);
    return NextResponse.json({ error: "Erro ao buscar configurações." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const targetProvided = body?.targetScore !== undefined;
    const hoursProvided = body?.dailyStudyHours !== undefined;

    if (!targetProvided && !hoursProvided) {
      return NextResponse.json({ error: "Informe ao menos uma configuração." }, { status: 400 });
    }

    const data: { targetScore?: number; dailyStudyHours?: number } = {};

    if (targetProvided) {
      const targetScore = Number(body.targetScore);
      if (!Number.isInteger(targetScore) || targetScore < MIN_TARGET_SCORE || targetScore > MAX_TARGET_SCORE) {
        return NextResponse.json(
          { error: `A meta de prova deve ser um número inteiro entre ${MIN_TARGET_SCORE} e ${MAX_TARGET_SCORE}.` },
          { status: 400 }
        );
      }
      data.targetScore = targetScore;
    }

    if (hoursProvided) {
      const dailyStudyHours = Number(body.dailyStudyHours);
      if (!Number.isFinite(dailyStudyHours) || dailyStudyHours < MIN_DAILY_HOURS || dailyStudyHours > MAX_DAILY_HOURS) {
        return NextResponse.json(
          { error: `A meta diária deve estar entre ${MIN_DAILY_HOURS} e ${MAX_DAILY_HOURS} horas.` },
          { status: 400 }
        );
      }
      data.dailyStudyHours = Math.round(dailyStudyHours * 2) / 2;
    }

    const user = await prisma.user.findUnique({ where: { email: USER_EMAIL }, select: { id: true } });
    if (!user) return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data,
      select: { id: true, name: true, targetScore: true, dailyStudyHours: true },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Erro ao atualizar configurações:", error);
    return NextResponse.json({ error: "Falha ao salvar configurações." }, { status: 500 });
  }
}
