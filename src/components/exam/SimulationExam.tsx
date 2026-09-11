"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Award,
  ChevronLeft,
  ChevronRight,
  Send,
  Flag,
  RotateCcw,
} from "lucide-react";
import { ExamDiagnostic } from "@/lib/exam";

interface SimulationExamProps {
  questions: any[];
}

export const SimulationExam: React.FC<SimulationExamProps> = ({ questions }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(4 * 60 * 60); // 4 horas
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [diagnostic, setDiagnostic] = useState<ExamDiagnostic | null>(null);

  // Cronômetro de prova oficial (4 horas)
  useEffect(() => {
    if (isSubmitted) return;

    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isSubmitted]);

  const currentQ = questions[currentIndex];

  const handleSelectOption = (opt: string) => {
    if (!isSubmitted) {
      setAnswers((prev) => ({ ...prev, [currentQ.id]: opt }));
    }
  };

  const toggleFlag = () => {
    setFlagged((prev) => ({ ...prev, [currentQ.id]: !prev[currentQ.id] }));
  };

  const handleSubmitExam = async () => {
    const answeredCount = Object.keys(answers).length;
    if (answeredCount < questions.length && timeLeftSeconds > 60) {
      const confirmSubmit = window.confirm(
        `Você respondeu ${answeredCount} de ${questions.length} questões. Deseja realmente finalizar o simulado agora?`
      );
      if (!confirmSubmit) return;
    }

    setIsSubmitting(true);
    try {
      const totalTimeSpent = 4 * 60 * 60 - timeLeftSeconds;
      const res = await fetch("/api/simulado", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Simulado Cesgranrio #${new Date().toLocaleDateString("pt-BR")}`,
          durationSeconds: totalTimeSpent,
          answers,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar simulado.");

      setDiagnostic(data.diagnostic);
      setIsSubmitted(true);
      toast.success("Simulado concluído e computado com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Falha ao enviar simulado.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Formatar tempo regressivo (hh:mm:ss)
  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(
      s
    ).padStart(2, "0")}`;
  };

  // Se simulado submetido, mostrar Relatório Oficial de Desempenho
  if (isSubmitted && diagnostic) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 max-w-2xl mx-auto shadow-2xl">
        <div className="text-center space-y-2">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${
              diagnostic.isAboveTarget
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                : "bg-amber-500/20 text-amber-400 border border-amber-500/40"
            }`}
          >
            <Award className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-white">Resultado do Simulado</h2>
          <p className="text-xs text-slate-400">
            TRANSPETRO 2026.3 • Ênfase 18 (Cesgranrio)
          </p>
        </div>

        {/* Card de Pontuação e Meta */}
        <div className="bg-slate-800/80 p-5 rounded-xl border border-slate-700/70 text-center">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
            Sua Nota na Prova
          </p>
          <div className="text-4xl font-black text-white mt-1 flex items-baseline justify-center gap-1">
            <span
              className={
                diagnostic.isAboveTarget ? "text-emerald-400" : "text-amber-400"
              }
            >
              {diagnostic.totalScore}
            </span>
            <span className="text-lg text-slate-400">/ {diagnostic.maxScore} pontos</span>
          </div>
          <p className="text-xs mt-1.5 font-medium">
            {diagnostic.isAboveTarget ? (
              <span className="text-emerald-400">
                🎉 Você atingiu a meta de corte de {diagnostic.targetScore} pontos (+{diagnostic.pointsToTarget} pts)!
              </span>
            ) : (
              <span className="text-amber-400">
                ⚠️ Você está a {Math.abs(diagnostic.pointsToTarget)} pontos da meta ({diagnostic.targetScore} pts).
              </span>
            )}
          </p>
        </div>

        {/* Diagnóstico de Eliminação */}
        {diagnostic.isEliminated ? (
          <div className="bg-rose-950/40 border border-rose-800 p-4 rounded-xl space-y-1.5">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
              <AlertTriangle className="w-4 h-4" /> ATENÇÃO: CRITÉRIO DE ELIMINAÇÃO DO EDITAL
            </div>
            {diagnostic.eliminationReasons.map((reason, i) => (
              <p key={i} className="text-xs text-rose-200">
                • {reason}
              </p>
            ))}
          </div>
        ) : (
          <div className="bg-emerald-950/30 border border-emerald-800/60 p-3.5 rounded-xl flex items-center gap-2 text-xs text-emerald-300 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Critérios mínimos de eliminação do edital superados com sucesso!</span>
          </div>
        )}

        {/* Desempenho por Disciplina */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Desempenho por Disciplina
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 text-center">
              <p className="text-[11px] text-slate-400">Português</p>
              <p className="text-base font-bold text-white mt-0.5">
                {diagnostic.breakdown.portugueseScore} / {diagnostic.breakdown.portugueseTotal}
              </p>
            </div>
            <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 text-center">
              <p className="text-[11px] text-slate-400">Matemática</p>
              <p className="text-base font-bold text-white mt-0.5">
                {diagnostic.breakdown.mathScore} / {diagnostic.breakdown.mathTotal}
              </p>
            </div>
            <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 text-center">
              <p className="text-[11px] text-slate-400">Específicas</p>
              <p className="text-base font-bold text-emerald-400 mt-0.5">
                {diagnostic.breakdown.specificScore} / {diagnostic.breakdown.specificTotal}
              </p>
            </div>
          </div>
        </div>

        {/* Recomendações Pedagógicas */}
        {diagnostic.recommendations.length > 0 && (
          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 space-y-1.5">
            <p className="text-xs font-bold text-slate-300">Recomendações do Professor IA:</p>
            {diagnostic.recommendations.map((rec, i) => (
              <p key={i} className="text-xs text-slate-400">
                → {rec}
              </p>
            ))}
          </div>
        )}

        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            href="/simulado"
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
          >
            Ver Histórico
          </Link>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md"
          >
            Voltar ao Início
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-4xl mx-auto pb-16">
      {/* Top Bar de Prova Oficial */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex items-center justify-between shadow-md">
        <div>
          <span className="text-xs font-bold text-emerald-400">
            SIMULADO OFICIAL TRANSPETRO • 60 QUESTÕES
          </span>
          <p className="text-xs text-slate-400">
            Respondidas: <strong className="text-white">{Object.keys(answers).length}</strong> de {questions.length}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Cronômetro */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${
              timeLeftSeconds < 1800
                ? "bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse"
                : "bg-slate-800 text-amber-400 border-slate-700"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{formatTime(timeLeftSeconds)}</span>
          </div>

          <button
            onClick={handleSubmitExam}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-colors flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Finalizar Prova</span>
          </button>
        </div>
      </div>

      {/* Grade Rápida de Questões (Cartão de Respostas) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4">
        <p className="text-[11px] font-semibold text-slate-400 uppercase mb-2">
          Folha de Respostas Rápida (Clique para Navegar)
        </p>
        <div className="flex flex-wrap gap-1.5">
          {questions.map((q, idx) => {
            const hasAnswer = Boolean(answers[q.id]);
            const isFlag = Boolean(flagged[q.id]);
            const isCurrent = idx === currentIndex;

            let btnClass =
              "w-7 h-7 text-[11px] font-bold rounded-md border flex items-center justify-center transition-all ";

            if (isCurrent) {
              btnClass += "border-white text-white ring-2 ring-emerald-400 scale-105 ";
            } else {
              btnClass += "border-slate-700 text-slate-400 ";
            }

            if (hasAnswer) {
              btnClass += "bg-emerald-500/30 text-emerald-300 border-emerald-500/50 ";
            } else if (isFlag) {
              btnClass += "bg-amber-500/30 text-amber-300 border-amber-500/50 ";
            } else {
              btnClass += "bg-slate-800/80 ";
            }

            return (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(idx)}
                className={btnClass}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Card da Questão Atual */}
      {currentQ && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-7 space-y-5 shadow-md">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-xs font-bold bg-slate-800 text-slate-200 rounded border border-slate-700">
                Questão {currentIndex + 1} de {questions.length}
              </span>
              <span className="text-xs text-slate-400 truncate max-w-xs">
                {currentQ.topic?.subject?.name || "Transpetro 2026.3"}
              </span>
            </div>

            <button
              onClick={toggleFlag}
              className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                flagged[currentQ.id]
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                  : "bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200"
              }`}
            >
              <Flag className="w-3.5 h-3.5" />
              <span>{flagged[currentQ.id] ? "Marcada para Revisão" : "Marcar"}</span>
            </button>
          </div>

          <p className="text-sm sm:text-base text-slate-100 font-medium leading-relaxed whitespace-pre-line">
            {currentQ.statement}
          </p>

          {/* Alternativas A a E */}
          <div className="space-y-2 pt-2">
            {["A", "B", "C", "D", "E"].map((opt) => {
              const optKey = `option${opt}`;
              const optText = currentQ[optKey];
              if (!optText) return null;

              const isSelected = answers[currentQ.id] === opt;

              return (
                <button
                  key={opt}
                  onClick={() => handleSelectOption(opt)}
                  className={`w-full text-left p-3 sm:p-3.5 rounded-xl text-xs sm:text-sm font-medium border transition-all flex items-start gap-3 ${
                    isSelected
                      ? "bg-emerald-500/20 border-emerald-500 text-white shadow-sm"
                      : "bg-slate-800/70 hover:bg-slate-800 border-slate-700/80 text-slate-300"
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      isSelected
                        ? "bg-emerald-500 text-slate-950"
                        : "bg-slate-700 text-slate-300"
                    }`}
                  >
                    {opt}
                  </span>
                  <span className="leading-snug pt-0.5">{optText}</span>
                </button>
              );
            })}
          </div>

          {/* Navegação Entre Questões */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Anterior</span>
            </button>

            <button
              onClick={() =>
                setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))
              }
              disabled={currentIndex === questions.length - 1}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <span>Próxima</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
