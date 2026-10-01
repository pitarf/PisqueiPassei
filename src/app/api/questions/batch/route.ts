/**
 * Rota de Carregamento em Lote de Questões com Seleção Adaptativa
 * TRANSPETRO STUDY 2026.3 • Ênfase 18: Suprimento de Bens e Serviços
 *
 * Utiliza o acervo mestre de 940 questões ativas (20 por tópico em 47/47 tópicos).
 * Não gera novas questões via IA; aplica seleção adaptativa e repetição espaçada.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  evaluateTopicDiagnostic,
  buildStudyNowSession,
  buildErrorReviewSession,
  createSeededRng,
  seededShuffle,
  type AttemptRecord,
  type QuestionSummary,
} from "@/lib/adaptive-engine";
import { VALID_DIFFICULTIES } from "@/lib/question-validator";

const VALID_MODES = new Set(["normal", "erros", "adaptativo", "estudar_agora"]);

export async function POST(req: NextRequest) {
  try {
    const {
      subjectId,
      topicId,
      mode = "normal",
      count = 10,
      difficulty,
      seed,
    } = await req.json();

    if (typeof mode !== "string" || !VALID_MODES.has(mode)) {
      return NextResponse.json({ error: "Modo de questões inválido." }, { status: 400 });
    }

    const rng = seed !== undefined ? createSeededRng(seed) : Math.random;

    const requestedDifficulty = difficulty ? String(difficulty).toUpperCase() : null;
    const safeDifficulty = requestedDifficulty && VALID_DIFFICULTIES.has(requestedDifficulty) ? requestedDifficulty : null;
    const parsedCount = Number(count);
    const safeCount = Number.isFinite(parsedCount) ? Math.min(Math.max(Math.floor(parsedCount), 1), 60) : 10;

    const user = await prisma.user.findFirst({
      where: { email: "rafael@estudos.transpetro" },
      include: {
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
        progress: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
    }

    // Mapeia tentativas do usuário
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

    // 1. MODO: ESTUDAR AGORA / ADAPTATIVO
    if (mode === "adaptativo" || mode === "estudar_agora") {
      const allTopics = await prisma.topic.findMany({
        include: {
          subject: true,
          questions: true,
        },
        orderBy: [{ subject: { order: "asc" } }, { order: "asc" }],
      });

      const attemptsByTopic = new Map<string, AttemptRecord[]>();
      for (const a of userAttempts) {
        const list = attemptsByTopic.get(a.topicId) || [];
        list.push(a);
        attemptsByTopic.set(a.topicId, list);
      }

      const progressByTopic = new Map(user.progress.map((p) => [p.topicId, p]));
      const questionsByTopic = new Map<string, QuestionSummary[]>();
      const fullQuestionMap = new Map<string, any>();

      for (const t of allTopics) {
        const qSummaries: QuestionSummary[] = t.questions.map((q) => {
          fullQuestionMap.set(q.id, { ...q, topic: { id: t.id, title: t.title, code: t.code, subject: t.subject } });
          return {
            id: q.id,
            topicId: q.topicId,
            statement: q.statement,
            statementHash: q.statementHash,
            difficulty: (q.difficulty as any) || "MEDIA",
            questionType: q.questionType,
            cognitiveLevel: q.cognitiveLevel,
            topicTitle: t.title,
            subjectName: t.subject.name,
          };
        });
        questionsByTopic.set(t.id, qSummaries);
      }

      const diagnostics = allTopics.map((t) => {
        const progress = progressByTopic.get(t.id);
        return evaluateTopicDiagnostic({
          topicId: t.id,
          topicTitle: t.title,
          topicCode: t.code,
          subjectName: t.subject.name,
          attempts: attemptsByTopic.get(t.id) || [],
          nextReviewDate: progress?.nextReviewDate,
          lastStudiedAt: progress?.lastStudiedAt,
        });
      });

      const session = buildStudyNowSession({
        diagnostics,
        questionsByTopic,
        userAttempts,
        targetCount: safeCount,
        seed,
      });

      const hydratedQuestions = session.questions.map((q) => fullQuestionMap.get(q.id)).filter(Boolean);
      return NextResponse.json({
        questions: hydratedQuestions,
        preview: session.preview,
        total: hydratedQuestions.length,
      });
    }

    // 2. MODO: REVISAR ERROS
    if (mode === "erros") {
      const allQuestionsRaw = await prisma.question.findMany({
        include: { topic: { include: { subject: true } } },
      });

      const questionSummaries: QuestionSummary[] = allQuestionsRaw.map((q) => ({
        id: q.id,
        topicId: q.topicId,
        statement: q.statement,
        statementHash: q.statementHash,
        difficulty: (q.difficulty as any) || "MEDIA",
        questionType: q.questionType,
        cognitiveLevel: q.cognitiveLevel,
        topicTitle: q.topic.title,
        subjectName: q.topic.subject.name,
      }));

      const errorSession = buildErrorReviewSession({
        allQuestions: questionSummaries,
        userAttempts,
        targetCount: safeCount,
        seed,
      });

      // Se o aluno ainda não possui erros suficientes, complementa com itens de menor domínio
      let finalQuestions = errorSession.questions;
      if (finalQuestions.length < safeCount) {
        const existingIds = new Set(finalQuestions.map((q) => q.id));
        const remainingNeeded = safeCount - finalQuestions.length;
        const fallbackPool = seededShuffle(questionSummaries.filter((q) => !existingIds.has(q.id)), rng);
        finalQuestions = [...finalQuestions, ...fallbackPool.slice(0, remainingNeeded)];
      }

      const qMap = new Map(allQuestionsRaw.map((q) => [q.id, q]));
      const hydrated = finalQuestions.map((q) => qMap.get(q.id)).filter(Boolean);

      return NextResponse.json({
        questions: hydrated,
        preview: errorSession.preview,
        total: hydrated.length,
      });
    }

    // 3. MODO: TREINO POR TÓPICO OU DISCIPLINA
    let whereClause: any = {};
    if (topicId) {
      whereClause = { topicId };
    } else if (subjectId) {
      whereClause = { topic: { subjectId } };
    }

    if (safeDifficulty) {
      whereClause.difficulty = safeDifficulty;
    }

    const candidateQuestions = await prisma.question.findMany({
      where: whereClause,
      include: { topic: { include: { subject: true } } },
    });

    if (candidateQuestions.length === 0) {
      return NextResponse.json({ questions: [], total: 0 });
    }

    // Identifica quais questões o aluno já respondeu para dar prioridade às NÃO respondidas
    const answeredIds = new Set(userAttempts.map((a) => a.questionId));
    const unseenQuestions = candidateQuestions.filter((q) => !answeredIds.has(q.id));
    const seenQuestions = candidateQuestions.filter((q) => answeredIds.has(q.id));

    // Ordena: primeiro as inéditas para o aluno, depois as já vistas embaralhadas de forma determinística
    const prioritizedPool = [...seededShuffle(unseenQuestions, rng), ...seededShuffle(seenQuestions, rng)];
    const selectedBatch = prioritizedPool.slice(0, safeCount);

    return NextResponse.json({
      questions: selectedBatch,
      total: selectedBatch.length,
      unseenCount: unseenQuestions.length,
    });
  } catch (error) {
    console.error("Erro na rota de lote de questões adaptativas:", error);
    return NextResponse.json({ error: "Falha interna ao processar lote de questões." }, { status: 500 });
  }
}
