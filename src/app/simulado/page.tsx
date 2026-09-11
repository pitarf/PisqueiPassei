import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SimulationExam } from "@/components/exam/SimulationExam";
import {
  Award,
  Clock,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Play,
  Calendar,
} from "lucide-react";

interface SimuladoPageProps {
  searchParams: Promise<{
    iniciar?: string;
  }>;
}

export const revalidate = 0;

export default async function SimuladoPage({ searchParams }: SimuladoPageProps) {
  const { iniciar } = await searchParams;

  const user = await prisma.user.findFirst({
    where: { email: "rafael@estudos.transpetro" },
    include: {
      simulations: {
        orderBy: { completedAt: "desc" },
      },
    },
  });

  // Se o usuário clicou em Iniciar, carregar as questões
  if (iniciar === "true") {
    // Buscar questões para o simulado
    const questions = await prisma.question.findMany({
      include: { topic: { include: { subject: true } } },
      take: 60,
      orderBy: { createdAt: "desc" },
    });

    return <SimulationExam questions={questions} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-md">
                Prova Oficial Cesgranrio
              </span>
              <span className="text-xs text-slate-400">4 Horas • 60 Itens</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
              Simulado Oficial Transpetro 2026.3
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed max-w-2xl">
              Simulação idêntica à prova real da Fundação Cesgranrio para a Ênfase 18 (Suprimento de Bens e Serviços). Avalia critérios de corte e sua distância para a meta de 47/60 pontos.
            </p>
          </div>

          <Link
            href="/simulado?iniciar=true"
            className="px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 shrink-0"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>INICIAR SIMULADO AGORA</span>
          </Link>
        </div>
      </div>

      {/* Regras e Distribuição Oficial */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase">
            Língua Portuguesa
          </p>
          <p className="text-2xl font-black text-white mt-1">10 Questões</p>
          <p className="text-[11px] text-slate-400 mt-1">
            Conhecimentos Básicos • Elimina se zerar
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase">
            Matemática
          </p>
          <p className="text-2xl font-black text-white mt-1">10 Questões</p>
          <p className="text-[11px] text-slate-400 mt-1">
            Conhecimentos Básicos • Elimina se zerar
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase">
            Conhecimentos Específicos
          </p>
          <p className="text-2xl font-black text-emerald-400 mt-1">40 Questões</p>
          <p className="text-[11px] text-slate-400 mt-1">
            Ênfase 18 • Mínimo de 50% de acertos
          </p>
        </div>
      </div>

      {/* Histórico de Simulados Realizados */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            Histórico de Simulados
          </h2>
          <span className="text-xs text-slate-400">
            {user?.simulations?.length || 0} simulados registrados
          </span>
        </div>

        {user?.simulations && user.simulations.length > 0 ? (
          <div className="divide-y divide-slate-800">
            {user.simulations.map((sim) => {
              const isAbove = sim.score >= 47;
              return (
                <div
                  key={sim.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                >
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">{sim.title}</h3>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(sim.completedAt).toLocaleDateString("pt-BR")} às{" "}
                        {new Date(sim.completedAt).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {Math.round(sim.durationSeconds / 60)} min
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="flex items-baseline gap-1">
                        <span
                          className={`text-xl font-black ${
                            isAbove ? "text-emerald-400" : "text-amber-400"
                          }`}
                        >
                          {Math.round(sim.score)}
                        </span>
                        <span className="text-xs text-slate-400">/ 60</span>
                      </div>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                          isAbove
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-amber-500/20 text-amber-400"
                        }`}
                      >
                        {isAbove ? "Atingiu Meta (47+)" : "Abaixo da Meta"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10 border border-dashed border-slate-800 rounded-xl space-y-2">
            <p className="text-sm text-slate-300">Você ainda não realizou nenhum simulado oficial.</p>
            <p className="text-xs text-slate-500">
              Faça seu primeiro teste de 60 questões para medir seu ponto de partida.
            </p>
            <div className="pt-2">
              <Link
                href="/simulado?iniciar=true"
                className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-slate-950" />
                <span>Começar Primeiro Simulado</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
