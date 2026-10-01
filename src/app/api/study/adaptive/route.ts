/**
 * Rota de Diagnóstico Adaptativo de Estudo
 * TRANSPETRO STUDY 2026.3 • Ênfase 18: Suprimento de Bens e Serviços
 *
 * Fornece métricas de domínio bayesiano por tópico, prioridades estatísticas,
 * panorama das 940 questões e prévia da sessão "ESTUDAR AGORA".
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  evaluateTopicDiagnostic,
  buildStudyNowSession,
  calculateBankOverview,
  type AttemptRecord,
  type QuestionSummary,
} from "@/lib/adaptive-engine";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await prisma.user.findFirst({
      where: { email: "rafael@estudos.transpetro" },
      include: {
        progress: true,
        attempts: {
          include: {
            question: {
              select: {
                topicId: true,
                difficulty: true,
                questionType: true,
                cognitiveLevel: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    }

    // Carrega todos os 47 tópicos oficiais com suas disciplinas
    const topics = await prisma.topic.findMany({
      include: {
        subject: true,
        questions: {
          select: {
            id: true,
            topicId: true,
            statement: true,
            statementHash: true,
            difficulty: true,
            questionType: true,
            cognitiveLevel: true,
          },
        },
      },
      orderBy: [{ subject: { order: "asc" } }, { order: "asc" }],
    });

    // Mapeia tentativas do usuário no formato de AttemptRecord
    const userAttempts: AttemptRecord[] = user.attempts.map((att) => ({
      id: att.id,
      questionId: att.questionId,
      topicId: att.question.topicId,
      isCorrect: att.isCorrect,
      chosenOption: att.chosenOption,
      timeSpentSeconds: att.timeSpentSeconds,
      createdAt: att.createdAt,
      difficulty: (att.question.difficulty as any) || "MEDIA",
      questionType: att.question.questionType,
      cognitiveLevel: att.question.cognitiveLevel,
    }));

    // Agrupa tentativas por topicId
    const attemptsByTopic = new Map<string, AttemptRecord[]>();
    for (const att of userAttempts) {
      const list = attemptsByTopic.get(att.topicId) || [];
      list.push(att);
      attemptsByTopic.set(att.topicId, list);
    }

    const progressByTopic = new Map(user.progress.map((p) => [p.topicId, p]));
    const questionsByTopic = new Map<string, QuestionSummary[]>();
    const allQuestions: QuestionSummary[] = [];

    for (const t of topics) {
      const qList: QuestionSummary[] = t.questions.map((q) => ({
        id: q.id,
        topicId: q.topicId,
        statement: q.statement,
        statementHash: q.statementHash,
        difficulty: (q.difficulty as any) || "MEDIA",
        questionType: q.questionType,
        cognitiveLevel: q.cognitiveLevel,
        topicTitle: t.title,
        subjectName: t.subject.name,
      }));
      questionsByTopic.set(t.id, qList);
      allQuestions.push(...qList);
    }

    // Calcula diagnóstico para cada um dos 47 tópicos
    const now = new Date();
    const diagnostics = topics.map((t) => {
      const progress = progressByTopic.get(t.id);
      return evaluateTopicDiagnostic({
        topicId: t.id,
        topicTitle: t.title,
        topicCode: t.code,
        subjectName: t.subject.name,
        attempts: attemptsByTopic.get(t.id) || [],
        nextReviewDate: progress?.nextReviewDate,
        lastStudiedAt: progress?.lastStudiedAt,
        now,
      });
    });

    // Calcula visão geral das 940 questões
    const overview = calculateBankOverview({
      totalBankQuestions: allQuestions.length || 940,
      userAttempts,
      topicDiagnostics: diagnostics,
      targetScore: user.targetScore || 47,
    });

    // Monta prévia da bateria "ESTUDAR AGORA"
    const studyNow = buildStudyNowSession({
      diagnostics,
      questionsByTopic,
      userAttempts,
      targetCount: 10,
    });

    // Ordenações de apoio para visualização rápida
    const sortedByPriority = [...diagnostics].sort((a, b) => b.adaptivePriorityScore - a.adaptivePriorityScore);
    const weakPoints = [...diagnostics]
      .filter((d) => d.answeredCount > 0 && d.masteryScore < 70)
      .sort((a, b) => a.masteryScore - b.masteryScore)
      .slice(0, 5);
    const reviewsDue = diagnostics.filter((d) => d.isReviewDue);

    return NextResponse.json({
      generatedAt: now.toISOString(),
      overview,
      diagnostics: sortedByPriority,
      studyNowPreview: studyNow.preview,
      topPriorities: sortedByPriority.slice(0, 4),
      weakPoints,
      reviewsDue,
    });
  } catch (error) {
    console.error("Erro ao gerar diagnóstico adaptativo:", error);
    return NextResponse.json({ error: "Erro ao calcular diagnóstico adaptativo." }, { status: 500 });
  }
}
