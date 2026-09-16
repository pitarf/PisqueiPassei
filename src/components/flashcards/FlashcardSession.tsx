"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Layers, RotateCw, CheckCircle2, ArrowRight, Brain, Clock } from "lucide-react";

interface Flashcard { id: string; front: string; back: string; topic?: { title: string; code?: string | null; subject?: { name: string } } }
interface FlashcardSessionProps { cards: Flashcard[] }

export const FlashcardSession: React.FC<FlashcardSessionProps> = ({ cards }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (isFinished) return;
    const timer = window.setInterval(() => setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => window.clearInterval(timer);
  }, [startedAt, isFinished]);

  const currentCard = cards[currentIndex];
  const handleRating = async (rating: "FACIL" | "MEDIO" | "DIFICIL") => {
    if (!currentCard || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/flashcards", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ flashcardId: currentCard.id, rating }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Erro ao registrar revisão do card.");
      if (!data.duplicate) setReviewedCount((prev) => prev + 1);
      if (!data.duplicate) toast.success(rating === "FACIL" ? "Card dominado! Próxima revisão programada." : rating === "MEDIO" ? "Revisão registrada. O próximo intervalo foi ajustado." : "Card marcado para revisão mais próxima.");
      if (currentIndex + 1 < cards.length) { setIsFlipped(false); setCurrentIndex((prev) => prev + 1); setStartedAt(Date.now()); setElapsedSeconds(0); }
      else setIsFinished(true);
    } catch (err: any) { toast.error(err.message || "Falha ao registrar avaliação."); }
    finally { setIsSubmitting(false); }
  };

  if (cards.length === 0 || isFinished) {
    const minutes = Math.max(1, Math.round(elapsedSeconds / 60));
    return <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-4 max-w-lg mx-auto shadow-xl"><div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto"><CheckCircle2 className="w-7 h-7" /></div><div><h2 className="text-xl font-black text-white">Sessão de Cards Concluída!</h2><p className="text-xs text-slate-400 mt-1">Você revisou {reviewedCount} flashcards nesta sessão. As próximas revisões foram agendadas pelo SRS.</p></div><div className="grid grid-cols-2 gap-3 bg-slate-800/70 rounded-xl p-3"><div><span className="text-[11px] text-slate-400">Cards revisados</span><p className="text-lg font-black text-emerald-300">{reviewedCount}</p></div><div><span className="text-[11px] text-slate-400">Tempo</span><p className="text-lg font-black text-amber-300">{minutes} min</p></div></div><div className="pt-2 flex items-center justify-center gap-3"><Link href="/edital" className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold">Ver Edital</Link><Link href="/" className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md">Voltar ao Início</Link></div></div>;
  }

  return <div className="space-y-6 max-w-xl mx-auto">
    <div className="flex items-center justify-between text-xs text-slate-400"><span>Card <strong className="text-white">{currentIndex + 1}</strong> de {cards.length}</span><span className="flex items-center gap-2"><span className="text-emerald-400 font-semibold flex items-center gap-1"><Brain className="w-3.5 h-3.5" /> SRS ativo</span><span className="flex items-center gap-1 text-slate-500"><Clock className="w-3 h-3" />{Math.floor(elapsedSeconds/60)}:{String(elapsedSeconds%60).padStart(2,"0")}</span></span></div>
    <div onClick={() => setIsFlipped(!isFlipped)} className="cursor-pointer select-none min-h-[280px] bg-gradient-to-br from-slate-900 to-slate-850 border border-slate-700 rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-xl hover:border-slate-600 transition-all" role="button" tabIndex={0} onKeyDown={(e)=>{if(e.key==="Enter"||e.key===" ")setIsFlipped(!isFlipped)}} aria-label={isFlipped?"Virar para a pergunta":"Virar para a resposta"}><div><div className="flex items-center justify-between pb-3 border-b border-slate-800"><span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{isFlipped ? "Verso • Resposta" : "Frente • Pergunta"}</span><span className="text-xs text-slate-500 flex items-center gap-1"><RotateCw className="w-3 h-3" /> {isFlipped ? "Clique para voltar" : "Clique para virar"}</span></div><div className="pt-6">{!isFlipped ? <p className="text-base sm:text-lg font-bold text-slate-100 leading-relaxed">{currentCard.front}</p> : <p className="text-sm sm:text-base text-emerald-300 font-medium leading-relaxed whitespace-pre-line">{currentCard.back}</p>}</div></div><div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500"><span>{currentCard.topic?.subject?.name || "Transpetro"}</span><span className="truncate max-w-[60%]">{currentCard.topic?.code ? `${currentCard.topic.code} • ` : ""}{currentCard.topic?.title || ""}</span></div></div>
    {isFlipped ? <div className="space-y-2"><p className="text-center text-xs text-slate-400 font-medium">Quão fácil foi lembrar deste conceito?</p><div className="grid grid-cols-3 gap-3"><button onClick={()=>handleRating("DIFICIL")} disabled={isSubmitting} className="py-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-bold text-xs transition-colors">Difícil</button><button onClick={()=>handleRating("MEDIO")} disabled={isSubmitting} className="py-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-bold text-xs transition-colors">Médio</button><button onClick={()=>handleRating("FACIL")} disabled={isSubmitting} className="py-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs transition-colors">Fácil</button></div><p className="text-center text-[10px] text-slate-500">A próxima data é calculada pelo motor de repetição espaçada.</p></div> : <p className="text-center text-xs text-slate-500">Tente responder mentalmente antes de virar o cartão.</p>}
  </div>;
};
