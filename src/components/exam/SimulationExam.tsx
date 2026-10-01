"use client";
import React, { useEffect, useRef, useState } from "react";
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
  Target,
  Sparkles,
  BookOpen,
  ArrowRight,
  HelpCircle,
} from "lucide-react";
import type { ExamDiagnostic } from "@/lib/exam";

export const SimulationExam = ({ questions }: { questions: any[] }) => {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [left, setLeft] = useState(14400);
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [diagnostic, setDiagnostic] = useState<ExamDiagnostic | null>(null);

  const answersRef = useRef(answers);
  const leftRef = useRef(left);
  const submittedRef = useRef(false);
  const sendingRef = useRef(false);
  const questionStartedAtRef = useRef(Date.now());
  const questionTimesRef = useRef<Record<string, number>>({});
  const submissionKeyRef = useRef("");

  answersRef.current = answers;
  leftRef.current = left;
  submittedRef.current = submitted;
  sendingRef.current = sending;

  const q = questions[index];

  const recordCurrentQuestionTime = () => {
    const current = q;
    if (!current) return;
    const elapsed = Math.max(0, Math.floor((Date.now() - questionStartedAtRef.current) / 1000));
    questionTimesRef.current[current.id] = (questionTimesRef.current[current.id] || 0) + elapsed;
    questionStartedAtRef.current = Date.now();
  };

  const submit = async (force = false) => {
    if (sendingRef.current || submittedRef.current) return;
    recordCurrentQuestionTime();

    if (Object.keys(answersRef.current).some((id) => !/^[A-E]$/.test(String(answersRef.current[id]).trim().toUpperCase()))) {
      toast.error("Há uma resposta inválida. Revise a folha antes de entregar.");
      return;
    }

    const currentAnswers = answersRef.current;
    const currentLeft = leftRef.current;
    const answered = Object.keys(currentAnswers).length;

    if (!force && answered < 60 && currentLeft > 60 && !window.confirm(`Você marcou ${answered} das 60 questões. Deseja entregar o simulado agora mesmo com questões em branco?`)) {
      return;
    }

    if (!submissionKeyRef.current) submissionKeyRef.current = crypto.randomUUID();
    sendingRef.current = true;
    setSending(true);

    try {
      const res = await fetch("/api/simulado", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Simulado Transpetro 2026.3 #${new Date().toLocaleDateString("pt-BR")}`,
          durationSeconds: 14400 - currentLeft,
          answers: currentAnswers,
          questionIds: questions.map((x) => x.id),
          questionTimes: questionTimesRef.current,
          idempotencyKey: submissionKeyRef.current,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Não foi possível salvar o simulado.");

      submittedRef.current = true;
      setDiagnostic(data.diagnostic);
      setSubmitted(true);
      toast.success(data.duplicate ? "Simulado recuperado com sucesso." : "Prova entregue! Confira seu desempenho abaixo.");
    } catch (e: any) {
      toast.error(e.message || "Erro ao enviar o simulado. Verifique sua conexão e tente novamente.");
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  };

  useEffect(() => {
    if (submitted) return;
    const t = setInterval(() => {
      setLeft((v) => {
        if (v <= 1) {
          clearInterval(t);
          leftRef.current = 0;
          void submit(true);
          return 0;
        }
        const next = v - 1;
        leftRef.current = next;
        return next;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [submitted]);

  useEffect(() => {
    questionStartedAtRef.current = Date.now();
    return () => {
      recordCurrentQuestionTime();
    };
  }, [index]);

  const time = (s: number) =>
    `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const getSectionInfo = (qIdx: number) => {
    if (qIdx < 10) return { title: "Língua Portuguesa", badge: "bg-sky-500/10 text-sky-400 border-sky-500/30" };
    if (qIdx < 20) return { title: "Matemática", badge: "bg-amber-500/10 text-amber-400 border-amber-500/30" };
    return { title: "Conhecimentos Específicos", badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" };
  };

  // TELA DE RESULTADO PÓS-SIMULADO COMPLETA
  if (submitted && diagnostic) {
    const comp = diagnostic.targetComparison;
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-20">
        {/* Cabeçalho */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-3 shadow-xl">
          <Award className="w-12 h-12 mx-auto text-emerald-400" />
          <h2 className="text-2xl sm:text-3xl font-black text-white">Diagnóstico Completo do Simulado</h2>
          <p className="text-xs sm:text-sm text-slate-400">
            TRANSPETRO 2026.3 • Ênfase 18: Suprimento de Bens e Serviços • 60 Questões Oficiais
          </p>

          {/* Pontuação Principal */}
          <div className="bg-slate-800/90 rounded-2xl p-6 border border-slate-700/80 max-w-lg mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pontuação Total Obtida</span>
            <div className="flex items-baseline justify-center gap-2 mt-2">
              <span
                className={`text-5xl font-black ${
                  diagnostic.isEliminated
                    ? "text-rose-400"
                    : diagnostic.isAboveTarget
                    ? "text-emerald-400"
                    : "text-amber-400"
                }`}
              >
                {diagnostic.totalScore}
              </span>
              <span className="text-2xl font-bold text-slate-400">/ 60</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Aproveitamento Global: <b>{diagnostic.percentage}%</b> • Meta pessoal definida: <b>{diagnostic.targetScore}/60</b>
            </p>
          </div>

          {/* Status de Eliminação / Aprovação */}
          {diagnostic.isEliminated ? (
            <div className="bg-rose-950/40 border border-rose-800/80 rounded-2xl p-5 text-left max-w-2xl mx-auto">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span>Critérios Eliminatórios Oficiais Não Atingidos</span>
              </div>
              <div className="mt-2 space-y-1.5 pl-7">
                {diagnostic.eliminationReasons.map((r, i) => (
                  <p key={i} className="text-xs text-rose-200 leading-relaxed">• {r}</p>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-emerald-950/30 border border-emerald-800/80 rounded-2xl p-4 text-xs sm:text-sm text-emerald-300 flex items-center justify-center gap-2 max-w-2xl mx-auto">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>Você superou todos os critérios mínimos eliminatórios do edital Cesgranrio!</span>
            </div>
          )}
        </div>

        {/* Comparativo de Metas do Concurso */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-sky-400" />
            <h3 className="text-base font-bold text-white">Metas Pedagógicas e Aproveitamento por Disciplina</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="bg-slate-800/80 rounded-xl p-3.5 border border-slate-700/60">
              <p className="text-xs text-slate-400">Geral (Meta 47/60)</p>
              <p className="text-xl font-black text-white mt-1">{comp.overall.score} / 60</p>
              <span className={`text-[11px] font-semibold ${comp.overall.met ? "text-emerald-400" : "text-amber-400"}`}>
                {comp.overall.met ? "✓ Meta Atingida" : `Faltam ${47 - comp.overall.score} pts`}
              </span>
            </div>

            <div className="bg-slate-800/80 rounded-xl p-3.5 border border-slate-700/60">
              <p className="text-xs text-slate-400">Específicas (Meta 32+/40)</p>
              <p className="text-xl font-black text-white mt-1">{comp.specific.score} / 40</p>
              <span className={`text-[11px] font-semibold ${comp.specific.met ? "text-emerald-400" : "text-rose-400"}`}>
                {comp.specific.met ? "✓ Meta Atingida" : "Abaixo da meta de 32"}
              </span>
            </div>

            <div className="bg-slate-800/80 rounded-xl p-3.5 border border-slate-700/60">
              <p className="text-xs text-slate-400">Português (Meta 8+/10)</p>
              <p className="text-xl font-black text-white mt-1">{comp.portuguese.score} / 10</p>
              <span className={`text-[11px] font-semibold ${comp.portuguese.met ? "text-emerald-400" : "text-amber-400"}`}>
                {comp.portuguese.met ? "✓ Meta Atingida" : "Abaixo da meta de 8"}
              </span>
            </div>

            <div className="bg-slate-800/80 rounded-xl p-3.5 border border-slate-700/60">
              <p className="text-xs text-slate-400">Matemática (Meta 7+/10)</p>
              <p className="text-xl font-black text-white mt-1">{comp.math.score} / 10</p>
              <span className={`text-[11px] font-semibold ${comp.math.met ? "text-emerald-400" : "text-amber-400"}`}>
                {comp.math.met ? "✓ Meta Atingida" : "Abaixo da meta de 7"}
              </span>
            </div>
          </div>
        </div>

        {/* Desempenho por Dificuldade e Resumo de Questões */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-emerald-400" />
              Desempenho por Dificuldade
            </h4>
            <div className="space-y-2.5">
              {diagnostic.difficultyBreakdown &&
                Object.entries(diagnostic.difficultyBreakdown).map(([diff, val]) => (
                  <div key={diff} className="bg-slate-800/70 p-3 rounded-xl border border-slate-700/50">
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-300">
                        {diff === "FACIL" ? "Fácil" : diff === "MEDIA" ? "Média" : "Difícil"}
                      </span>
                      <span className="text-white">
                        {val.correct}/{val.total} ({val.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${val.percentage}%` }} />
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-400" />
              Balanço da Folha de Respostas
            </h4>
            <div className="grid grid-cols-3 gap-2.5 pt-1">
              <div className="bg-slate-800/70 p-3 rounded-xl text-center border border-slate-700/50">
                <p className="text-[11px] text-slate-400">Acertos</p>
                <p className="text-xl font-black text-emerald-400 mt-1">{diagnostic.totalScore}</p>
              </div>
              <div className="bg-slate-800/70 p-3 rounded-xl text-center border border-slate-700/50">
                <p className="text-[11px] text-slate-400">Erros</p>
                <p className="text-xl font-black text-rose-400 mt-1">{diagnostic.errorsCount}</p>
              </div>
              <div className="bg-slate-800/70 p-3 rounded-xl text-center border border-slate-700/50">
                <p className="text-[11px] text-slate-400">Em Branco</p>
                <p className="text-xl font-black text-amber-400 mt-1">{diagnostic.unansweredCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* SEU PRÓXIMO ESTUDO (PLANO PEDAGÓGICO ADAPTATIVO PÓS-SIMULADO) */}
        {diagnostic.nextStudyPlan && diagnostic.nextStudyPlan.length > 0 && (
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-emerald-500/40 rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-black text-white">Seu Próximo Estudo</h3>
              </div>
              <span className="text-xs text-slate-400">Recomendação gerada com base nos seus erros da prova</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Priorize os 4 assuntos em que você encontrou maior resistência neste simulado para fechar as lacunas de retenção:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {diagnostic.nextStudyPlan.map((item) => (
                <div
                  key={item.topicId}
                  className="bg-slate-800/90 border border-slate-700 rounded-xl p-4 flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-400">
                        {item.order}º Prioridade {item.code ? `• ${item.code}` : ""}
                      </span>
                      <span className="text-[10px] text-slate-400 truncate max-w-[140px]">{item.subject}</span>
                    </div>
                    <h4 className="text-sm font-bold text-white mt-1 line-clamp-2">{item.title}</h4>
                    <p className="text-xs text-rose-300/90 mt-1 leading-relaxed">{item.reason}</p>
                  </div>
                  <Link
                    href={`/questoes?topicId=${encodeURIComponent(item.topicId)}&count=10`}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-xs font-bold transition-all"
                  >
                    Treinar 10 Questões Deste Tema <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Botões de Ação */}
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Link
            href="/questoes?modo=erros"
            className="px-5 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-bold transition-colors"
          >
            Treinar Meus Erros Agora
          </Link>
          <Link
            href="/simulado"
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
          >
            Ver Histórico de Simulados
          </Link>
          <Link
            href="/"
            className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black shadow-lg transition-colors"
          >
            Voltar ao Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // TELA DE RESOLUÇÃO DO SIMULADO (DURANTE A PROVA)
  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-28 sm:pb-16">
      {/* Barra de Status */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex justify-between items-center">
        <div>
          <span className="text-xs font-bold text-emerald-400">Simulado Cesgranrio • 60 Questões</span>
          <p className="text-xs text-slate-400">
            Respondidas: <b className="text-white">{Object.keys(answers).length}</b> de 60
          </p>
        </div>
        <div className="flex gap-3 items-center">
          <span
            className={`px-3 py-1.5 rounded-full border text-xs font-bold ${
              left < 1800 ? "text-rose-400 border-rose-500/40" : "text-amber-400 border-slate-700"
            }`}
          >
            <Clock className="w-3.5 h-3.5 inline mr-1" />
            {time(left)}
          </span>
          <button
            onClick={() => void submit()}
            disabled={sending || submitted}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-3.5 h-3.5 inline mr-1" />
            {sending ? "Entregando..." : "Entregar Prova"}
          </button>
        </div>
      </div>

      {/* Grade de Questões 1 a 60 */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-wrap gap-1.5">
        {questions.map((x, i) => {
          const isPort = i < 10;
          const isMath = i >= 10 && i < 20;
          return (
            <button
              key={x.id}
              onClick={() => setIndex(i)}
              disabled={sending || submitted}
              className={`w-7 h-7 rounded-md border text-[11px] font-bold disabled:opacity-70 transition-all ${
                i === index
                  ? "ring-2 ring-emerald-400 border-white scale-105"
                  : isPort
                  ? "border-sky-800/80"
                  : isMath
                  ? "border-amber-800/80"
                  : "border-slate-700"
              } ${answers[x.id] ? "bg-emerald-500/30 text-emerald-300" : "bg-slate-800 text-slate-400"}`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      {/* Questão Atual */}
      {q && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-7 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-200">Questão {index + 1} de 60</span>
              <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold ${getSectionInfo(index).badge}`}>
                {getSectionInfo(index).title}
              </span>
            </div>
            <button
              onClick={() => setFlags((f) => ({ ...f, [q.id]: !f[q.id] }))}
              disabled={sending || submitted}
              className="text-xs text-slate-400 hover:text-amber-300 disabled:opacity-50 transition-colors"
            >
              <Flag className={`w-3.5 h-3.5 inline mr-1 ${flags[q.id] ? "text-amber-400 fill-amber-400" : ""}`} />
              {flags[q.id] ? "Marcada para revisão" : "Marcar para rever"}
            </button>
          </div>

          <p className="text-sm sm:text-base text-slate-100 font-medium leading-relaxed whitespace-pre-line">
            {q.statement}
          </p>

          <div className="space-y-2">
            {["A", "B", "C", "D", "E"].map((o) =>
              q[`option${o}`] ? (
                <button
                  key={o}
                  onClick={() => setAnswers((a) => ({ ...a, [q.id]: o }))}
                  disabled={sending || submitted}
                  className={`w-full text-left p-3 rounded-xl border text-sm flex gap-3 transition-colors disabled:opacity-70 ${
                    answers[q.id] === o
                      ? "bg-emerald-500/20 border-emerald-500 text-white"
                      : "bg-slate-800/70 hover:bg-slate-800 border-slate-700 text-slate-300"
                  }`}
                >
                  <b>{o}</b>
                  <span>{q[`option${o}`]}</span>
                </button>
              ) : null
            )}
          </div>

          <div className="flex justify-between pt-2">
            <button
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={index === 0 || sending || submitted}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 inline" /> Anterior
            </button>
            <button
              onClick={() => setIndex((i) => Math.min(59, i + 1))}
              disabled={index === 59 || sending || submitted}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium disabled:opacity-30 transition-colors"
            >
              Próxima <ChevronRight className="w-4 h-4 inline" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
