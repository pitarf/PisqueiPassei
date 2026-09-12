import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { evaluateSimulation } from "@/lib/exam";

const EXAM_TOTAL = 60;
const PORT_TOTAL = 10;
const MATH_TOTAL = 10;
const SPECIFIC_TOTAL = 40;
const EXAM_SECONDS = 4 * 60 * 60;

async function loadExamQuestions() {
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
  return { questions: [...portQuestions, ...mathQuestions, ...specificQuestions], distribution: { portuguese: portQuestions.length, math: mathQuestions.length, specific: specificQuestions.length } };
}

export async function GET() {
  try {
    const { questions, distribution } = await loadExamQuestions();
    return NextResponse.json({ total: questions.length, questions, distribution });
  } catch (error) {
    console.error("Erro ao carregar simulado:", error);
    return NextResponse.json({ error: "Erro ao gerar questões para o simulado." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { title = "Simulado Transpetro 2026.3", durationSeconds, answers, questionIds } = await req.json();
    const duration = Number(durationSeconds);
    if (!Number.isFinite(duration) || duration < 0 || duration > EXAM_SECONDS) return NextResponse.json({ error: "Tempo de prova inválido." }, { status: 400 });
    if (!answers || typeof answers !== "object" || Array.isArray(answers)) return NextResponse.json({ error: "Folha de respostas inválida." }, { status: 400 });
    if (!Array.isArray(questionIds) || questionIds.length !== EXAM_TOTAL || new Set(questionIds).size !== EXAM_TOTAL) {
      return NextResponse.json({ error: "O simulado precisa conter exatamente 60 questões." }, { status: 400 });
    }

    const user = await prisma.user.findFirst({ where: { email: "rafael@estudos.transpetro" } });
    if (!user) return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });

    const questions = await prisma.question.findMany({
      where: { id: { in: questionIds } },
      include: { topic: { include: { subject: true } } },
    });
    if (questions.length !== EXAM_TOTAL) return NextResponse.json({ error: "As questões enviadas não formam um simulado válido de 60 itens." }, { status: 400 });

    const questionMap = new Map(questions.map((q) => [q.id, q]));
    const orderedQuestions = questionIds.map((id) => questionMap.get(id)!);
    const distribution = {
      portuguese: orderedQuestions.filter((q) => q.topic.subject.name === "Língua Portuguesa").length,
      math: orderedQuestions.filter((q) => q.topic.subject.name === "Matemática").length,
      specific: orderedQuestions.filter((q) => !["Língua Portuguesa", "Matemática"].includes(q.topic.subject.name)).length,
    };
    if (distribution.portuguese !== PORT_TOTAL || distribution.math !== MATH_TOTAL || distribution.specific !== SPECIFIC_TOTAL) {
      return NextResponse.json({ error: "A distribuição do simulado deve ser 10 Português, 10 Matemática e 40 Específicas." }, { status: 400 });
    }

    let portCorrect = 0;
    let mathCorrect = 0;
    let specificCorrect = 0;
    const perQuestionTime = Math.round(duration / EXAM_TOTAL);
    const attemptsToCreate = orderedQuestions.map((q) => {
      const chosen = typeof answers[q.id] === "string" && /^[A-E]$/.test(answers[q.id]) ? answers[q.id] : "";
      const isCorrect = chosen !== "" && chosen === q.correctOption;
      if (isCorrect) {
        if (q.topic.subject.name === "Língua Portuguesa") portCorrect++;
        else if (q.topic.subject.name === "Matemática") mathCorrect++;
        else specificCorrect++;
      }
      return { userId: user.id, questionId: q.id, chosenOption: chosen, isCorrect, timeSpentSeconds: perQuestionTime };
    });

    const diagnostic = evaluateSimulation({ portugueseCorrect: portCorrect, mathCorrect, specificCorrect, targetScore: user.targetScore || 47 });
    const savedSimulation = await prisma.$transaction(async (tx) => {
      const sim = await tx.simulation.create({
        data: {
          userId: user.id, title, score: diagnostic.totalScore, totalQuestions: EXAM_TOTAL,
          correctAnswers: diagnostic.totalScore, durationSeconds: Math.round(duration),
          detailsJson: { ...diagnostic, distribution, submittedQuestions: EXAM_TOTAL, unansweredQuestions: EXAM_TOTAL - Object.keys(answers).filter((id) => questionMap.has(id)).length } as any,
        },
      });
      await tx.questionAttempt.createMany({ data: attemptsToCreate.map((att) => ({ ...att, simulationId: sim.id })) });

      const topicCounts = new Map<string, { total: number; correct: number }>();
      for (const attempt of attemptsToCreate) {
        const current = topicCounts.get(questions.find((q) => q.id === attempt.questionId)!.topicId) || { total: 0, correct: 0 };
        current.total++;
        if (attempt.isCorrect) current.correct++;
        topicCounts.set(attempt.questionId ? questions.find((q) => q.id === attempt.questionId)!.topicId : "", current);
      }
      for (const [topicId, counts] of topicCounts) {
        const progress = await tx.userTopicProgress.findUnique({ where: { userId_topicId: { userId: user.id, topicId } } });
        const total = (progress?.totalQuestions || 0) + counts.total;
        const correct = (progress?.correctAnswers || 0) + counts.correct;
        const mastery = Math.round((correct / total) * 100);
        await tx.userTopicProgress.upsert({
          where: { userId_topicId: { userId: user.id, topicId } },
          update: { totalQuestions: total, correctAnswers: correct, masteryScore: mastery, status: mastery >= 85 ? "DOMINADO" : "EM_ESTUDO", lastStudiedAt: new Date() },
          create: { userId: user.id, topicId, totalQuestions: counts.total, correctAnswers: counts.correct, masteryScore: mastery, status: "EM_ESTUDO", lastStudiedAt: new Date() },
        });
      }
      await tx.user.update({ where: { id: user.id }, data: { xp: { increment: 150 + diagnostic.totalScore * 5 }, lastStudyDate: new Date() } });
      return sim;
    });

    return NextResponse.json({ success: true, simulation: savedSimulation, diagnostic });
  } catch (error) {
    console.error("Erro ao salvar simulado:", error);
    return NextResponse.json({ error: "Falha ao registrar simulado no banco de dados." }, { status: 500 });
  }
}
