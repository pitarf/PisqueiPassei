import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SimulationExam } from "@/components/exam/SimulationExam";
import { Award, Clock, AlertTriangle, Play, Calendar } from "lucide-react";
import { loadExamQuestions } from "@/app/api/simulado/route";

interface SimuladoPageProps { searchParams: Promise<{ iniciar?: string }> }
export const revalidate = 0;

mport React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SimulationExam } from "@/components/exam/SimulationExam";
import { Award, Clock, AlertTriangle, Play, Calendar } from "lucide-react";
import { loadExamQuestions } from "@/app/api/simulado/route";

interface SimuladoPageProps { searchParams: Promise<{ iniciar?: string }> }
export const revalidate = 0;

function shuffle<T>(items: T[]) { return [...items].sort(() => Math.random() - 0.5); }

export default async function SimuladoPage({ searchParams }: SimuladoPageProps) {
  const { iniciar } = await searchParams;
  const user = await prisma.user.findFirst({ where: { email: "rafael@estudos.transpetro" }, include: { simulations: { orderBy: { completedAt: "desc" } } } });

  if (iniciar === "true") {
    const { questions, distribution, deficits } = await loadExamQuestions();
    if (questions.length < 60) return <div className="max-w-2xl mx-auto bg-slate-900 border border-rose-800/60 rounded-2xl p-6 text-center space-y-3">
      <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
      <h1 className="text-xl font-black text-white">Simulado indisponível no momento</h1>
      <p className="text-sm text-slate-400">Temos {questions.length} de 60 questões disponíveis após a tentativa de suprimento automático. Distribuição atual: {distribution.portuguese} Português, {distribution.math} Matemática e {distribution.specific} Específicas. Déficits: {deficits.portuguese} Português, {deficits.math} Matemática e {deficits.specific} Específicas.</p>
      <Link href="/questoes" className="inline-flex px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs">Praticar Questões Disponíveis</Link>
    </div>;
    return <SimulationExam questions={questions} />;
  }
