"use client";

import React, { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Layers,
  RotateCw,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Brain,
} from "lucide-react";

interface Flashcard {
  id: string;
  front: string;
  back: string;
  topic?: {
    title: string;
    code?: string | null;
    subject?: { name: string };
  };
}

interface FlashcardSessionProps {
  cards: Flashcard[];
}

export const FlashcardSession: React.FC<FlashcardSessionProps> = ({ cards }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const currentCard = cards[currentIndex];

  const handleRating = async (rating: "FACIL" | "MEDIO" | "DIFICIL") => {
    if (!currentCard || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flashcardId: currentCard.id,
          rating,
        }),
      });

      if (!res.ok) throw new Error("Erro ao registrar revisão do card.");

      setReviewedCount((prev) => prev + 1);

      if (rating === "FACIL") {
        toast.success("Card dominado! Próxima revisão em 7 dias.");
      } else if (rating === "MEDIO") {
        toast.info("Próxima revisão em 3 dias.");
      } else {
        toast.warning("Card marcado para revisão amanhã.");
      }

      if (currentIndex + 1 < cards.length) {
        setIsFlipped(false);
        setCurrentIndex((prev) => prev + 1);
      } else {
        setIsFinished(true);
      }
    } catch (err: any) {
      toast.error(err.message || "Falha ao registrar avaliação.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cards.length === 0 || isFinished) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-4 max-w-lg mx-auto shadow-xl">
        <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-xl font-black text-white">Sessão de Cards Concluída!</h2>
          <p className="text-xs text-slate-400 mt-1">
            Você revisou {reviewedCount} flashcards hoje. O algoritmo de repetição espaçada agendou suas próximas revisões.
          </p>
        </div>
        <div className="pt-2 flex items-center justify-center gap-3">
          <Link
            href="/edital"
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
          >
            Ver Edital
          </Link>
          <Link
            href="/"
            className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md"
          >
            Voltar ao Início
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      {/* Top Bar */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>
          Card <strong className="text-white">{currentIndex + 1}</strong> de {cards.length}
        </span>
        <span className="text-emerald-400 font-semibold flex items-center gap-1">
          <Brain className="w-3.5 h-3.5" /> Repetição Espaçada Ativa
        </span>
      </div>

      {/* Cartão 3D Flip */}
      <div
        onClick={() => setIsFlipped(!isFlipped)}
        className="cursor-pointer select-none min-h-[280px] bg-gradient-to-br from-slate-900 to-slate-850 border border-slate-700 rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-xl hover:border-slate-600 transition-all"
      >
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {isFlipped ? "Verso • Resposta" : "Frente • Pergunta"}
            </span>
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <RotateCw className="w-3 h-3" /> Clique para virar
            </span>
          </div>

          <div className="pt-6">
            {!isFlipped ? (
              <p className="text-base sm:text-lg font-bold text-slate-100 leading-relaxed">
                {currentCard.front}
              </p>
            ) : (
              <p className="text-sm sm:text-base text-emerald-300 font-medium leading-relaxed whitespace-pre-line">
                {currentCard.back}
              </p>
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
          <span>{currentCard.topic?.subject?.name || "Transpetro"}</span>
          <span>{currentCard.topic?.title || ""}</span>
        </div>
      </div>

      {/* Botões de Classificação (Apenas após virar) */}
      {isFlipped ? (
        <div className="space-y-2">
          <p className="text-center text-xs text-slate-400 font-medium">
            Quão fácil foi lembrar deste conceito?
          </p>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => handleRating("DIFICIL")}
              disabled={isSubmitting}
              className="py-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-bold text-xs transition-colors"
            >
              Difícil (1 dia)
            </button>
            <button
              onClick={() => handleRating("MEDIO")}
              disabled={isSubmitting}
              className="py-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-bold text-xs transition-colors"
            >
              Médio (3 dias)
            </button>
            <button
              onClick={() => handleRating("FACIL")}
              disabled={isSubmitting}
              className="py-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs transition-colors"
            >
              Fácil (7 dias)
            </button>
          </div>
        </div>
      ) : (
        <p className="text-center text-xs text-slate-500">
          Tente lembrar da resposta mentalmente antes de virar o cartão!
        </p>
      )}
    </div>
  );
};
