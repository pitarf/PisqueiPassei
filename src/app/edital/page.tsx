import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Sparkles,
  HelpCircle,
  ShieldCheck,
  ChevronRight,
  Layers,
} from "lucide-react";

export const revalidate = 0;

export default async function EditalPage() {
  const user = await prisma.user.findFirst({
    where: { email: "rafael@estudos.transpetro" },
  });

  const subjects = await prisma.subject.findMany({
    include: {
      topics: {
        include: {
          userProgress: {
            where: { userId: user?.id },
          },
          lessons: {
            select: { id: true },
          },
          _count: {
            select: { questions: true, flashcards: true },
          },
        },
        orderBy: { order: "asc" },
      },
    },
    orderBy: { order: "asc" },
  });

  const totalTopics = subjects.reduce((acc, s) => acc + s.topics.length, 0);
  const studiedTopicsCount = subjects.reduce(
    (acc, s) =>
      acc +
      s.topics.filter(
        (t) =>
          t.userProgress[0] && t.userProgress[0].status !== "NAO_INICIADO"
      ).length,
    0
  );

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Página */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-md">
                Edital Oficial 2026.3
              </span>
              <span className="text-xs text-slate-400">
                Ênfase 18 • Suprimento de Bens e Serviços
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
              Edital Verticalizado & Domínio de Conteúdo
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
              Taxonomia 100% fiel à publicação oficial da Transpetro / Cesgranrio. Acompanhe seu status e nível de domínio tópico por tópico.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-800/80 px-4 py-2.5 rounded-xl border border-slate-700/60 shrink-0">
            <div>
              <p className="text-[11px] text-slate-400">Progresso do Edital</p>
              <p className="text-lg font-bold text-emerald-400">
                {Math.round((studiedTopicsCount / totalTopics) * 100)}%
              </p>
            </div>
            <div className="text-right border-l border-slate-700 pl-3">
              <p className="text-[11px] text-slate-400">Cobertura</p>
              <p className="text-sm font-semibold text-slate-200">
                {studiedTopicsCount} / {totalTopics} tópicos
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Matérias e Tópicos */}
      <div className="space-y-6">
        {subjects.map((subject) => {
          const isSpecific = subject.category === "ESPECIFICO";
          return (
            <div
              key={subject.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm"
            >
              {/* Header da Matéria */}
              <div className="bg-slate-850 px-5 py-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${
                      isSpecific ? "bg-emerald-400" : "bg-sky-400"
                    }`}
                  />
                  <div>
                    <h2 className="text-base font-bold text-white">
                      {subject.name}
                    </h2>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {isSpecific ? "Conhecimentos Específicos (40 questões)" : "Conhecimentos Básicos (10 questões)"} • {subject.topics.length} tópicos
                    </span>
                  </div>
                </div>
              </div>

              {/* Tópicos da Matéria */}
              <div className="divide-y divide-slate-800/70">
                {subject.topics.map((topic) => {
                  const progress = topic.userProgress[0];
                  const status = progress?.status || "NAO_INICIADO";
                  const mastery = Math.round(progress?.masteryScore || 0);
                  const hasLessonCache = topic.lessons.length > 0;

                  return (
                    <div
                      key={topic.id}
                      className="p-4 sm:p-5 hover:bg-slate-800/40 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                    >
                      <div className="space-y-1 max-w-xl">
                        <div className="flex items-center gap-2 flex-wrap">
                          {topic.code && (
                            <span className="px-2 py-0.5 text-xs font-mono font-bold bg-slate-800 text-slate-300 rounded border border-slate-700">
                              {topic.code}
                            </span>
                          )}
                          <h3 className="text-sm font-semibold text-slate-100">
                            {topic.title}
                          </h3>
                        </div>

                        {topic.description && (
                          <p className="text-xs text-slate-400 leading-relaxed pl-1">
                            {topic.description}
                          </p>
                        )}

                        {topic.officialSource && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400/90 pl-1">
                            <ShieldCheck className="w-3 h-3" />
                            {topic.officialSource}
                          </span>
                        )}

                        {/* Status de Domínio e Próxima Revisão */}
                        <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-400 pl-1">
                          <span
                            className={`font-semibold px-2 py-0.5 rounded text-[10px] ${
                              status === "DOMINADO"
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : status === "EM_REVISAO"
                                ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                                : status === "EM_ESTUDO"
                                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                : "bg-slate-800 text-slate-400"
                            }`}
                          >
                            {status === "NAO_INICIADO"
                              ? "Não Iniciado"
                              : status === "EM_ESTUDO"
                              ? "Em Estudo"
                              : status === "EM_REVISAO"
                              ? "Em Revisão"
                              : "Dominado"}
                          </span>

                          <span>Domínio: <strong className="text-slate-200">{mastery}%</strong></span>

                          {progress?.nextReviewDate && (
                            <span className="flex items-center gap-1 text-slate-400">
                              <Clock className="w-3 h-3" />
                              Revisão: {new Date(progress.nextReviewDate).toLocaleDateString("pt-BR")}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Botões de Ação do Tópico */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <Link
                          href={`/questoes?topicId=${topic.id}`}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1.5"
                          title="Treinar Questões deste Tópico"
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                          <span>Questões</span>
                        </Link>

                        <Link
                          href={`/aula/${topic.id}`}
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{hasLessonCache ? "Revisar Aula" : "Estudar Agora"}</span>
                          <ChevronRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
