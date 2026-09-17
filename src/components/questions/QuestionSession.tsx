"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Clock, CheckCircle2, XCircle, ArrowRight, Bot, Award } from "lucide-react";

interface Question {
  id: string; statement: string; optionA: string; optionB: string; optionC: string; optionD: string; optionE: string;
  correctOption: string; explanation: string; origin: string; difficulty: string;
  topic?: { title: string; code?: string | null; subject?: { name: string } };
}
interface QuestionSessionProps { initialQuestions: Question[]; title: string; modeDescription?: string }

export const QuestionSession: React.FC<QuestionSessionProps> = ({ initialQuestions, title }) => {
  const [questions] = useState<Question[]>(initialQuestions);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<{ isCorrect: boolean; explanation: string; correctOption: string } | null>(null);
  const [sessionResults, setSessionResults] = useState<{ questionId: string; isCorrect: boolean }[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [idempotencyKey, setIdempotencyKey] = useState("");

  useEffect(() => {
    if (isFinished) return;
    const interval = setInterval(() => setTimerSeconds((prev) => prev + 1), 1000);
    return () => clearInterval(interval);
  }, [isFinished]);

  const currentQuestion = questions[currentIndex];

  const handleSubmitAnswer = async () => {
    if (!selectedOption || !currentQuestion || isSubmitting) {
      if (!selectedOption) toast.info("Escolha uma das alternativas de A a E antes de confirmar.");
      return;
    }
    const submissionKey = idempotencyKey || crypto.randomUUID();
    setIdempotencyKey(submissionKey);
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/questions/submit", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: currentQuestion.id, chosenOption: selectedOption, timeSpentSeconds: timerSeconds, idempotencyKey: submissionKey }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Não conseguimos registrar sua resposta agora.");
      setIsAnswered(true);
      setLastResult({ isCorrect: data.isCorrect, explanation: data.explanation || currentQuestion.explanation, correctOption: data.correctOption || currentQuestion.correctOption });
      setSessionResults((prev) => prev.some((item) => item.questionId === currentQuestion.id) ? prev : [...prev, { questionId: currentQuestion.id, isCorrect: data.isCorrect }]);
      if (data.isCorrect) toast.success(data.duplicate ? "Você acertou!" : "Na mosca! Resposta certa (+10 XP).");
      else toast.error(`Não foi dessa vez. A alternativa correta era a ${data.correctOption}.`);
    } catch (err: any) {
      toast.error(err.message || "Tivemos um problema de conexão. Tente novamente.");
    } finally { setIsSubmitting(false); }
  };

  const handleNextQuestion = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1); setSelectedOption(null); setIsAnswered(false); setLastResult(null); setTimerSeconds(0); setIdempotencyKey("");
    } else setIsFinished(true);
  };

  if (isFinished) {
    const total = sessionResults.length, correctCount = sessionResults.filter((r) => r.isCorrect).length, accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    return <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 text-center space-y-5 max-w-xl mx-auto shadow-xl"><div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto"><Award className="w-8 h-8" /></div><div><h2 className="text-xl sm:text-2xl font-black text-white">Treino concluído!</h2><p className="text-xs sm:text-sm text-slate-400 mt-1">Seu progresso foi salvo e seu painel de domínio dos temas já está atualizado.</p></div><div className="grid grid-cols-3 gap-3 bg-slate-800/80 p-4 rounded-xl border border-slate-700/60"><div><p className="text-[11px] text-slate-400">Respondidas</p><p className="text-xl font-bold text-white">{total}</p></div><div><p className="text-[11px] text-slate-400">Acertos</p><p className="text-xl font-bold text-emerald-400">{correctCount}</p></div><div><p className="text-[11px] text-slate-400">Aproveitamento</p><p className="text-xl font-bold text-sky-400">{accuracy}%</p></div></div><div className="flex items-center justify-center gap-3 pt-3"><Link href="/questoes" className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs">Treinar Mais</Link><Link href="/" className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md">Voltar ao Início</Link></div></div>;
  }
  if (!currentQuestion) return <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center"><p className="text-sm text-slate-300">Nenhuma questão encontrada para este filtro.</p><Link href="/questoes" className="mt-3 px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold inline-block">Ver Outros Temas</Link></div>;

  return <div className="space-y-5 max-w-3xl mx-auto pb-24 sm:pb-12"><div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-sm"><div><span className="text-xs font-bold text-emerald-400">{title}</span><p className="text-xs text-slate-400">Questão <span className="text-white font-bold">{currentIndex + 1}</span> de <span className="text-slate-200">{questions.length}</span></p></div><div className="flex items-center gap-3"><div className="flex items-center gap-1 bg-slate-800 px-3 py-1.5 rounded-full text-xs text-slate-300 border border-slate-700"><Clock className="w-3.5 h-3.5 text-amber-400" /><span>{Math.floor(timerSeconds / 60)}:{String(timerSeconds % 60).padStart(2, "0")}</span></div></div></div><div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-7 space-y-5 shadow-md"><div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800"><div className="flex items-center gap-2 flex-wrap">{currentQuestion.topic?.subject?.name && <span className="text-xs font-medium text-slate-400">{currentQuestion.topic.subject.name}</span>}{currentQuestion.topic?.title && <span className="px-2 py-0.5 text-[11px] bg-slate-800 text-slate-300 rounded border border-slate-700 truncate max-w-xs">{currentQuestion.topic.title}</span>}<span className="px-2 py-0.5 text-[10px] uppercase font-bold bg-slate-800 text-slate-400 rounded border border-slate-700">{currentQuestion.difficulty}</span></div><span className={`text-[10px] px-2 py-0.5 rounded border ${currentQuestion.origin === "CESGRANRIO_REAL" ? "bg-sky-500/10 text-sky-300 border-sky-500/30" : "bg-violet-500/10 text-violet-300 border-violet-500/30"}`}>{currentQuestion.origin === "CESGRANRIO_REAL" ? "Prova oficial" : "Questão inédita"}</span></div><p className="text-sm sm:text-base text-slate-100 font-medium leading-relaxed whitespace-pre-line">{currentQuestion.statement}</p><div className="space-y-2 pt-2">{["A", "B", "C", "D", "E"].map((opt) => { const optText = currentQuestion[`option${opt}` as keyof Question] as string; if (!optText) return null; const isSelected = selectedOption === opt, isCorrectAnswer = currentQuestion.correctOption === opt; let btnClass = "w-full text-left p-3 sm:p-3.5 rounded-xl text-xs sm:text-sm font-medium border transition-all flex items-start gap-3 "; if (isAnswered) { if (isCorrectAnswer) btnClass += "bg-emerald-500/20 border-emerald-500 text-emerald-300"; else if (isSelected) btnClass += "bg-rose-500/20 border-rose-500 text-rose-300"; else btnClass += "bg-slate-800/50 border-slate-800 text-slate-500 opacity-60"; } else if (isSelected) btnClass += "bg-emerald-500/15 border-emerald-500 text-emerald-200 shadow-sm"; else btnClass += "bg-slate-800/70 hover:bg-slate-800 border-slate-700/80 text-slate-200 hover:border-slate-600"; return <button key={opt} onClick={() => !isAnswered && !isSubmitting && setSelectedOption(opt)} disabled={isAnswered || isSubmitting} className={btnClass}><span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isSelected ? "bg-emerald-500 text-slate-950" : "bg-slate-700 text-slate-300"}`}>{opt}</span><span className="leading-snug pt-0.5">{optText}</span></button>; })}</div><div className="pt-4 border-t border-slate-800 flex items-center justify-between"><Link href={`/professor?pergunta=${encodeURIComponent(`Explique a questão: ${currentQuestion.statement.slice(0, 150)}`)}`} className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5"><Bot className="w-3.5 h-3.5 text-emerald-400" /><span className="hidden sm:inline">Pedir explicação ao Professor IA</span></Link>{!isAnswered ? <button onClick={handleSubmitAnswer} disabled={!selectedOption || isSubmitting} className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs sm:text-sm shadow-md flex items-center gap-1.5"><span>{isSubmitting ? "Enviando..." : "Responder"}</span><CheckCircle2 className="w-4 h-4" /></button> : <button onClick={handleNextQuestion} className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs sm:text-sm shadow-md flex items-center gap-1.5"><span>{currentIndex + 1 < questions.length ? "Próxima Questão" : "Concluir Bateria"}</span><ArrowRight className="w-4 h-4" /></button>}</div>{isAnswered && lastResult && <div className="mt-4 p-4 rounded-xl bg-slate-850 border border-slate-700/80 space-y-2"><div>{lastResult.isCorrect ? <span className="text-emerald-400 font-bold text-xs flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Resposta certa!</span> : <span className="text-rose-400 font-bold text-xs flex items-center gap-1"><XCircle className="w-4 h-4" /> Gabarito: Alternativa {lastResult.correctOption}</span>}</div><p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">{lastResult.explanation}</p></div>}</div></div>;
};
