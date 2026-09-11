import React from "react";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  BarChart2,
  TrendingUp,
  Award,
  Clock,
  Flame,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
} from "lucide-react";

export const revalidate = 0;

export default async function DesempenhoPage() {
  const user = await prisma.user.findFirst({
    where: { email: "rafael@estudos.transpetro" },
    include: {
      attempts: {
        include: { question: { include: { topic: { include: { subject: true } } } } },
      },
      progress: {
        include: { topic: { include: { subject: true } } },
      },
      simulations: {
        orderBy: { completedAt: "asc" },
      },
      studySessions: true,
    },
  });

  const subjects = await prisma.subject.findMany({
    include: {
      topics: {
        include: { userProgress: { where: { userId: user?.id } } },
      },
    },
    orderBy: { order: "asc" },
  });

  // Métricas gerais
  const totalAttempts = user?.attempts.length || 0;
  const correctAttempts = user?.attempts.filter((a) => a.isCorrect).length || 0;
  const wrongAttempts = totalAttempts - correctAttempts;
  const accuracyPercentage =
    totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0;

  // Tempo estudado em minutos
  const totalMinutesStudied =
    user?.studySessions.reduce((acc, s) => acc + s.durationMinutes, 0) || 0;
  const totalHoursStudied = (totalMinutesStudied / 60).toFixed(1);

  // Média de domínio global
  const totalMastery = user?.progress.reduce((acc, p) => acc + p.masteryScore, 0) || 0;
  const avgMastery =
    user?.progress && user.progress.length > 0
      ? Math.round(totalMastery / user.progress.length)
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-md">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-md">
            Estatísticas & Métricas
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
          Painel de Desempenho do Aluno
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
          Diagnóstico completo da sua preparação para o concurso da Transpetro 2026.3.
        </p>
      </div>

      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <p className="text-xs text-slate-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Acertos
          </p>
          <p className="text-2xl font-black text-emerald-400 mt-1">{correctAttempts}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">questões corretas</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <p className="text-xs text-slate-400 flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5 text-rose-400" /> Erros
          </p>
          <p className="text-2xl font-black text-rose-400 mt-1">{wrongAttempts}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">questões erradas</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <p className="text-xs text-slate-400 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-sky-400" /> Taxa Geral
          </p>
          <p className="text-2xl font-black text-sky-400 mt-1">{accuracyPercentage}%</p>
          <p className="text-[11px] text-slate-500 mt-0.5">aproveitamento</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <p className="text-xs text-slate-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-400" /> Tempo Focado
          </p>
          <p className="text-2xl font-black text-amber-400 mt-1">{totalHoursStudied}h</p>
          <p className="text-[11px] text-slate-500 mt-0.5">horas registradas</p>
        </div>
      </div>

      {/* Gráfico de Barras: Domínio por Matéria do Edital */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-emerald-400" />
            Nível de Domínio Médio por Disciplina
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Mapeamento ponderado com base no estudo das aulas e acertos de questões
          </p>
        </div>

        <div className="space-y-4 pt-2">
          {subjects.map((subj) => {
            const topicProgresses = subj.topics.flatMap((t) => t.userProgress);
            const avg =
              topicProgresses.length > 0
                ? Math.round(
                    topicProgresses.reduce((acc, p) => acc + p.masteryScore, 0) /
                      topicProgresses.length
                  )
                : 0;

            return (
              <div key={subj.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200">{subj.name}</span>
                  <span
                    className={`font-bold ${
                      avg >= 80
                        ? "text-emerald-400"
                        : avg >= 60
                        ? "text-amber-400"
                        : "text-rose-400"
                    }`}
                  >
                    {avg}%
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      avg >= 80
                        ? "bg-emerald-500"
                        : avg >= 60
                        ? "bg-amber-500"
                        : "bg-rose-500"
                    }`}
                    style={{ width: `${Math.max(4, avg)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Evolução de Simulados */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
        <h3 className="text-base font-bold text-white flex items-center gap-2 mb-3">
          <Award className="w-4 h-4 text-amber-400" />
          Evolução dos Simulados de 60 Questões
        </h3>

        {user?.simulations && user.simulations.length > 0 ? (
          <div className="space-y-3">
            {user.simulations.map((sim, i) => (
              <div
                key={sim.id}
                className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60 flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-bold text-slate-200">
                    Simulado #{i + 1} • {sim.title}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Realizado em {new Date(sim.completedAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>

                <div className="text-right">
                  <span
                    className={`text-lg font-black ${
                      sim.score >= 47 ? "text-emerald-400" : "text-amber-400"
                    }`}
                  >
                    {Math.round(sim.score)}
                  </span>
                  <span className="text-xs text-slate-400"> / 60</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 py-4 text-center">
            Nenhum simulado de 60 questões realizado ainda.
          </p>
        )}
      </div>
    </div>
  );
}
