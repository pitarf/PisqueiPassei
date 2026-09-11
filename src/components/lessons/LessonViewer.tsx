"use client";

import React, { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Target,
  Lightbulb,
  BookOpen,
  Building2,
  AlertTriangle,
  Brain,
  ListChecks,
  Layers,
  HelpCircle,
  Sparkles,
  Bot,
  RotateCcw,
  CheckCircle2,
  XCircle,
} from "lucide-react";

interface LessonViewerProps {
  topic: {
    id: string;
    code: string | null;
    title: string;
    subject: { name: string };
    officialSource: string | null;
  };
  initialLesson: any | null;
}

export const LessonViewer: React.FC<LessonViewerProps> = ({
  topic,
  initialLesson,
}) => {
  const [lesson, setLesson] = useState(initialLesson);
  const [loading, setLoading] = useState(!initialLesson);
  const [feedbackSending, setFeedbackSending] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("todas");
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [showAnswer, setShowAnswer] = useState<Record<number, boolean>>({});

  // Carregar ou gerar aula se não existir
  const handleGenerate = async (force: boolean = false) => {
    setLoading(true);
    try {
      const res = await fetch("/api/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId: topic.id, forceRegenerate: force }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao carregar aula.");

      setLesson(data.lesson);
      toast.success(
        data.cached
          ? "Aula carregada instantaneamente do cache local!"
          : "Aula gerada e salva no banco de dados com sucesso!"
      );
    } catch (err: any) {
      toast.error(err.message || "Não foi possível gerar a aula.");
    } finally {
      setLoading(false);
    }
  };

  // Enviar feedback de domínio (SRS)
  const handleFeedback = async (feedbackType: "NAO_ENTENDI" | "REVISAR" | "ENTENDI") => {
    setFeedbackSending(true);
    try {
      const res = await fetch("/api/progress/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId: topic.id, feedback: feedbackType }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar progresso.");

      if (feedbackType === "ENTENDI") {
        toast.success("Excelente! Domínio atualizado (+15%) e próxima revisão agendada.");
      } else if (feedbackType === "REVISAR") {
        toast.info("Anotado! Este tópico voltará ao seu ciclo de revisões em breve.");
      } else {
        toast.warning("Sem problemas! Rebaixamos o intervalo e o tópico foi marcado para amanhã.");
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao registrar domínio.");
    } finally {
      setFeedbackSending(false);
    }
  };

  const sections = lesson?.contentJson || {};

  return (
    <div className="space-y-6 pb-12">
      {/* Header do Tópico */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-emerald-400">
                {topic.subject.name}
              </span>
              {topic.code && (
                <span className="px-2 py-0.5 text-xs font-mono font-bold bg-slate-800 text-slate-300 rounded border border-slate-700">
                  {topic.code}
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
              {topic.title}
            </h1>
            {topic.officialSource && (
              <p className="text-xs font-medium text-emerald-400/90 mt-1">
                Fundamento Oficial: {topic.officialSource}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <Link
              href={`/professor?pergunta=Explique o tópico ${topic.title}`}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <Bot className="w-3.5 h-3.5 text-emerald-400" />
              <span>Dúvida com Professor</span>
            </Link>

            <button
              onClick={() => handleGenerate(true)}
              disabled={loading}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1.5"
              title="Regerar aula com IA"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Regerar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Estado de Carregamento */}
      {loading && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center space-y-3">
          <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-200">
            O Professor IA está montando sua aula estruturada em 9 etapas...
          </p>
          <p className="text-xs text-slate-400">
            Consultando o edital oficial e mapeando pegadinhas da Fundação Cesgranrio.
          </p>
        </div>
      )}

      {/* Conteúdo da Aula */}
      {!loading && lesson && (
        <div className="space-y-5">
          {/* Seção 1: O que você precisa aprender */}
          {sections.step1_whatYouNeedToLearn && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center gap-2 text-emerald-400 mb-2">
                <Target className="w-4 h-4" />
                <h3 className="text-sm font-bold uppercase tracking-wider">
                  1. O que você precisa aprender para a prova
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                {sections.step1_whatYouNeedToLearn}
              </p>
            </div>
          )}

          {/* Seção 2: Explicação Simples */}
          {sections.step2_simpleExplanation && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center gap-2 text-amber-400 mb-2">
                <Lightbulb className="w-4 h-4" />
                <h3 className="text-sm font-bold uppercase tracking-wider">
                  2. Entendendo de Forma Simples e Direta
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                {sections.step2_simpleExplanation}
              </p>
            </div>
          )}

          {/* Seção 3: Conceitos Fundamentais */}
          {sections.step3_fundamentalConcepts && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center gap-2 text-sky-400 mb-2">
                <BookOpen className="w-4 h-4" />
                <h3 className="text-sm font-bold uppercase tracking-wider">
                  3. Conceitos Fundamentais & Conteúdo do Edital
                </h3>
              </div>
              <div className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line prose-invert max-w-none">
                {sections.step3_fundamentalConcepts}
              </div>
            </div>
          )}

          {/* Seção 4: Exemplos Práticos */}
          {sections.step4_examples && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center gap-2 text-teal-400 mb-2">
                <Building2 className="w-4 h-4" />
                <h3 className="text-sm font-bold uppercase tracking-wider">
                  4. Casos Práticos na Realidade da Transpetro
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                {sections.step4_examples}
              </p>
            </div>
          )}

          {/* Seção 5: Pegadinhas Clássicas da Cesgranrio */}
          {sections.step5_cesgranrioTraps && (
            <div className="bg-rose-950/30 border border-rose-850 rounded-2xl p-5">
              <div className="flex items-center gap-2 text-rose-400 mb-2">
                <AlertTriangle className="w-4 h-4" />
                <h3 className="text-sm font-bold uppercase tracking-wider">
                  5. Pegadinhas Clássicas da Fundação Cesgranrio
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line font-medium">
                {sections.step5_cesgranrioTraps}
              </p>
            </div>
          )}

          {/* Seção 6: O que Memorizar */}
          {sections.step6_whatToMemorize && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center gap-2 text-purple-400 mb-2">
                <Brain className="w-4 h-4" />
                <h3 className="text-sm font-bold uppercase tracking-wider">
                  6. O que Memorizar (Mnemônicos e Regras de Ouro)
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                {sections.step6_whatToMemorize}
              </p>
            </div>
          )}

          {/* Seção 7: Resumo Executivo */}
          {sections.step7_summary && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center gap-2 text-indigo-400 mb-2">
                <ListChecks className="w-4 h-4" />
                <h3 className="text-sm font-bold uppercase tracking-wider">
                  7. Resumo Rápido para Revisão
                </h3>
              </div>
              <div className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                {sections.step7_summary}
              </div>
            </div>
          )}

          {/* Seção 8: Flashcards do Tópico */}
          {sections.step8_flashcards && sections.step8_flashcards.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-amber-400">
                  <Layers className="w-4 h-4" />
                  <h3 className="text-sm font-bold uppercase tracking-wider">
                    8. Flashcards Chave Deste Assunto
                  </h3>
                </div>
                <Link
                  href="/flashcards"
                  className="text-xs text-amber-400 hover:text-amber-300 font-semibold"
                >
                  Treinar no Modo Cards →
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {sections.step8_flashcards.map((fc: any, i: number) => (
                  <div
                    key={i}
                    className="bg-slate-800/80 border border-slate-700/70 rounded-xl p-4 space-y-2"
                  >
                    <p className="text-xs font-semibold text-slate-200">
                      Q: {fc.front}
                    </p>
                    <div className="pt-2 border-t border-slate-700/60">
                      <p className="text-xs text-emerald-400 font-medium">
                        R: {fc.back}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Seção 9: Questões de Fixação */}
          {sections.step9_practiceQuestions && sections.step9_practiceQuestions.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center gap-2 text-emerald-400 mb-4">
                <HelpCircle className="w-4 h-4" />
                <h3 className="text-sm font-bold uppercase tracking-wider">
                  9. Questões de Fixação (Padrão Cesgranrio)
                </h3>
              </div>

              <div className="space-y-5">
                {sections.step9_practiceQuestions.map((q: any, qIdx: number) => {
                  const selected = selectedAnswers[qIdx];
                  const revealed = showAnswer[qIdx];
                  const isCorrect = selected === q.correctOption;

                  return (
                    <div
                      key={qIdx}
                      className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400">
                          Questão de Fixação {qIdx + 1}
                        </span>
                        <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded">
                          Questão gerada por IA, baseada no conteúdo do edital
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-200 font-medium leading-relaxed">
                        {q.statement}
                      </p>

                      {/* Alternativas A a E */}
                      <div className="space-y-1.5">
                        {["A", "B", "C", "D", "E"].map((opt) => {
                          const optKey = `option${opt}`;
                          const optText = q[optKey];
                          if (!optText) return null;

                          const isOptionSelected = selected === opt;
                          const isOptionCorrect = q.correctOption === opt;

                          let btnClasses =
                            "w-full text-left p-2.5 rounded-lg text-xs font-medium border transition-colors flex items-start gap-2.5 ";

                          if (revealed) {
                            if (isOptionCorrect) {
                              btnClasses += "bg-emerald-500/20 border-emerald-500 text-emerald-300";
                            } else if (isOptionSelected) {
                              btnClasses += "bg-rose-500/20 border-rose-500 text-rose-300";
                            } else {
                              btnClasses += "bg-slate-800/60 border-slate-700/60 text-slate-400";
                            }
                          } else {
                            if (isOptionSelected) {
                              btnClasses += "bg-emerald-500/20 border-emerald-500 text-white";
                            } else {
                              btnClasses += "bg-slate-800/60 hover:bg-slate-700/80 border-slate-700/60 text-slate-300";
                            }
                          }

                          return (
                            <button
                              key={opt}
                              onClick={() => {
                                if (!revealed) {
                                  setSelectedAnswers((prev) => ({ ...prev, [qIdx]: opt }));
                                }
                              }}
                              className={btnClasses}
                            >
                              <span className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                                {opt}
                              </span>
                              <span className="leading-snug">{optText}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Botão de Conferir */}
                      {!revealed ? (
                        <button
                          onClick={() => {
                            if (selected) {
                              setShowAnswer((prev) => ({ ...prev, [qIdx]: true }));
                            } else {
                              toast.info("Selecione uma alternativa antes de conferir!");
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors"
                        >
                          Conferir Resposta
                        </button>
                      ) : (
                        <div className="pt-2 border-t border-slate-700/70 space-y-1.5">
                          <div className="flex items-center gap-1.5">
                            {isCorrect ? (
                              <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold">
                                <CheckCircle2 className="w-4 h-4" /> Correto!
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-rose-400 text-xs font-bold">
                                <XCircle className="w-4 h-4" /> Resposta correta: {q.correctOption}
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-700/50">
                            {q.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Barra Fixa de Feedback Cognitivo (Domínio SRS) */}
      {!loading && lesson && (
        <div className="fixed bottom-14 sm:bottom-4 left-0 right-0 z-30 px-4">
          <div className="max-w-2xl mx-auto bg-slate-900/95 backdrop-blur-md border border-slate-700 p-3 sm:p-4 rounded-2xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-slate-300 font-semibold text-center sm:text-left">
              Como você avalia seu domínio deste conteúdo?
            </span>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => handleFeedback("NAO_ENTENDI")}
                disabled={feedbackSending}
                className="flex-1 sm:flex-initial px-3 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-bold text-xs transition-all active:scale-95"
              >
                Não entendi
              </button>
              <button
                onClick={() => handleFeedback("REVISAR")}
                disabled={feedbackSending}
                className="flex-1 sm:flex-initial px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-bold text-xs transition-all active:scale-95"
              >
                Preciso revisar
              </button>
              <button
                onClick={() => handleFeedback("ENTENDI")}
                disabled={feedbackSending}
                className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all active:scale-95 shadow-md shadow-emerald-500/20"
              >
                Entendi!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
