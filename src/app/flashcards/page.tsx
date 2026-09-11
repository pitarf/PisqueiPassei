import React from "react";
import { prisma } from "@/lib/prisma";
import { FlashcardSession } from "@/components/flashcards/FlashcardSession";
import Link from "next/link";
import { Layers, Sparkles, BookOpen } from "lucide-react";

export const revalidate = 0;

export default async function FlashcardsPage() {
  const cards = await prisma.flashcard.findMany({
    include: {
      topic: {
        include: {
          subject: true,
        },
      },
    },
    take: 30,
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-md">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-md">
            Memória Ativa
          </span>
          <span className="text-xs text-slate-400">Repetição Espaçada</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
          Flashcards da Transpetro 2026.3
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed max-w-2xl">
          Revise conceitos-chave, prazos legais e regras práticas da Cesgranrio. O sistema agenda os cards automaticamente de acordo com sua facilidade.
        </p>
      </div>

      {cards.length > 0 ? (
        <FlashcardSession cards={cards} />
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center space-y-3 max-w-md mx-auto">
          <div className="w-12 h-12 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center mx-auto">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">Nenhum Flashcard Ativo Ainda</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Os flashcards são criados automaticamente sempre que você estuda uma aula no Edital Verticalizado.
          </p>
          <div className="pt-2">
            <Link
              href="/edital"
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Abrir Edital e Estudar</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
