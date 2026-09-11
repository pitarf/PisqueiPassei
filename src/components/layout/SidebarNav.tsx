"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  BookOpen,
  HelpCircle,
  Award,
  Layers,
  Bot,
  BarChart2,
  Settings,
} from "lucide-react";

/**
 * Barra lateral para telas Desktop e Tablet
 */
export const SidebarNav: React.FC = () => {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Visão Geral", icon: Home },
    { href: "/edital", label: "Edital Verticalizado", icon: BookOpen },
    { href: "/questoes", label: "Banco de Questões", icon: HelpCircle },
    { href: "/simulado", label: "Simulado Cesgranrio", icon: Award },
    { href: "/flashcards", label: "Flashcards (SRS)", icon: Layers },
    { href: "/professor", label: "Professor IA", icon: Bot },
    { href: "/desempenho", label: "Desempenho & Estatísticas", icon: BarChart2 },
    { href: "/configuracoes", label: "Configurações", icon: Settings },
  ];

  return (
    <aside className="hidden sm:flex flex-col w-64 bg-slate-900 border-r border-slate-800 min-h-[calc(100vh-57px)] p-4 text-slate-300">
      <div className="space-y-1">
        <p className="px-3 text-[11px] font-semibold tracking-wider text-slate-400 uppercase mb-2">
          Menu de Estudos
        </p>
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                  : "hover:bg-slate-800 hover:text-white text-slate-300"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-emerald-400" : "text-slate-400"}`} />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Card Informativo Cesgranrio */}
      <div className="mt-auto pt-6">
        <div className="p-3.5 bg-slate-800/60 rounded-xl border border-slate-700/60 text-xs">
          <p className="font-semibold text-slate-200">Foco Cesgranrio</p>
          <p className="text-slate-400 mt-1 leading-relaxed">
            Meta: 47/60 pontos. Ênfase em compras públicas e logística aplicada.
          </p>
        </div>
      </div>
    </aside>
  );
};
