import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  Target,
  ArrowRight,
  RotateCcw,
  AlertTriangle,
  Award,
  BookOpen,
  CheckCircle2,
  TrendingUp,
  Clock,
  Sparkles,
} from "lucide-react";

export const revalidate = 0; // Sempre atualizado ao carregar

export default async function DashboardPage() {
  // 1. Buscar usuário principal
  const user = await prisma.user.findFirst({
    where: { email: "rafael@estudos.transpetro" },
    include: {
      progress: {
        include: {
          topic: {
            include: {
              subject: true,
            },
          },
        },
      },
      simulations: {
        orderBy: { completedAt: "desc" },
        take: 3,
      },
    },
  });

  const totalTopicsCount = await prisma.topic.count();
  const subjects = await prisma.subject.findMany({
    include: {
      topics: {
        include: {
          userProgress: true,
        },
      },
    },
    orderBy: { order: "asc" },
  });

  // Estatísticas de progresso
  const userProgressList = user?.progress || [];
  const studiedTopics = userProgressList.filter((p) => p.status !== "NAO_INICIADO");
  const masteredTopics = userProgressList.filter((p) => p.status === "DOMINADO");
  const syllabusProgressPercent =
    totalTopicsCount > 0
      ? Math.round((studiedTopics.length / totalTopicsCount) * 100)
      : 0;

  // Cálculo da média geral atual de domínio
  const totalMasterySum = userProgressList.reduce((acc, p) => acc + p.masteryScore, 0);
  const averageMastery =
    userProgressList.length > 0
      ? Math.round(totalMasterySum / userProgressList.length)
      : 0;

  // Estimativa de pontos atuais equivalentes na escala de 60
  const estimatedPointsOutOf60 = Math.round((averageMastery / 100) * 60);
  const targetScore = user?.targetScore || 47;
  const pointsDifference = estimatedPointsOutOf60 - targetScore;

  // Assuntos que precisam de revisão (data de revisão <= hoje ou em status EM_REVISAO)
  const now = new Date();
  const reviewsDue = userProgressList.filter(
    (p) =>
      p.status === "EM_REVISAO" ||
      (p.nextReviewDate && new Date(p.nextReviewDate) <= now)
  );

  // Pontos fracos (estudados com domínio mais baixo ou taxa de erro alta)
  const weakPoints = [...userProgressList]
    .filter((p) => p.status !== "NAO_INICIADO" && p.masteryScore < 70)
    .sort((a, b) => a.masteryScore - b.masteryScore)
    .slice(0, 3);

  // Determinar o próximo assunto a estudar
  // Prioridade: 1) Primeiro não iniciado 2) Assunto com menor domínio
  const nextToStudy =
    userProgressList.find((p) => p.status === "NAO_INICIADO")?.topic ||
    weakPoints[0]?.topic ||
    userProgressList[0]?.topic;

  // Cálculo de dias até a prova (06/12/2026)
  const examDate = new Date("2026-12-06T13:00:00");
  const daysRemaining = Math.max(
    0,
    Math.ceil((examDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  );

  return (
    <div className="space-y-6">
      {/* CARD PRINCIPAL: Rumo à Aprovação */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-2xl p-5 sm:p-7 shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-700/60">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-md">
                  Rumo à Aprovação
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  Prova: 06 DEZ 2026 ({daysRemaining} dias)
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
                Olá, Rafael! Seu plano para a Transpetro.
              </h1>
            </div>

            {/* Ação Primária: Continuar Estudando */}
            {nextToStudy && (
              <Link
                href={`/aula/${nextToStudy.id}`}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
              >
                <span>CONTINUAR ESTUDANDO</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>

          {/* Métricas e Progresso */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5">
            {/* Meta de Prova */}
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-3.5">
              <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
                <Target className="w-3.5 h-3.5 text-emerald-400" /> Meta Desejada
              </p>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-2xl font-black text-white">{targetScore}</span>
                <span className="text-xs text-slate-400">/ 60 pts</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {pointsDifference >= 0 ? (
                  <span className="text-emerald-400 font-medium">+{pointsDifference} acima da meta</span>
                ) : (
                  <span className="text-amber-400 font-medium">{Math.abs(pointsDifference)} pts para a meta</span>
                )}
              </p>
            </div>

            {/* Média Geral Estimada */}
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-3.5">
              <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-sky-400" /> Média Estimada
              </p>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-2xl font-black text-sky-400">{estimatedPointsOutOf60}</span>
                <span className="text-xs text-slate-400">/ 60 pts</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Domínio global: <strong className="text-slate-200">{averageMastery}%</strong>
              </p>
            </div>

            {/* Progresso do Edital */}
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-3.5">
              <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-amber-400" /> Edital Estudado
              </p>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-2xl font-black text-amber-400">{syllabusProgressPercent}%</span>
                <span className="text-xs text-slate-400">({studiedTopics.length}/{totalTopicsCount})</span>
              </div>
              <div className="w-full bg-slate-700/50 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className="bg-amber-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${syllabusProgressPercent}%` }}
                />
              </div>
            </div>

            {/* Tópicos Dominados */}
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-3.5">
              <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Dominados
              </p>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-2xl font-black text-emerald-400">{masteredTopics.length}</span>
                <span className="text-xs text-slate-400">tópicos</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Aproveitamento ≥ 85%</p>
            </div>
          </div>
        </div>
      </div>

      {/* SEÇÃO RÁPIDA: Ações Inteligentes do Dia */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card: Revisar Agora */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5" /> Revisão Espaçada (SRS)
              </span>
              <span className="px-2 py-0.5 text-xs font-semibold bg-sky-500/10 text-sky-300 border border-sky-500/20 rounded-full">
                {reviewsDue.length} pendentes
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mt-1.5">
              {reviewsDue.length > 0
                ? `${reviewsDue.length} assuntos aguardando revisão hoje`
                : "Nenhuma revisão atrasada!"}
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              {reviewsDue.length > 0
                ? "Revisar no momento certo consolida o aprendizado na memória de longo prazo antes do esquecimento."
                : "Excelente! Você está em dia com a curva de esquecimento de Ebbinghaus."}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
            <Link
              href="/flashcards"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-400 hover:text-sky-300 transition-colors"
            >
              <span>Ver Flashcards Agendados</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/edital"
              className="px-4 py-2 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 font-semibold text-xs transition-colors"
            >
              REVISAR AGORA
            </Link>
          </div>
        </div>

        {/* Card: Treinar Meus Erros (Pontos Fracos) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> Diagnóstico de Erros
              </span>
              <span className="text-xs text-slate-400">Aproveitamento &lt; 70%</span>
            </div>
            <h3 className="text-lg font-bold text-white mt-1.5">Seus Pontos Fracos</h3>
            {weakPoints.length > 0 ? (
              <div className="mt-2.5 space-y-1.5">
                {weakPoints.map((wp) => (
                  <div
                    key={wp.id}
                    className="flex items-center justify-between bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700/50 text-xs"
                  >
                    <span className="text-slate-200 truncate pr-2">
                      {wp.topic.code ? `${wp.topic.code} ` : ""}
                      {wp.topic.title}
                    </span>
                    <span className="font-bold text-rose-400 shrink-0">
                      {Math.round(wp.masteryScore)}%
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Você ainda não tem pontos críticos registrados. Responda simulados e questões para mapeamento cognitivo.
              </p>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              Foco prioritário da Cesgranrio
            </span>
            <Link
              href="/questoes?modo=erros"
              className="px-4 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-semibold text-xs transition-colors"
            >
              TREINAR PONTOS FRACOS
            </Link>
          </div>
        </div>
      </div>

      {/* SEÇÃO: Desempenho por Matéria do Edital */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <BarChart2Icon className="w-4 h-4 text-emerald-400" />
              Desempenho por Eixo do Edital Oficial
            </h2>
            <p className="text-xs text-slate-400">
              Mapeamento de domínio de acordo com o programa oficial do concurso
            </p>
          </div>
          <Link
            href="/edital"
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
          >
            <span>Ver Edital Completo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {subjects.map((subj) => {
            const topicProgresses = subj.topics.flatMap((t) => t.userProgress);
            const totalTopicsInSubj = subj.topics.length;
            const completedCount = topicProgresses.filter(
              (p) => p.status !== "NAO_INICIADO"
            ).length;
            const avgScore =
              topicProgresses.length > 0
                ? Math.round(
                    topicProgresses.reduce((acc, p) => acc + p.masteryScore, 0) /
                      topicProgresses.length
                  )
                : 0;

            return (
              <div
                key={subj.id}
                className="bg-slate-800/70 border border-slate-700/60 rounded-xl p-3.5 hover:border-slate-600 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-bold text-white line-clamp-1">
                    {subj.name}
                  </h4>
                  <span
                    className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                      avgScore >= 80
                        ? "bg-emerald-500/20 text-emerald-400"
                        : avgScore >= 60
                        ? "bg-amber-500/20 text-amber-400"
                        : "bg-slate-700 text-slate-300"
                    }`}
                  >
                    {avgScore}%
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2.5">
                  <span>
                    {completedCount} de {totalTopicsInSubj} tópicos
                  </span>
                  <span>{subj.category === "ESPECIFICO" ? "Específica" : "Básica"}</span>
                </div>

                <div className="w-full bg-slate-700/50 rounded-full h-1.5 mt-1.5 overflow-hidden">
                  <div
                    className="bg-emerald-400 h-full rounded-full"
                    style={{
                      width: `${
                        totalTopicsInSubj > 0
                          ? Math.round((completedCount / totalTopicsInSubj) * 100)
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SEÇÃO: Últimos Resultados de Simulados */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" /> Últimos Resultados de Simulados (60 questões)
          </h2>
          <Link
            href="/simulado"
            className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors"
          >
            NOVO SIMULADO
          </Link>
        </div>

        {user?.simulations && user.simulations.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
            {user.simulations.map((sim, idx) => (
              <div
                key={sim.id}
                className="bg-slate-800/80 border border-slate-700/70 rounded-xl p-3.5 flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-300">{sim.title}</p>
                  <p className="text-[11px] text-slate-500">
                    {new Date(sim.completedAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-baseline gap-1">
                    <span
                      className={`text-lg font-black ${
                        sim.score >= 47 ? "text-emerald-400" : "text-amber-400"
                      }`}
                    >
                      {Math.round(sim.score)}
                    </span>
                    <span className="text-xs text-slate-400">/ 60</span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {sim.score >= 47 ? "Acima da meta" : "Abaixo da meta"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 border border-dashed border-slate-800 rounded-xl">
            <p className="text-xs text-slate-400">Nenhum simulado de 60 questões realizado ainda.</p>
            <Link
              href="/simulado"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 mt-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Realizar Simulado Oficial Cesgranrio</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function BarChart2Icon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" x2="18" y1="20" y2="10" />
      <line x1="12" x2="12" y1="20" y2="4" />
      <line x1="6" x2="6" y1="20" y2="14" />
    </svg>
  );
}
