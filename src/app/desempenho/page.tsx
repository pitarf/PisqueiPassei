import React from "react";
import { prisma } from "@/lib/prisma";
import {
  BarChart2,
  TrendingUp,
  Award,
  Clock,
  CheckCircle2,
  XCircle,
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

  const attempts = user?.attempts || [];
  const trainingAttempts = attempts.filter((attempt) => !attempt.simulationId);
  const simulationAttempts = attempts.filter((attempt) => Boolean(attempt.simulationId));
  const correctTraining = trainingAttempts.filter((attempt) => attempt.isCorrect).length;
  const correctSimulation = simulationAttempts.filter((attempt) => attempt.isCorrect).length;
  const trainingAccuracy = trainingAttempts.length > 0
    ? Math.round((correctTraining / trainingAttempts.length) * 100)
    : 0;
  const simulationAccuracy = simulationAttempts.length > 0
    ? Math.round((correctSimulation / simulationAttempts.length) * 100)
    : 0;

  const totalMinutesStudied = user?.studySessions.reduce((acc, session) => acc + session.durationMinutes, 0) || 0;
  const totalHoursStudied = (totalMinutesStudied / 60).toFixed(1);

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-md">
        <span className="px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-md">
          Estatísticas & Métricas
        </span>
        <h1 className="text-xl sm:text-2xl font-black text-white mt-2">Painel de Desempenho do Aluno</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
          Diagnóstico completo da sua preparação para o concurso da Transpetro 2026.3.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <p className="text-xs text-slate-400 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Treino</p>
          <p className="text-2xl font-black text-emerald-400 mt-1">{correctTraining}/{trainingAttempts.length}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">{trainingAccuracy}% de aproveitamento</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <p className="text-xs text-slate-400 flex items-center gap-1"><Award className="w-3.5 h-3.5 text-amber-400" /> Simulados</p>
          <p className="text-2xl font-black text-amber-400 mt-1">{correctSimulation}/{simulationAttempts.length}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">{simulationAccuracy}% nas questões de simulado</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <p className="text-xs text-slate-400 flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5 text-sky-400" /> Domínio médio</p>
          <p className="text-2xl font-black text-sky-400 mt-1">{user?.progress.length ? Math.round(user.progress.reduce((sum, p) => sum + p.masteryScore, 0) / user.progress.length) : 0}%</p>
          <p className="text-[11px] text-slate-500 mt-0.5">entre os tópicos estudados</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <p className="text-xs text-slate-400 flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-amber-400" /> Tempo focado</p>
          <p className="text-2xl font-black text-amber-400 mt-1">{totalHoursStudied}h</p>
          <p className="text-[11px] text-slate-500 mt-0.5">horas registradas</p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2"><BarChart2 className="w-4 h-4 text-emerald-400" />Nível de Domínio Médio por Disciplina</h3>
          <p className="text-xs text-slate-400 mt-0.5">Baseado no progresso registrado por tópico.</p>
        </div>
        <div className="space-y-4 pt-2">
          {subjects.map((subj) => {
            const progresses = subj.topics.flatMap((topic) => topic.userProgress);
            const avg = progresses.length ? Math.round(progresses.reduce((sum, p) => sum + p.masteryScore, 0) / progresses.length) : 0;
            return (
              <div key={subj.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs"><span className="font-semibold text-slate-200">{subj.name}</span><span className={`font-bold ${avg >= 80 ? "text-emerald-400" : avg >= 60 ? "text-amber-400" : "text-rose-400"}`}>{avg}%</span></div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all duration-500 ${avg >= 80 ? "bg-emerald-500" : avg >= 60 ? "bg-amber-500" : "bg-rose-500"}`} style={{ width: `${Math.max(4, avg)}%` }} /></div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
        <h3 className="text-base font-bold text-white flex items-center gap-2 mb-3"><Award className="w-4 h-4 text-amber-400" />Evolução dos Simulados de 60 Questões</h3>
        {user?.simulations?.length ? (
          <div className="space-y-3">
            {user.simulations.map((sim, i) => {
              const diagnostic = sim.detailsJson && typeof sim.detailsJson === "object" && !Array.isArray(sim.detailsJson)
                ? (sim.detailsJson as { isEliminated?: boolean; eliminationReasons?: string[]; targetScore?: number })
                : null;
              const eliminated = diagnostic?.isEliminated === true;
              const target = diagnostic?.targetScore ?? 47;
              return (
                <div key={sim.id} className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-slate-200">Simulado #{i + 1} • {sim.title}</p>
                      <p className="text-[11px] text-slate-400">Realizado em {new Date(sim.completedAt).toLocaleDateString("pt-BR")}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-lg font-black ${eliminated ? "text-rose-400" : sim.score >= target ? "text-emerald-400" : "text-amber-400"}`}>{Math.round(sim.score)}</span>
                      <span className="text-xs text-slate-400"> / 60</span>
                      <p className={`text-[10px] font-bold ${eliminated ? "text-rose-400" : sim.score >= target ? "text-emerald-400" : "text-amber-400"}`}>{eliminated ? "ELIMINADO" : sim.score >= target ? "META ATINGIDA" : `${target - Math.round(sim.score)} ponto(s) para a meta`}</p>
                    </div>
                  </div>
                  {eliminated && diagnostic?.eliminationReasons?.length ? <div className="mt-2 text-[11px] text-rose-300 space-y-0.5">{diagnostic.eliminationReasons.map((reason, index) => <p key={index}>• {reason}</p>)}</div> : null}
                </div>
              );
            })}
          </div>
        ) : <p className="text-xs text-slate-400 py-4 text-center">Nenhum simulado de 60 questões realizado ainda.</p>}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
        <h3 className="text-base font-bold text-white mb-3">Leitura rápida</h3>
        <div className="grid sm:grid-cols-3 gap-3 text-xs text-slate-300">
          <div className="bg-slate-800/70 rounded-xl p-3"><b className="text-white">Treino:</b> questões praticadas fora dos simulados.</div>
          <div className="bg-slate-800/70 rounded-xl p-3"><b className="text-white">Simulados:</b> tentativas vinculadas a uma prova completa de 60 questões.</div>
          <div className="bg-slate-800/70 rounded-xl p-3"><b className="text-white">Meta:</b> 47/60 é objetivo pessoal, não critério oficial isolado de eliminação.</div>
        </div>
      </div>
    </div>
  );
}
