import React from "react";
import { prisma } from "@/lib/prisma";
import { QuestionSession } from "@/components/questions/QuestionSession";
import Link from "next/link";
import { AlertTriangle, Sparkles, Filter, Info } from "lucide-react";
import { rankStudyPriorities, getStudyHref } from "@/lib/study-priority";

interface QuestoesPageProps { searchParams: Promise<{ modo?: string; topicId?: string; subjectId?: string; count?: string; difficulty?: string; origin?: string; }>; }
export const revalidate = 0;

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default async function QuestoesPage({ searchParams }: QuestoesPageProps) {
  const { modo, topicId, subjectId, count, difficulty, origin } = await searchParams;
  const countNum = Math.max(1, Math.min(60, parseInt(count || "10", 10) || 10));
  const isTrainingActive = Boolean(modo || topicId || subjectId || difficulty || origin);
  const subjects = await prisma.subject.findMany({ include: { topics: { select: { id: true, title: true, code: true } } }, orderBy: { order: "asc" } });
  let questions: any[] = [];

  if (isTrainingActive) {
    if (modo === "estudar_agora") {
      const user = await prisma.user.findFirst({
        where: { email: "rafael@estudos.transpetro" },
        include: {
          progress: true,
          attempts: {
            include: { question: { select: { topicId: true, difficulty: true, questionType: true, cognitiveLevel: true } } },
          },
        },
      });
      if (user) {
        const allTopics = await prisma.topic.findMany({
          include: { subject: true, questions: { include: { topic: { include: { subject: true } } } } },
          orderBy: [{ subject: { order: "asc" } }, { order: "asc" }],
        });
        const { buildStudyNowSession, evaluateTopicDiagnostic } = await import("@/lib/adaptive-engine");
        const userAttempts = user.attempts.map((att) => ({
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
        const attemptsByTopic = new Map<string, typeof userAttempts>();
        for (const a of userAttempts) {
          const list = attemptsByTopic.get(a.topicId) || [];
          list.push(a);
          attemptsByTopic.set(a.topicId, list);
        }
        const progressByTopic = new Map(user.progress.map((p) => [p.topicId, p]));
        const questionsByTopic = new Map<string, any[]>();
        const fullQuestionMap = new Map<string, any>();
        for (const t of allTopics) {
          const qSummaries = t.questions.map((q) => {
            fullQuestionMap.set(q.id, q);
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
          targetCount: countNum,
        });
        questions = session.questions.map((q) => fullQuestionMap.get(q.id)).filter(Boolean);
      }
    } else if (modo === "erros") {
      const user = await prisma.user.findFirst({
        where: { email: "rafael@estudos.transpetro" },
        include: {
          attempts: {
            include: { question: { select: { topicId: true, difficulty: true, questionType: true, cognitiveLevel: true } } },
          },
        },
      });
      if (user) {
        const allQuestionsRaw = await prisma.question.findMany({
          include: { topic: { include: { subject: true } } },
        });
        const { buildErrorReviewSession } = await import("@/lib/adaptive-engine");
        const userAttempts = user.attempts.map((att) => ({
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
        const allSummaries = allQuestionsRaw.map((q) => ({
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
        const qMap = new Map(allQuestionsRaw.map((q) => [q.id, q]));
        const session = buildErrorReviewSession({
          allQuestions: allSummaries,
          userAttempts,
          targetCount: countNum,
        });
        questions = session.questions.map((q) => qMap.get(q.id)).filter(Boolean);
      }
      if (questions.length === 0) {
        // Fallback se não houver erros na fila SRS
        const user = await prisma.user.findFirst({ where: { email: "rafael@estudos.transpetro" }, select: { id: true } });
        const weakTopics = user ? await prisma.userTopicProgress.findMany({ where: { userId: user.id, masteryScore: { lt: 70 } }, orderBy: { masteryScore: "asc" }, take: 10, select: { topicId: true } }) : [];
        const topicIds = weakTopics.map((item) => item.topicId);
        if (topicIds.length > 0) {
          const weakPool = await prisma.question.findMany({ where: { topicId: { in: topicIds }, ...(difficulty ? { difficulty } : {}), ...(origin ? { origin } : {}) }, include: { topic: { include: { subject: true } } } });
          questions = shuffle(weakPool).slice(0, countNum);
        }
      }
    } else if (modo === "geral" && !topicId && !subjectId) {
      const generalCount = Math.max(1, Math.round(countNum / 3));
      const specificCount = countNum - generalCount;
      const [generalPool, specificPool] = await Promise.all([
        prisma.question.findMany({ where: { ...(difficulty ? { difficulty } : {}), ...(origin ? { origin } : {}), topic: { subject: { category: { in: ["GERAL", "BASICO"] } } } }, include: { topic: { include: { subject: true } } } }),
        prisma.question.findMany({ where: { ...(difficulty ? { difficulty } : {}), ...(origin ? { origin } : {}), topic: { subject: { category: "ESPECIFICO" } } }, include: { topic: { include: { subject: true } } } }),
      ]);
      const generalQuestions = shuffle(generalPool).slice(0, generalCount);
      const specificQuestions = shuffle(specificPool).slice(0, specificCount);
      const mixed: any[] = [];
      const maxLength = Math.max(generalQuestions.length, specificQuestions.length);
      for (let i = 0; i < maxLength; i += 1) {
        if (generalQuestions[i]) mixed.push(generalQuestions[i]);
        if (specificQuestions[i]) mixed.push(specificQuestions[i]);
      }
      questions = mixed;
    } else {
      let whereClause: any = {};
      if (topicId) whereClause = { topicId, ...(difficulty ? { difficulty } : {}), ...(origin ? { origin } : {}) };
      else if (subjectId) whereClause = { topic: { subjectId }, ...(difficulty ? { difficulty } : {}), ...(origin ? { origin } : {}) };
      const pool = await prisma.question.findMany({ where: whereClause, include: { topic: { include: { subject: true } } } });
      questions = shuffle(pool).slice(0, countNum);
    }
  }

  const isShortBattery = isTrainingActive && questions.length > 0 && questions.length < countNum;

  return <div className="space-y-6 pb-20 sm:pb-6">
    {!isTrainingActive || questions.length === 0 ? <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-md">
        <span className="px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-md">Padrão Cesgranrio</span>
        <div className="flex items-center justify-between gap-3"><div><h1 className="text-xl sm:text-2xl font-black text-white mt-1">Prática de Questões</h1></div><Link href="/questoes/historico" className="text-xs font-semibold text-sky-300 border border-sky-500/30 bg-sky-500/10 px-3 py-2 rounded-xl">Ver histórico</Link></div>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">Exercite os conteúdos com questões de múltipla escolha (A a E). As questões criadas pela plataforma para complementar o edital trazem indicação clara de questão inédita.</p>
        <div className="flex flex-wrap gap-2 mt-4">
          <Link href="/questoes" className="px-2.5 py-1.5 rounded-lg border border-slate-700 text-[11px] text-slate-400">Todas</Link>
          {["FACIL","MEDIA","DIFICIL"].map((d) => <Link key={d} href={`/questoes?difficulty=${d}&count=10`} className="px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-[11px] text-slate-300">{d === "MEDIA" ? "Média" : d === "FACIL" ? "Fácil" : "Difícil"}</Link>)}
          <Link href="/questoes?origin=OFICIAL_CESGRANRIO&count=10" className="px-2.5 py-1.5 rounded-lg border border-sky-500/30 bg-sky-500/10 text-[11px] text-sky-300">Cesgranrio oficial</Link>
          <Link href="/questoes?origin=INEDITA_IA&count=10" className="px-2.5 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-[11px] text-emerald-300">Inéditas IA</Link>
        </div>
      </div>
      {!isTrainingActive && <PriorityStudyCard />}
      {isTrainingActive && <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex gap-3">
        <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-amber-300">Nenhuma questão encontrada para os filtros selecionados.</p>
          <p className="text-xs text-amber-200/70 mt-1">Experimente escolher outro tema, disciplina ou alternar o modo de treino.</p>
        </div>
      </div>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> Revisão Focada</span>
            <h3 className="text-base font-bold text-white mt-1.5">Rever O Que Errei</h3>
            <p className="text-xs text-slate-400 mt-1">Prioriza as questões que você errou anteriormente. Se sua lista estiver zerada, traz os tópicos em que você mais precisa reforçar a base.</p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Até 10 questões</span>
            <Link href="/questoes?modo=erros&count=10" className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-bold text-xs transition-colors">COMEÇAR REVISÃO</Link>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> Treino Completo</span>
            <h3 className="text-base font-bold text-white mt-1.5">Bateria Geral (20 Questões)</h3>
            <p className="text-xs text-slate-400 mt-1">Perguntas balanceadas entre conhecimentos básicos e específicos, simulando o equilíbrio do dia da prova.</p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">20 questões balanceadas</span>
            <Link href="/questoes?modo=geral&count=20" className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors shadow-sm">COMEÇAR TREINO</Link>
          </div>
        </div>
      </div>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2"><Filter className="w-4 h-4 text-emerald-400" /> Praticar por Disciplina</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {subjects.map((subj) => <div key={subj.id} className="bg-slate-800/70 border border-slate-700/60 rounded-xl p-3.5 flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-bold text-white">{subj.name}</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">{subj.topics.length} tópicos cadastrados</p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-700/50 flex items-center justify-between">
              <Link href={`/questoes?subjectId=${subj.id}&count=10`} className="text-xs font-semibold text-emerald-400 hover:text-emerald-300">10 questões →</Link>
              <Link href={`/questoes?subjectId=${subj.id}&count=20`} className="text-xs font-semibold text-slate-400 hover:text-slate-200">20 questões</Link>
            </div>
          </div>)}
        </div>
      </div>
    </div> : <div className="space-y-3">
      {isShortBattery && <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 flex gap-3">
        <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-200">Você pediu <strong>{countNum}</strong> questões, mas encontramos <strong>{questions.length}</strong> cadastradas para esse filtro. Você pode resolver essas agora sem perder o ritmo.</p>
      </div>}
      <QuestionSession 
        initialQuestions={questions} 
        title={modo === "estudar_agora" ? "Sessão Adaptativa Inteligente (Estudar Agora)" : modo === "erros" ? "Revisão dos Meus Erros" : `Treino de Questões (${questions.length} itens)`} 
      />
    </div>}
  </div>;
}

async function PriorityStudyCard() {
  const user = await prisma.user.findFirst({ where: { email: "rafael@estudos.transpetro" }, select: { id: true } });
  if (!user) return null;
  const topics = await prisma.topic.findMany({
    include: {
      subject: true,
      userProgress: { where: { userId: user.id } },
      _count: { select: { questions: true, historicalQuestions: true } },
    },
    orderBy: [{ subject: { order: "asc" } }, { order: "asc" }],
  });
  const ranked = rankStudyPriorities(topics.map((topic) => {
    const p = topic.userProgress[0];
    return {
      topicId: topic.id,
      masteryScore: p?.masteryScore ?? 0,
      status: p?.status ?? "NAO_INICIADO",
      totalQuestions: p?.totalQuestions ?? 0,
      correctAnswers: p?.correctAnswers ?? 0,
      nextReviewDate: p?.nextReviewDate ?? null,
      questionCount: topic._count.questions,
      historicalQuestionCount: topic._count.historicalQuestions,
    };
  }));
  const item = ranked[0];
  const topic = item ? topics.find((candidate) => candidate.id === item.topicId) : null;
  if (!item || !topic) return null;
  const href = getStudyHref(item);
  return <div className="bg-slate-900 border border-sky-500/20 rounded-2xl p-5">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="min-w-0">
        <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400">Próximo treino recomendado</span>
        <h2 className="text-base font-bold text-white mt-1 truncate">{topic.code ? topic.code + " · " : ""}{topic.title}</h2>
        <p className="text-xs text-slate-400 mt-1">{item.masteryScore > 0 ? `Domínio atual: ${Math.round(item.masteryScore)}%` : "Ainda não iniciado"} · {item.reason} · nível: {item.suggestedDifficulty.toLowerCase()}.</p>
        {item.actionGuidance && <p className="text-[11px] text-emerald-400/90 mt-1 font-medium">{item.actionGuidance}</p>}
      </div>
      <Link href={href} className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-sky-500 text-slate-950 font-bold text-xs">Treinar este tópico</Link>
    </div>
  </div>;
}
