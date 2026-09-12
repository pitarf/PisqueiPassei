import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { evaluateSimulation } from "@/lib/exam";

const EXAM_TOTAL = 60;
const PORT_TOTAL = 10;
const MATH_TOTAL = 10;
const SPECIFIC_TOTAL = 40;

export async function GET() {
  try {
    const [portSubject, mathSubject, specificSubjects] = await Promise.all([
      prisma.subject.findFirst({ where: { name: "Língua Portuguesa" } }),
      prisma.subject.findFirst({ where: { name: "Matemática" } }),
      prisma.subject.findMany({ where: { category: "ESPECIFICO" }, select: { id: true } }),
    ]);
    const specificIds = specificSubjects.map((s) => s.id);
    const [portQuestions, mathQuestions, specificQuestions] = await Promise.all([
      portSubject ? prisma.question.findMany({ where: { topic: { subjectId: portSubject.id } }, take: PORT_TOTAL, orderBy: { createdAt: "desc" }, include: { topic: { include: { subject: true } } } }) : [],
      mathSubject ? prisma.question.findMany({ where: { topic: { subjectId: mathSubject.id } }, take: MATH_TOTAL, orderBy: { createdAt: "desc" }, include: { topic: { include: { subject: true } } } }) : [],
      prisma.question.findMany({ where: { topic: { subjectId: { in: specificIds } } }, take: SPECIFIC_TOTAL, orderBy: { createdAt: "desc" }, include: { topic: { include: { subject: true } } } }),
    ]);
    const questions = [...portQuestions, ...mathQuestions, ...specificQuestions];
    return NextResponse.json({ total: questions.length, questions, distribution: { portuguese: portQuestions.length, math: mathQuestions.length, specific: specificQuestions.length } });
  } catch (error) {
    console.error("Erro ao carregar simulado:", error);
    return NextResponse.json({ error: "Erro ao gerar questões para o simulado." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { title = "Simulado Transpetro 2026.3", durationSeconds, answers } = await req.json();
    const duration = Number(durationSeconds);
    if (!Number.isFinite(duration) || duration < 0 || duration > 4 * 60 * 60) {
      return NextResponse.json({ error: "Tempo de prova inválido." }, { status: 400 });
    }
    if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
      return NextResponse.json({ error: "Folha de respostas inválida." }, { status: 400 });
    }

    const user = await prisma.user.findFirst({ where: { email: "rafael@estudos.transpetro" } });
    if (!user) return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });

    const questionIds = Object.keys(answers);
    if (questionIds.length > EXAM_TOTAL) {
      return NextResponse.json({ error: "A folha de respostas contém mais de 60 questões." }, { status: 400 });
    }

    const questions = await prisma.question.findMany({
      where: { id: { in: questionIds } },
      include: { topic: { include: { subject: true } } },
    });
    if (questions.length !== questionIds.length) {
      return NextResponse.json({ error: "Uma ou mais questões do simulado não foram encontradas." }, { status: 400 });
    }

    let portCorrect = 0;
    let mathCorrect = 0;
    let specificCorrect = 0;
    const attemptsToCreate = questions.map((q) => {
      const chosen = typeof answers[q.id] === "string" ? answers[q.id] : "";
      const isCorrect = chosen !== "" && chosen === q.correctOption;
      if (isCorrect) {
        if (q.topic.subject.name === "Língua Portuguesa") portCorrect++;
        else if (q.topic.subject.name === "Matemática") mathCorrect++;
        else specificCorrect++;
      }
      return { userId: user.id, questionId: q.id, chosenOption: chosen, isCorrect, timeSpentSeconds: Math.round(duration / EXAM_TOTAL) };
    });

    const diagnostic = evaluateSimulation({ portugueseCorrect: portCorrect, mathCorrect, specificCorrect, targetScore: user.targetScore || 47 });
    const savedSimulation = await prisma.$transaction(async (tx) => {
      const sim = await tx.simulation.create({
        data: { userId: user.id, title, score: diagnostic.totalScore, totalQuestions: EXAM_TOTAL, correctAnswers: diagnostic.totalScore, durationSeconds: Math.round(duration), detailsJson: { ...diagnostic, submittedQuestions: questions.length, unansweredQuestions: EXAM_TOTAL - questions.length } as any },
      });
      if (attemptsToCreate.length) await tx.questionAttempt.createMany({ data: attemptsToCreate.map((att) => ({ ...att, simulationId: sim.id })) });
      await tx.user.update({ where: { id: user.id }, data: { xp: { increment: 150 + diagnostic.totalScore * 5 }, lastStudyDate: new Date() } });
      return sim;
    });

    return NextResponse.json({ success: true, simulation: savedSimulation, diagnostic });
  } catch (error) {
    console.error("Erro ao salvar simulado:", error);
    return NextResponse.json({ error: "Falha ao registrar simulado no banco de dados." }, { status: 500 });
  }
}
