import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { evaluateSimulation } from "@/lib/exam";

/**
 * Endpoint para obter questões de um simulado completo de 60 questões
 * ou registrar a conclusão e diagnóstico pós-prova.
 */
export async function GET() {
  try {
    // 1. Buscar questões de Língua Portuguesa (10)
    const portSubject = await prisma.subject.findFirst({
      where: { name: "Língua Portuguesa" },
    });
    const portQuestions = await prisma.question.findMany({
      where: portSubject ? { topic: { subjectId: portSubject.id } } : {},
      take: 10,
      include: { topic: { include: { subject: true } } },
    });

    // 2. Buscar questões de Matemática (10)
    const mathSubject = await prisma.subject.findFirst({
      where: { name: "Matemática" },
    });
    const mathQuestions = await prisma.question.findMany({
      where: mathSubject ? { topic: { subjectId: mathSubject.id } } : {},
      take: 10,
      include: { topic: { include: { subject: true } } },
    });

    // 3. Buscar questões de Conhecimentos Específicos (40)
    const specificSubjects = await prisma.subject.findMany({
      where: { category: "ESPECIFICO" },
      select: { id: true },
    });
    const specificSubjectIds = specificSubjects.map((s) => s.id);
    const specificQuestions = await prisma.question.findMany({
      where: { topic: { subjectId: { in: specificSubjectIds } } },
      take: 40,
      include: { topic: { include: { subject: true } } },
    });

    // Agrupar questões
    const allQuestions = [...portQuestions, ...mathQuestions, ...specificQuestions];

    return NextResponse.json({
      total: allQuestions.length,
      questions: allQuestions,
      distribution: {
        portuguese: portQuestions.length,
        math: mathQuestions.length,
        specific: specificQuestions.length,
      },
    });
  } catch (error) {
    console.error("Erro ao carregar simulado:", error);
    return NextResponse.json(
      { error: "Erro ao gerar questões para o simulado oficial." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const {
      title = "Simulado Cesgranrio Oficial",
      durationSeconds,
      answers, // Record<questionId, chosenOption>
    } = await req.json();

    const user = await prisma.user.findFirst({
      where: { email: "rafael@estudos.transpetro" },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    }

    const questionIds = Object.keys(answers || {});
    const questions = await prisma.question.findMany({
      where: { id: { in: questionIds } },
      include: { topic: { include: { subject: true } } },
    });

    let portCorrect = 0;
    let mathCorrect = 0;
    let specificCorrect = 0;
    const attemptsToCreate: any[] = [];

    for (const q of questions) {
      const chosen = answers[q.id];
      const isCorrect = chosen === q.correctOption;

      if (isCorrect) {
        if (q.topic.subject.name === "Língua Portuguesa") portCorrect++;
        else if (q.topic.subject.name === "Matemática") mathCorrect++;
        else specificCorrect++;
      }

      attemptsToCreate.push({
        userId: user.id,
        questionId: q.id,
        chosenOption: chosen,
        isCorrect,
        timeSpentSeconds: Math.round(durationSeconds / (questions.length || 1)),
      });
    }

    // Avaliação conforme regras oficiais da Cesgranrio
    const diagnostic = evaluateSimulation({
      portugueseCorrect: portCorrect,
      mathCorrect,
      specificCorrect,
      targetScore: user.targetScore || 47,
    });

    // Salvar simulado no banco via transação (Diretriz Mestre)
    const savedSimulation = await prisma.$transaction(async (tx) => {
      const sim = await tx.simulation.create({
        data: {
          userId: user.id,
          title,
          score: diagnostic.totalScore,
          totalQuestions: diagnostic.maxScore,
          correctAnswers: diagnostic.totalScore,
          durationSeconds,
          detailsJson: diagnostic as any,
        },
      });

      // Salvar tentativas vinculadas ao simulado
      for (const att of attemptsToCreate) {
        await tx.questionAttempt.create({
          data: {
            ...att,
            simulationId: sim.id,
          },
        });
      }

      // Conceder XP
      await tx.user.update({
        where: { id: user.id },
        data: {
          xp: { increment: 150 + diagnostic.totalScore * 5 },
          lastStudyDate: new Date(),
        },
      });

      return sim;
    });

    return NextResponse.json({
      success: true,
      simulation: savedSimulation,
      diagnostic,
    });
  } catch (error) {
    console.error("Erro ao salvar simulado:", error);
    return NextResponse.json(
      { error: "Falha ao registrar simulado no banco de dados." },
      { status: 500 }
    );
  }
}
