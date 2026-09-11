import React from "react";
import { prisma } from "@/lib/prisma";
import { QuestionSession } from "@/components/questions/QuestionSession";
import Link from "next/link";
import {
  HelpCircle,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  BookOpen,
  Filter,
} from "lucide-react";

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

  const countNum = parseInt(count || "10", 10);

  // Se nenhum parâmetro de treino estiver presente, exibir seletor de filtros
  const isTrainingActive = Boolean(modo || topicId || subjectId);

  const subjects = await prisma.subject.findMany({
    include: { topics: { select: { id: true, title: true, code: true } } },
    orderBy: { order: "asc" },
  });

  let questions: any[] = [];

  if (isTrainingActive) {
    let whereClause: any = {};

    if (modo === "erros") {
      const user = await prisma.user.findFirst({
        where: { email: "rafael@estudos.transpetro" },
      });

      const weakTopics = await prisma.userTopicProgress.findMany({
        where: {
          userId: user?.id,
          masteryScore: { lt: 70 },
        },
        take: 5,
        select: { topicId: true },
      });

      const topicIds = weakTopics.map((w) => w.topicId);
      whereClause = topicIds.length > 0 ? { topicId: { in: topicIds } } : {};
    } else if (topicId) {
      whereClause = { topicId };
    } else if (subjectId) {
      whereClause = { topic: { subjectId } };
    }

    questions = await prisma.question.findMany({
      where: whereClause,
      include: { topic: { include: { subject: true } } },
      take: countNum,
      orderBy: { createdAt: "desc" },
    });
  }

  return (
    <div className="space-y-6">
      {!isTrainingActive || questions.length === 0 ? (
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-md">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-md">
                Treinamento Cesgranrio
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
              Banco de Questões & Treino de Prova
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
              Pratique com questões no formato oficial da banca (múltipla escolha A a E), com gabarito comentado e fundamentação legal.
            </p>
          </div>

          {/* Atalhos Rápidos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Modo Treinar Meus Erros */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> Modo Pontos Fracos
                </span>
                <h3 className="text-base font-bold text-white mt-1.5">
                  Treinar Meus Erros
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Gera bateria focada exclusivamente nos assuntos com taxa de acertos inferior a 70%.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">10 questões selecionadas</span>
                <Link
                  href="/questoes?modo=erros&count=10"
                  className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-bold text-xs transition-colors"
                >
                  INICIAR TREINO
                </Link>
              </div>
            </div>

            {/* Simulado Rápido de 20 Questões */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Bateria Geral
                </span>
                <h3 className="text-base font-bold text-white mt-1.5">
                  Treino Misto (20 Questões)
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Bateria com questões sortidas de Conhecimentos Básicos e Específicos para manter a mente aquecida.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">20 questões mistas</span>
                <Link
                  href="/questoes?modo=geral&count=20"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors shadow-sm"
                >
                  INICIAR TREINO
                </Link>
              </div>
            </div>
          </div>

          {/* Selecionar por Matéria Específica */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
              <Filter className="w-4 h-4 text-emerald-400" /> Praticar por Eixo do Edital
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {subjects.map((subj) => (
                <div
                  key={subj.id}
                  className="bg-slate-800/70 border border-slate-700/60 rounded-xl p-3.5 flex flex-col justify-between"
                >
                  <div>
                    <h4 className="text-xs font-bold text-white">{subj.name}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {subj.topics.length} tópicos cadastrados
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-700/50 flex items-center justify-between">
                    <Link
                      href={`/questoes?subjectId=${subj.id}&count=10`}
                      className="text-xs font-semibold text-emerald-400 hover:text-emerald-300"
                    >
                      10 Questões →
                    </Link>
                    <Link
                      href={`/questoes?subjectId=${subj.id}&count=20`}
                      className="text-xs font-semibold text-slate-400 hover:text-slate-200"
                    >
                      20 Questões
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <QuestionSession
          initialQuestions={questions}
          title={
            modo === "erros"
              ? "Treino de Pontos Fracos (Cesgranrio)"
              : `Bateria de Questões (${questions.length} itens)`
          }
        />
      )}
    </div>
  );
}
