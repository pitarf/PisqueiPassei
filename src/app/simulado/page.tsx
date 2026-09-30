import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SimulationExam } from "@/components/exam/SimulationExam";
import { loadExamQuestions, EXAM_TOTAL, PORT_TOTAL, MATH_TOTAL, SPECIFIC_TOTAL } from "@/lib/simulation";
import { Award, Clock, AlertTriangle, Play, Calendar } from "lucide-react";

interface SimuladoPageProps { searchParams: Promise<{ iniciar?: string }> }
export const revalidate = 0;

export default async function SimuladoPage({ searchParams }: SimuladoPageProps) {
  const { iniciar } = await searchParams;
  const user = await prisma.user.findFirst({ where: { email: "rafael@estudos.transpetro" }, include: { simulations: { orderBy: { completedAt: "desc" } } } });

  if (iniciar === "true") {
    const { questions, distribution, deficits } = await loadExamQuestions();
    if (questions.length < EXAM_TOTAL) {
      return (
        <div className="max-w-2xl mx-auto bg-slate-900 border border-amber-800/60 rounded-2xl p-6 text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
          <h1 className="text-xl font-black text-white">Estoque insuficiente para prova completa</h1>
          <p className="text-sm text-slate-300">
            O simulado oficial exige rigorosamente <strong>{EXAM_TOTAL} questões</strong> ({PORT_TOTAL} Português, {MATH_TOTAL} Matemática e {SPECIFIC_TOTAL} Específicas).
          </p>
          <div className="bg-slate-800/80 rounded-xl p-3 text-xs text-slate-400 space-y-1">
            <p>Disponíveis agora: {questions.length} / {EXAM_TOTAL}</p>
            <p className="text-amber-300">
              Déficits: Português: {deficits.portuguese} | Matemática: {deficits.math} | Específicas: {deficits.specific}
            </p>
          </div>
          <p className="text-xs text-slate-400">
            A geração automática via IA supre os déficits gradualmente. Tente novamente em instantes ou pratique no banco de questões.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link href="/simulado?iniciar=true" className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs">
              Tentar Novamente
            </Link>
            <Link href="/questoes" className="px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 font-bold text-xs">
              Praticar Questões Disponíveis
            </Link>
          </div>
        </div>
      );
    }
    return <SimulationExam questions={questions} />;
  }

  return <div className="space-y-6 pb-20 sm:pb-6">
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-md">Condições Reais de Prova</span>
            <span className="text-xs text-slate-400">4 horas de duração • 60 questões</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white mt-1">Simulado Transpetro 2026.3</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed max-w-2xl">Treine o ritmo e a pressão do dia da prova: 10 questões de Língua Portuguesa, 10 de Matemática e 40 de Conhecimentos Específicos (Ênfase 18). Itens complementares criados pela plataforma trazem a indicação de questão inédita.</p>
        </div>
        <Link href="/simulado?iniciar=true" className="px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-lg flex items-center justify-center gap-2"><Play className="w-4 h-4 fill-slate-950" />INICIAR SIMULADO</Link>
      </div>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4"><p className="text-xs font-semibold text-slate-400 uppercase">Língua Portuguesa</p><p className="text-2xl font-black text-white mt-1">10 Questões</p><p className="text-[11px] text-slate-400 mt-1">Conhecimentos Básicos • Elimina se zerar a matéria</p></div>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4"><p className="text-xs font-semibold text-slate-400 uppercase">Matemática</p><p className="text-2xl font-black text-white mt-1">10 Questões</p><p className="text-[11px] text-slate-400 mt-1">Conhecimentos Básicos • Elimina se zerar a matéria</p></div>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4"><p className="text-xs font-semibold text-slate-400 uppercase">Conhecimentos Específicos</p><p className="text-2xl font-black text-emerald-400 mt-1">40 Questões</p><p className="text-[11px] text-slate-400 mt-1">Ênfase 18 • Exige no mínimo 50% de acerto</p></div>
    </div>
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4"><h2 className="text-base font-bold text-white flex items-center gap-2"><Award className="w-4 h-4 text-amber-400" />Histórico de Provas</h2><span className="text-xs text-slate-400">{user?.simulations?.length || 0} realizadas</span></div>
      {user?.simulations?.length ? <div className="divide-y divide-slate-800">{user.simulations.map((sim) => <div key={sim.id} className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"><div><h3 className="text-sm font-bold text-slate-100">{sim.title}</h3><div className="flex items-center gap-3 text-xs text-slate-400 mt-1"><span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{new Date(sim.completedAt).toLocaleDateString("pt-BR")}</span><span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{Math.round(sim.durationSeconds / 60)} min de prova</span></div></div><div className="text-right"><span className="text-xl font-black text-white">{Math.round(sim.score)}</span><span className="text-xs text-slate-400"> / 60</span><div className="text-[10px] text-slate-400">Sua meta: {user.targetScore}/60</div></div></div>)}</div> : <div className="text-center py-10 border border-dashed border-slate-800 rounded-xl"><p className="text-sm text-slate-300">Nenhum simulado realizado até o momento.</p><p className="text-xs text-slate-500 mt-1">Assim que você fizer sua primeira prova de 4 horas, o histórico completo aparecerá aqui.</p></div>}
    </div>
  </div>;
}
