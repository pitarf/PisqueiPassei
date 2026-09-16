import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { evaluateSimulation } from "@/lib/exam";
import { updateStudyStreak } from "@/lib/streak";

const EXAM_TOTAL = 60;
const PORT_TOTAL = 10;
const MATH_TOTAL = 10;
const SPECIFIC_TOTAL = 40;
const EXAM_SECONDS = 4 * 60 * 60;
const DUPLICATE_WINDOW_MS = 15_000;
const MAX_IDEMPOTENCY_KEY_LENGTH = 128;

function shuffle<T>(items: T[]) { const result = [...items]; for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; } return result; }

async function loadExamQuestions() {
  const [portSubject, mathSubject, specificSubjects] = await Promise.all([
    prisma.subject.findFirst({ where: { name: "Língua Portuguesa" } }),
    prisma.subject.findFirst({ where: { name: "Matemática" } }),
    prisma.subject.findMany({ where: { category: "ESPECIFICO" }, select: { id: true } }),
  ]);
  const specificIds = specificSubjects.map((s) => s.id);
  const [portPool, mathPool, specificPool] = await Promise.all([
    portSubject ? prisma.question.findMany({ where: { topic: { subjectId: portSubject.id } }, include: { topic: { include: { subject: true } } } }) : [],
    mathSubject ? prisma.question.findMany({ where: { topic: { subjectId: mathSubject.id } }, include: { topic: { include: { subject: true } } } }) : [],
    prisma.question.findMany({ where: { topic: { subjectId: { in: specificIds } } }, include: { topic: { include: { subject: true } } } }),
  ]);
  const portQuestions = shuffle(portPool).slice(0, PORT_TOTAL);
  const mathQuestions = shuffle(mathPool).slice(0, MATH_TOTAL);
  const specificQuestions = shuffle(specificPool).slice(0, SPECIFIC_TOTAL);
  return { questions: [...portQuestions, ...mathQuestions, ...specificQuestions], distribution: { portuguese: portQuestions.length, math: mathQuestions.length, specific: specificQuestions.length } };
}

export async function GET() {
  try {
    const { questions, distribution } = await loadExamQuestions();
    if (questions.length !== EXAM_TOTAL) return NextResponse.json({ error: "Banco de questões insuficiente para montar o simulado completo.", required: { portuguese: PORT_TOTAL, math: MATH_TOTAL, specific: SPECIFIC_TOTAL }, available: distribution }, { status: 503 });
    return NextResponse.json({ total: questions.length, questions, distribution });
  } catch (error) { console.error("Erro ao carregar simulado:", error); return NextResponse.json({ error: "Erro ao gerar questões para o simulado." }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  try {
    const { title = "Simulado Transpetro 2026.3", durationSeconds, answers, questionIds, questionTimes, idempotencyKey } = await req.json();
    const duration = Number(durationSeconds);
    const key = typeof idempotencyKey === "string" ? idempotencyKey.trim() : "";
    if (!Number.isFinite(duration) || duration < 0 || duration > EXAM_SECONDS) return NextResponse.json({ error: "Tempo de prova inválido." }, { status: 400 });
    if (key.length > MAX_IDEMPOTENCY_KEY_LENGTH) return NextResponse.json({ error: "Chave de idempotência inválida." }, { status: 400 });
    if (!answers || typeof answers !== "object" || Array.isArray(answers)) return NextResponse.json({ error: "Folha de respostas inválida." }, { status: 400 });
    if (!Array.isArray(questionIds) || questionIds.length !== EXAM_TOTAL || new Set(questionIds).size !== EXAM_TOTAL || questionIds.some((id) => typeof id !== "string" || !id)) return NextResponse.json({ error: "O simulado precisa conter exatamente 60 questões válidas." }, { status: 400 });
    if (questionTimes !== undefined && (!questionTimes || typeof questionTimes !== "object" || Array.isArray(questionTimes))) return NextResponse.json({ error: "Tempos das questões inválidos." }, { status: 400 });
    if (questionTimes) for (const [questionId, rawTime] of Object.entries(questionTimes)) if (!questionIds.includes(questionId) || typeof rawTime !== "number" || !Number.isFinite(rawTime) || rawTime < 0 || rawTime > EXAM_SECONDS) return NextResponse.json({ error: "Tempo de uma ou mais questões é inválido." }, { status: 400 });

    const user = await prisma.user.findFirst({ where: { email: "rafael@estudos.transpetro" } });
    if (!user) return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    if (key) {
      const existing = await prisma.simulation.findUnique({ where: { idempotencyKey: key } });
      if (existing) return NextResponse.json({ success: true, duplicate: true, simulation: existing, diagnostic: existing.detailsJson });
    }

    const questions = await prisma.question.findMany({ where: { id: { in: questionIds } }, include: { topic: { include: { subject: true } } } });
    if (questions.length !== EXAM_TOTAL) return NextResponse.json({ error: "As questões enviadas não formam um simulado válido de 60 itens." }, { status: 400 });
    const questionMap = new Map(questions.map((q) => [q.id, q]));
    const orderedQuestions = questionIds.map((id) => questionMap.get(id)!);
    const distribution = { portuguese: orderedQuestions.filter((q) => q.topic.subject.name === "Língua Portuguesa").length, math: orderedQuestions.filter((q) => q.topic.subject.name === "Matemática").length, specific: orderedQuestions.filter((q) => !["Língua Portuguesa", "Matemática"].includes(q.topic.subject.name)).length };
    if (distribution.portuguese !== PORT_TOTAL || distribution.math !== MATH_TOTAL || distribution.specific !== SPECIFIC_TOTAL) return NextResponse.json({ error: "A distribuição do simulado deve ser 10 Português, 10 Matemática e 40 Específicas." }, { status: 400 });

    let portCorrect = 0, mathCorrect = 0, specificCorrect = 0;
    const topicCounts = new Map<string, { total: number; correct: number }>();
    const attemptsToCreate = orderedQuestions.map((q) => {
      const raw = answers[q.id];
      const chosen = typeof raw === "string" && /^[A-E]$/.test(raw) ? raw : "";
      const isCorrect = chosen !== "" && chosen === q.correctOption;
      if (isCorrect) { if (q.topic.subject.name === "Língua Portuguesa") portCorrect++; else if (q.topic.subject.name === "Matemática") mathCorrect++; else specificCorrect++; }
      const current = topicCounts.get(q.topicId) || { total: 0, correct: 0 }; current.total++; if (isCorrect) current.correct++; topicCounts.set(q.topicId, current);
      const rawTime = questionTimes?.[q.id];
      const timeSpentSeconds = typeof rawTime === "number" && Number.isFinite(rawTime) ? Math.max(0, Math.min(EXAM_SECONDS, Math.floor(rawTime))) : 0;
      return { userId: user.id, questionId: q.id, chosenOption: chosen, isCorrect, timeSpentSeconds };
    });
    const diagnostic = evaluateSimulation({ portugueseCorrect: portCorrect, mathCorrect, specificCorrect, targetScore: user.targetScore || 47 });
    const normalizedQuestionIds = [...questionIds].sort();

    try {
      const result = await prisma.$transaction(async (tx) => {
        if (!key) {
          const recentSimulations = await tx.simulation.findMany({ where: { userId: user.id, title, completedAt: { gte: new Date(Date.now() - DUPLICATE_WINDOW_MS) } }, orderBy: { completedAt: "desc" }, take: 5 });
          for (const existing of recentSimulations) {
            const details = existing.detailsJson as { submittedQuestionIds?: unknown };
            if (Array.isArray(details?.submittedQuestionIds)) {
              const existingIds = details.submittedQuestionIds.filter((id): id is string => typeof id === "string").sort();
              if (existingIds.length === EXAM_TOTAL && existingIds.every((id, index) => id === normalizedQuestionIds[index])) return { simulation: existing, duplicate: true };
            }
          }
        }
        const sim = await tx.simulation.create({ data: { userId: user.id, ...(key ? { idempotencyKey: key } : {}), title, score: diagnostic.totalScore, totalQuestions: EXAM_TOTAL, correctAnswers: diagnostic.totalScore, durationSeconds: Math.round(duration), detailsJson: { ...diagnostic, distribution, submittedQuestions: EXAM_TOTAL, submittedQuestionIds: normalizedQuestionIds, unansweredQuestions: attemptsToCreate.filter((a) => !a.chosenOption).length } as any } });
        await tx.questionAttempt.createMany({ data: attemptsToCreate.map((att) => ({ ...att, simulationId: sim.id })) });
        for (const [topicId, counts] of topicCounts) {
          const progress = await tx.userTopicProgress.findUnique({ where: { userId_topicId: { userId: user.id, topicId } } });
          const total = (progress?.totalQuestions || 0) + counts.total;
          const correct = (progress?.correctAnswers || 0) + counts.correct;
          const mastery = Math.round((correct / total) * 100);
          const topicTimeMinutes = attemptsToCreate.filter((attempt) => questionMap.get(attempt.questionId)?.topicId === topicId).reduce((sum, attempt) => sum + Math.round(attempt.timeSpentSeconds / 60), 0);
          await tx.userTopicProgress.upsert({ where: { userId_topicId: { userId: user.id, topicId } }, update: { totalQuestions: total, correctAnswers: correct, masteryScore: mastery, status: mastery >= 85 ? "DOMINADO" : "EM_ESTUDO", lastStudiedAt: new Date(), ...(topicTimeMinutes > 0 ? { totalTimeMinutes: { increment: topicTimeMinutes } } : {}) }, create: { userId: user.id, topicId, totalQuestions: counts.total, correctAnswers: counts.correct, masteryScore: mastery, status: "EM_ESTUDO", lastStudiedAt: new Date(), totalTimeMinutes: topicTimeMinutes } });
        }
        await tx.studySession.create({ data: { userId: user.id, topicId: null, durationMinutes: Math.max(1, Math.round(duration / 60)), sessionType: "SIMULADO", xpEarned: 150 + diagnostic.totalScore * 5 } });
        await updateStudyStreak(tx, user.id, new Date());
        await tx.user.update({ where: { id: user.id }, data: { xp: { increment: 150 + diagnostic.totalScore * 5 }, lastStudyDate: new Date() } });
        return { simulation: sim, duplicate: false };
      });
      return NextResponse.json({ success: true, duplicate: result.duplicate, simulation: result.simulation, diagnostic });
    } catch (error) {
      const code = typeof error === "object" && error !== null && "code" in error ? String((error as { code?: unknown }).code) : "";
      if (key && code === "P2002") {
        const existing = await prisma.simulation.findUnique({ where: { idempotencyKey: key } });
        if (existing && existing.userId === user.id) return NextResponse.json({ success: true, duplicate: true, simulation: existing, diagnostic: existing.detailsJson });
      }
      throw error;
    }
  } catch (error) { console.error("Erro ao salvar simulado:", error); return NextResponse.json({ error: "Falha ao registrar simulado no banco de dados." }, { status: 500 }); }
}
