"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Flame, Clock, Settings, GraduationCap } from "lucide-react";

interface AppHeaderProps {
  streak?: number;
  xp?: number;
  studentName?: string;
}

/**
 * Cabeçalho principal da aplicação Transpetro Study
 * Exibe contagem regressiva para 06/12/2026, status de ofensiva e atalhos.
 */
export const AppHeader: React.FC<AppHeaderProps> = ({
  streak = 1,
  xp = 150,
  studentName = "Rafael",
}) => {
  const [daysRemaining, setDaysRemaining] = useState<number>(0);

  useEffect(() => {
    // Data oficial da prova: 06 de Dezembro de 2026
    const examDate = new Date("2026-12-06T13:00:00");
    const today = new Date();
    const diffTime = examDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    setDaysRemaining(Math.max(0, diffDays));
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-900 border-b border-slate-800 text-white px-4 py-3 shadow-md">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Identidade da Marca */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-base sm:text-lg text-white">
                TRANSPETRO<span className="text-emerald-400"> STUDY</span>
              </span>
              <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">
                2026.3
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden xs:block">
              Ênfase 18 • Suprimento de Bens e Serviços
            </p>
          </div>
        </Link>

        {/* Indicadores: Dias para a Prova, Ofensiva e Configurações */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Contador de Dias para a Prova */}
          <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700/80 px-2.5 py-1 rounded-full text-xs text-slate-200">
            <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span className="font-semibold text-amber-400">{daysRemaining}</span>
            <span className="text-slate-400 text-[11px]">dias</span>
          </div>

          {/* Ofensiva (Streak) */}
          <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-full text-xs font-medium text-amber-300">
            <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>{streak}d</span>
          </div>

          {/* Configurações */}
          <Link
            href="/configuracoes"
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
            title="Configurações"
          >
            <Settings className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </header>
  );
};
