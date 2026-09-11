import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await prisma.user.findFirst({
      where: { email: "rafael@estudos.transpetro" },
    });

    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar configurações." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { targetScore, dailyStudyHours } = await req.json();

    const user = await prisma.user.findFirst({
      where: { email: "rafael@estudos.transpetro" },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        targetScore: targetScore ? parseInt(targetScore, 10) : user.targetScore,
        dailyStudyHours: dailyStudyHours ? parseFloat(dailyStudyHours) : user.dailyStudyHours,
      },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Erro ao atualizar configurações:", error);
    return NextResponse.json({ error: "Falha ao salvar configurações." }, { status: 500 });
  }
}
