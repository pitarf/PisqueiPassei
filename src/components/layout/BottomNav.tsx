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
} from "lucide-react";

/**
 * Barra de navegação inferior mobile-first
 * Fixa na base para acesso rápido com o polegar.
 */
export const BottomNav: React.FC = () => {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Início", icon: Home },
    { href: "/edital", label: "Edital", icon: BookOpen },
    { href: "/questoes", label: "Questões", icon: HelpCircle },
    { href: "/simulado", label: "Simulado", icon: Award },
    { href: "/flashcards", label: "Cards", icon: Layers },
    { href: "/professor", label: "Professor", icon: Bot },
  ];

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 px-2 py-1.5 shadow-xl">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-all ${
                isActive
                  ? "text-emerald-400 font-semibold scale-105"
                  : "text-slate-400 hover:text-slate-200 font-normal"
              }`}
            >
              <Icon className={`w-5 h-5 mb-0.5 ${isActive ? "stroke-[2.4]" : "stroke-[1.8]"}`} />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
