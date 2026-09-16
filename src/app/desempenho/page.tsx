import React from "react";
import { prisma } from "@/lib/prisma";
import { BarChart2, TrendingUp, Award, Clock, CheckCircle2, Target } from "lucide-react";
import Link from "next/link";

export const revalidate = 0;

export default async function DesempenhoPage() {
  const user = await prisma.user.findFirst({
    where: { email: "rafael@estudos.transpetro" },
    include: {
      attempts: { include: { question: { include: { topic: { include: { subject: true } } } } }, orderBy: { createdAt: "desc" } },
      progress: { include: { topic: { include: { subject: true } } } },
      simulations: { orderBy: { completedAt: "desc" }, take: 10 },
      studySessions: true,
    },
  });

  const subjects = await prisma.subject.findMany({
    include: { topics: { include: { userProgress: { where: { userId: user?.id } } } } },
    orderBy: { order: "asc" },
  });
  const attempts = user?.attempts ?? [];
  const training = attempts.filter((a) => !a.simulationId);
  const simulationAttempts = attempts.filter((a) => Boolean(a.simulationId));
  const accuracy = (items: typeof attempts) => items.length ? Math.round(items.filter((a) => a.isCorrect).length / items.length * 100) : 0;
  const totalMinutes = user?.studySessions.reduce((sum, s) => sum + s.durationMinutes, 0) ?? 0;
  const recentTraining = training.slice(0, 20);
  const recentAccuracy = accuracy(recentTraining);
  const globalAccuracy = accuracy(training);
  const simAccuracy = accuracy(simulationAttempts);
  const mastered = user?.progress.filter((p) => p.status === "DOMINADO").length ?? 0;
  const studied = user?.progress.filter((p) => p.status !== "NAO_INICIADO").length ?? 0;
  const weak = [...(user?.progress ?? [])].filter((p) => p.status !== "NAO_INICIADO" && p.masteryScore < 70).sort((a, b) => a.masteryScore - b.masteryScore).slice(0, 6);

  return <div className="space-y-6">
    <header className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-md">
      <span className="px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-md">Estatísticas & Métricas</span>
      <h1 className="text-xl sm:text-2xl font-black text-white mt-2">Painel de Desempenho</h1>
      <p className="text-xs sm:text-sm text-slate-400 mt-1">Dados registrados pelo sistema para acompanhar sua preparação. Os indicadores não são previsão de nota no concurso.</p>
    </header>

    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Metric icon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />} label="Treino" value={`${training.filter(a => a.isCorrect).length}/${training.length}`} detail={`${globalAccuracy}% de aproveitamento`} />
      <Metric icon={<Award className="w-3.5 h-3.5 text-amber-400" />} label="Simulados" value={`${simulationAttempts.filter(a => a.isCorrect).length}/${simulationAttempts.length}`} detail={`${simAccuracy}% nas questões vinculadas`} />
      <Metric icon={<TrendingUp className="w-3.5 h-3.5 text-sky-400" />} label="Domínio médio" value={`${user?.progress.length ? Math.round(user.progress.reduce((s,p)=>s+p.masteryScore,0)/user.progress.length) : 0}%`} detail={`${mastered} tópicos dominados`} />
      <Metric icon={<Clock className="w-3.5 h-3.5 text-amber-400" />} label="Tempo focado" value={`${(totalMinutes/60).toFixed(1)}h`} detail={`${studied} tópicos com estudo registrado`} />
    </div>

    <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3"><div><h2 className="text-base font-bold text-white flex items-center gap-2"><BarChart2 className="w-4 h-4 text-emerald-400" />Desempenho por disciplina</h2><p className="text-xs text-slate-400 mt-0.5">Domínio dos tópicos e aproveitamento real nas questões de treino.</p></div><Link href="/edital" className="text-xs font-semibold text-emerald-400">Ver edital</Link></div>
      <div className="grid lg:grid-cols-2 gap-4 mt-5">
        {subjects.map((subject) => {
          const topicIds = new Set(subject.topics.map(t => t.id));
          const subjectAttempts = training.filter(a => topicIds.has(a.question.topicId));
          const progresses = subject.topics.flatMap(t => t.userProgress);
          const mastery = progresses.length ? Math.round(progresses.reduce((s,p)=>s+p.masteryScore,0)/progresses.length) : 0;
          const acc = accuracy(subjectAttempts);
          const studiedCount = progresses.filter(p => p.status !== "NAO_INICIADO").length;
          return <div key={subject.id} className="bg-slate-800/70 border border-slate-700/60 rounded-xl p-4">
            <div className="flex items-start justify-between gap-3"><div><h3 className="text-sm font-bold text-white">{subject.name}</h3><p className="text-[11px] text-slate-400 mt-0.5">{studiedCount}/{subject.topics.length} tópicos estudados</p></div><span className="text-sm font-black text-sky-300">{mastery}% domínio</span></div>
            <div className="mt-3 h-2 bg-slate-700 rounded-full overflow-hidden"><div className="h-full bg-emerald-400 rounded-full" style={{width:`${mastery}%`}} /></div>
            <div className="grid grid-cols-2 gap-2 mt-3 text-[11px]"><div className="bg-slate-900/60 rounded-lg p-2"><span className="text-slate-500">Questões</span><br/><b className="text-slate-200">{subjectAttempts.length}</b></div><div className="bg-slate-900/60 rounded-lg p-2"><span className="text-slate-500">Aproveitamento</span><br/><b className="text-slate-200">{subjectAttempts.length ? `${acc}%` : "Sem dados"}</b></div></div>
          </div>;
        })}
      </div>
    </section>

    <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
      <h2 className="text-base font-bold text-white flex items-center gap-2"><TrendingUp className="w-4 h-4 text-sky-400" />Recorte recente de treino</h2>
      <p className="text-xs text-slate-400 mt-0.5">Últimas {recentTraining.length} questões de treino registradas.</p>
      <div className="grid grid-cols-3 gap-3 mt-4"><div className="bg-slate-800/70 rounded-xl p-3"><span className="text-[11px] text-slate-400">Aproveitamento recente</span><p className="text-xl font-black text-sky-300 mt-1">{recentAccuracy}%</p></div><div className="bg-slate-800/70 rounded-xl p-3"><span className="text-[11px] text-slate-400">Acertos recentes</span><p className="text-xl font-black text-emerald-300 mt-1">{recentTraining.filter(a=>a.isCorrect).length}</p></div><div className="bg-slate-800/70 rounded-xl p-3"><span className="text-[11px] text-slate-400">Erros recentes</span><p className="text-xl font-black text-rose-300 mt-1">{recentTraining.filter(a=>!a.isCorrect).length}</p></div></div>
    </section>

    <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3"><div><h2 className="text-base font-bold text-white flex items-center gap-2"><Target className="w-4 h-4 text-rose-400" />Pontos para revisar</h2><p className="text-xs text-slate-400 mt-0.5">Tópicos com domínio abaixo de 70%, conforme o indicador interno.</p></div><Link href="/questoes?modo=erros" className="text-xs font-semibold text-rose-300">Treinar erros</Link></div>
      {weak.length ? <div className="grid sm:grid-cols-2 gap-2 mt-4">{weak.map(p => <Link key={p.id} href={`/aula/${p.topicId}`} className="bg-slate-800/70 border border-slate-700/60 rounded-xl p-3 hover:border-rose-500/40 transition-colors"><div className="flex items-center justify-between gap-2"><span className="text-xs font-semibold text-slate-200 truncate">{p.topic.code ? `${p.topic.code} ` : ""}{p.topic.title}</span><span className="text-xs font-black text-rose-300">{Math.round(p.masteryScore)}%</span></div><div className="text-[10px] text-slate-500 mt-1">Abrir aula e revisar</div></Link>)}</div> : <p className="text-xs text-slate-400 mt-4">Ainda não há tópicos estudados abaixo de 70%.</p>}
    </section>

    <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
      <h2 className="text-base font-bold text-white flex items-center gap-2 mb-3"><Award className="w-4 h-4 text-amber-400" />Histórico dos simulados</h2>
      {user?.simulations.length ? <div className="space-y-2">{user.simulations.map((sim,i) => { const d=sim.detailsJson&&typeof sim.detailsJson==="object"&&!Array.isArray(sim.detailsJson)?sim.detailsJson as {isEliminated?:boolean;eliminationReasons?:string[];targetScore?:number}:null; const eliminated=d?.isEliminated===true; const target=d?.targetScore??47; return <div key={sim.id} className="bg-slate-800/70 rounded-xl p-3.5 border border-slate-700/60 flex items-center justify-between gap-3"><div><p className="text-xs font-bold text-slate-200">Simulado #{user.simulations.length-i}</p><p className="text-[11px] text-slate-400">{new Date(sim.completedAt).toLocaleDateString("pt-BR")}</p></div><div className="text-right"><span className="text-lg font-black text-white">{Math.round(sim.score)}/60</span><p className={`text-[10px] font-bold ${eliminated?"text-rose-300":"text-slate-400"}`}>{eliminated?"ELIMINADO":`Meta pessoal: ${target}/60`}</p></div></div>; })}</div> : <p className="text-xs text-slate-400 py-3 text-center">Nenhum simulado realizado.</p>}
    </section>
  </div>;
}

function Metric({icon,label,value,detail}:{icon:React.ReactNode;label:string;value:string;detail:string}) { return <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4"><p className="text-xs text-slate-400 flex items-center gap-1">{icon}{label}</p><p className="text-2xl font-black text-white mt-1">{value}</p><p className="text-[11px] text-slate-500 mt-0.5">{detail}</p></div>; }
