import React from "react";
import { prisma } from "@/lib/prisma";
import { QuestionSession } from "@/components/questions/QuestionSession";
import Link from "next/link";
import { AlertTriangle, Sparkles, Filter } from "lucide-react";

interface QuestoesPageProps {
  searchParams: Promise<{
    modo?: string;
    topicId?: string;
    subjectId?: string;
    count?: string;
  }>;
}

export const revalidate = 0;

export default async function QuestoesPage({ searchParams }: QuestoesPageProps) {
  const { modo, topicId, subjectId, count } = await searchParams;
  const countNum = Math.max(1, Math.min(60, parseInt(count || "10", 10) || 10));
  const isTrainingActive = Boolean(modo || topicId || subjectId);

  const subjects = await prisma.subject.findMany({
    include: { topics: { select: { id: true, title: true, code: true } } },
    orderBy: { order: "asc" },
  });

  let questions: any[] = [];

  if (isTrainingActive) {
    if (modo === "erros") {
      const user = await prisma.user.findFirst({
        where: { email: "rafael@estudos.transpetro" },
        select: { id: true },
      });

      const wrongAttempts = user
        ? await prisma.questionAttempt.findMany({
            where: { userId: user.id, isCorrect: false },
            orderBy: { createdAt: "desc" },
            select: { questionId: true },
            take: 100,
          })
        : [];

      const wrongIds = [...new Set(wrongAttempts.map((attempt) => attempt.questionId))];

      if (wrongIds.length > 0) {
        questions = await prisma.question.findMany({
          where: { id: { in: wrongIds } },
          include: { topic: { include: { subject: true } } },
          take: countNum,
        });
        const order = new Map(wrongIds.map((id, index) => [id, index]));
        questions.sort((a, b) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999));
      } else if (user) {
        const weakTopics = await prisma.userTopicProgress.findMany({
          where: { userId: user.id, masteryScore: { lt: 70 } },
          orderBy: { masteryScore: "asc" },
          take: 10,
          select: { topicId: true },
        });
        const topicIds = weakTopics.map((item) => item.topicId);
        if (topicIds.length > 0) {
          questions = await prisma.question.findMany({
            where: { topicId: { in: topicIds } },
            include: { topic: { include: { subject: true } } },
            take: countNum,
            orderBy: { createdAt: "desc" },
          });
        }
      }
    } else {
      let whereClause: any = {};
      if (topicId) whereClause = { topicId };
      else if (subjectId) whereClause = { topic: { subjectId } };

      questions = await prisma.question.findMany({
        where: whereClause,
        include: { topic: { include: { subject: true } } },
        take: countNum,
        orderBy: { createdAt: "desc" },
      });
    }
  }

  return (
    <div className="space-y-6">
      {!isTrainingActive || questions.length === 0 ? (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-md">
            <span className="px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-md">
              Perfil de prova Cesgranrio
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white mt-1">Banco de Questões & Treino de Prova</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
              Pratique com questões de múltipla escolha A a E no perfil definido para a preparação. Questões inéditas geradas por IA são identificadas como tais e não são questões oficiais da banca.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> Modo Pontos Fracos</span>
                <h3 className="text-base font-bold text-white mt-1.5">Treinar Meus Erros</h3>
                <p className="text-xs text-slate-400 mt-1">Prioriza questões que você realmente errou. Se ainda não houver erros registrados, usa os tópicos com menor domínio como fallback.</p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">até 10 questões</span>
                <Link href="/questoes?modo=erros&count=10" className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-bold text-xs transition-colors">INICIAR TREINO</Link>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> Bateria Geral</span>
                <h3 className="text-base font-bold text-white mt-1.5">Treino Misto (20 Questões)</h3>
                <p className="text-xs text-slate-400 mt-1">Bateria com questões sortidas de Conhecimentos Gerais e Específicos.</p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">20 questões mistas</span>
                <Link href="/questoes?modo=geral&count=20" className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors shadow-sm">INICIAR TREINO</Link>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2"><Filter className="w-4 h-4 text-emerald-400" /> Praticar por Eixo do Edital</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {subjects.map((subj) => (
                <div key={subj.id} className="bg-slate-800/70 border border-slate-700/60 rounded-xl p-3.5 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white">{subj.name}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">{subj.topics.length} tópicos cadastrados</p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-700/50 flex items-center justify-between">
                    <Link href={`/questoes?subjectId=${subj.id}&count=10`} className="text-xs font-semibold text-emerald-400 hover:text-emerald-300">10 Questões →</Link>
                    <Link href={`/questoes?subjectId=${subj.id}&count=20`} className="text-xs font-semibold text-slate-400 hover:text-slate-200">20 Questões</Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <QuestionSession initialQuestions={questions} title={modo === "erros" ? "Treino de Pontos Fracos" : `Bateria de Questões (${questions.length} itens)`} />
      )}
    </div>
  );
}
