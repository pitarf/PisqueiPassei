import React from "react";
import { prisma } from "@/lib/prisma";
import { QuestionSession } from "@/components/questions/QuestionSession";
import Link from "next/link";
import { AlertTriangle, Sparkles, Filter, Info } from "lucide-react";

interface QuestoesPageProps { searchParams: Promise<{ modo?: string; topicId?: string; subjectId?: string; count?: string; }>; }
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
  const { modo, topicId, subjectId, count } = await searchParams;
  const countNum = Math.max(1, Math.min(60, parseInt(count || "10", 10) || 10));
  const isTrainingActive = Boolean(modo || topicId || subjectId);
  const subjects = await prisma.subject.findMany({ include: { topics: { select: { id: true, title: true, code: true } } }, orderBy: { order: "asc" } });
  let questions: any[] = [];

  if (isTrainingActive) {
    if (modo === "erros") {
      const user = await prisma.user.findFirst({ where: { email: "rafael@estudos.transpetro" }, select: { id: true } });
      const wrongAttempts = user ? await prisma.questionAttempt.findMany({ where: { userId: user.id, isCorrect: false }, orderBy: { createdAt: "desc" }, select: { questionId: true }, take: 100 }) : [];
      const wrongIds = [...new Set(wrongAttempts.map((attempt) => attempt.questionId))];
      if (wrongIds.length > 0) {
        const wrongPool = await prisma.question.findMany({ where: { id: { in: wrongIds } }, include: { topic: { include: { subject: true } } } });
        const order = new Map(wrongIds.map((id, index) => [id, index]));
        wrongPool.sort((a, b) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999));
        questions = wrongPool.slice(0, countNum);
      } else if (user) {
        const weakTopics = await prisma.userTopicProgress.findMany({ where: { userId: user.id, masteryScore: { lt: 70 } }, orderBy: { masteryScore: "asc" }, take: 10, select: { topicId: true } });
        const topicIds = weakTopics.map((item) => item.topicId);
        if (topicIds.length > 0) {
          const weakPool = await prisma.question.findMany({ where: { topicId: { in: topicIds } }, include: { topic: { include: { subject: true } } } });
          questions = shuffle(weakPool).slice(0, countNum);
        }
      }
    } else if (modo === "geral" && !topicId && !subjectId) {
      const generalCount = Math.max(1, Math.round(countNum / 3));
      const specificCount = countNum - generalCount;
      const [generalPool, specificPool] = await Promise.all([
        prisma.question.findMany({ where: { topic: { subject: { category: { in: ["GERAL", "BASICO"] } } } }, include: { topic: { include: { subject: true } } } }),
        prisma.question.findMany({ where: { topic: { subject: { category: "ESPECIFICO" } } }, include: { topic: { include: { subject: true } } } }),
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
      if (topicId) whereClause = { topicId };
      else if (subjectId) whereClause = { topic: { subjectId } };
      const pool = await prisma.question.findMany({ where: whereClause, include: { topic: { include: { subject: true } } } });
      questions = shuffle(pool).slice(0, countNum);
    }
  }

  const isShortBattery = isTrainingActive && questions.length > 0 && questions.length < countNum;

  return <div className="space-y-6 pb-20 sm:pb-6">
    {!isTrainingActive || questions.length === 0 ? <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-md">
        <span className="px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-md">Padrão Cesgranrio</span>
        <h1 className="text-xl sm:text-2xl font-black text-white mt-1">Prática de Questões</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">Exercite os conteúdos com questões de múltipla escolha (A a E). As questões criadas pela plataforma para complementar o edital trazem indicação clara de questão inédita.</p>
      </div>
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
      <QuestionSession initialQuestions={questions} title={modo === "erros" ? "Revisão dos Meus Erros" : `Treino de Questões (${questions.length} itens)`} />
    </div>}
  </div>;
}
