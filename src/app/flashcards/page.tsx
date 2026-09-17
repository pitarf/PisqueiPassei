import React from "react";
import { prisma } from "@/lib/prisma";
import { FlashcardSession } from "@/components/flashcards/FlashcardSession";
import Link from "next/link";
import { BookOpen, CheckCircle2, Layers } from "lucide-react";

export const revalidate = 0;

export default async function FlashcardsPage() {
  const user = await prisma.user.findFirst({ where: { email: "rafael@estudos.transpetro" } });
  const now = new Date();
  const cards = user ? await prisma.flashcard.findMany({
    include: { topic: { include: { subject: true } }, reviews: { where: { userId: user.id }, orderBy: { reviewedAt: "desc" }, take: 1 } },
    orderBy: { createdAt: "desc" },
  }) : [];
  const dueCards = cards.filter((card) => !card.reviews[0] || card.reviews[0].nextReviewDate <= now).slice(0, 30);
  const totalCards = cards.length;

  return <div className="space-y-6">
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-md">
      <div className="flex items-center gap-2"><span className="px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-md">Revisão</span><span className="text-xs text-slate-400">Repetição espaçada</span></div>
      <h1 className="text-xl sm:text-2xl font-black text-white mt-1">Flashcards • Transpetro 2026.3</h1>
      <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed max-w-2xl">Revise termos, prazos legais e conceitos recorrentes da banca. Cartões novos e revisões do dia aparecem primeiro.</p>
      <div className="flex flex-wrap gap-2 mt-4"><span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-[11px] text-slate-300"><Layers className="inline w-3 h-3 mr-1" />{totalCards} cartões no total</span><span className="px-2.5 py-1 rounded-lg bg-sky-500/10 border border-sky-500/20 text-[11px] text-sky-300">{dueCards.length} para hoje</span></div>
    </div>
    {dueCards.length > 0 ? <FlashcardSession cards={dueCards} /> : <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center space-y-3 max-w-md mx-auto"><div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto"><CheckCircle2 className="w-6 h-6" /></div><h3 className="text-base font-bold text-white">Tudo em dia por aqui!</h3><p className="text-xs text-slate-400 leading-relaxed">Você revisou todos os cartões programados para hoje. Novos cartões aparecerão no próximo ciclo de revisão.</p><Link href="/edital" className="px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" /> Estudar outro assunto</Link></div>}
  </div>;
}
