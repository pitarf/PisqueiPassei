/**
 * Dashboard Principal do Concurseiro - TRANSPETRO STUDY 2026.3
 * Nível Técnico • Ênfase 18: Suprimento de Bens e Serviços
 *
 * Exibe visão panorâmica do acervo de 940 questões, sessão "ESTUDAR AGORA" adaptativa,
 * progresso para a meta 47/60 e diagnóstico contínuo de domínio por disciplina.
 */

import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  evaluateTopicDiagnostic,
  buildStudyNowSession,
  calculateBankOverview,
  type AttemptRecord,
  type QuestionSummary,
} from "@/lib/adaptive-engine";
import {
  Target,
  ArrowRight,
  RotateCcw,
  AlertTriangle,
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  Sparkles,
  Flame,
  Layers,
  HelpCircle,
  TrendingUp,
} from "lucide-react";

export const revalidate = 0;
const EXAM_DATE_KEY = "2026-12-06";

function daysUntilExam(now: Date): number {
  const todayKey = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const todayUtc = Date.parse(`${todayKey}T00:00:00Z`);
  const examUtc = Date.parse(`${EXAM_DATE_KEY}T00:00:00Z`);
  return Math.max(0, Math.ceil((examUtc - todayUtc) / 86400000));
}

export default async function DashboardPage() {
  const user = await prisma.user.findFirst({
    where: { email: "rafael@estudos.transpetro" },
    include: {
      progress: true,
      attempts: {
        include: {
          question: {
            select: {
              topicId: true,
              difficulty: true,
              questionType: true,
              cognitiveLevel: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      simulations: { orderBy: { completedAt: "desc" }, take: 3 },
    },
  });

  const subjects = await prisma.subject.findMany({
    include: {
      topics: {
        include: {
          questions: {
            select: {
              id: true,
              topicId: true,
              statement: true,
              statementHash: true,
              difficulty: true,
              questionType: true,
              cognitiveLevel: true,
            },
          },
        },
      },
    },
    orderBy: { order: "asc" },
  });

  const now = new Date();
  const allTopics = subjects.flatMap((s) => s.topics);
  const totalTopicsCount = allTopics.length; // 47

  // Mapeia tentativas do usuário
  const userAttempts: AttemptRecord[] = (user?.attempts || []).map((att) => ({
    id: att.id,
    questionId: att.questionId,
    topicId: att.question.topicId,
    isCorrect: att.isCorrect,
    chosenOption: att.chosenOption,
    timeSpentSeconds: att.timeSpentSeconds,
    createdAt: att.createdAt,
    difficulty: (att.question.difficulty as any) || "MEDIA",
    questionType: att.question.questionType,
    cognitiveLevel: att.question.cognitiveLevel,
  }));

  const attemptsByTopic = new Map<string, AttemptRecord[]>();
  for (const a of userAttempts) {
    const list = attemptsByTopic.get(a.topicId) || [];
    list.push(a);
    attemptsByTopic.set(a.topicId, list);
  }

  const progressByTopic = new Map((user?.progress || []).map((p) => [p.topicId, p]));
  const questionsByTopic = new Map<string, QuestionSummary[]>();
  let totalBankCount = 0;

  for (const t of allTopics) {
    const qList: QuestionSummary[] = t.questions.map((q) => ({
      id: q.id,
      topicId: q.topicId,
      statement: q.statement,
      statementHash: q.statementHash,
      difficulty: (q.difficulty as any) || "MEDIA",
      questionType: q.questionType,
      cognitiveLevel: q.cognitiveLevel,
      topicTitle: t.title,
      subjectName: t.title,
    }));
    questionsByTopic.set(t.id, qList);
    totalBankCount += qList.length;
  }

  // Avalia o diagnóstico adaptativo de todos os tópicos
  const diagnostics = allTopics.map((t) => {
    const prog = progressByTopic.get(t.id);
    return evaluateTopicDiagnostic({
      topicId: t.id,
      topicTitle: t.title,
      topicCode: t.code,
      subjectName: t.title,
      attempts: attemptsByTopic.get(t.id) || [],
      nextReviewDate: prog?.nextReviewDate,
      lastStudiedAt: prog?.lastStudiedAt,
      now,
    });
  });

  // Visão geral das 940 questões do acervo
  const bankStats = calculateBankOverview({
    totalBankQuestions: totalBankCount || 940,
    userAttempts,
    topicDiagnostics: diagnostics,
    targetScore: user?.targetScore || 47,
  });

  // Prévia da sessão "ESTUDAR AGORA"
  const studyNowSession = buildStudyNowSession({
    diagnostics,
    questionsByTopic,
    userAttempts,
    targetCount: 10,
  });

  const rankedPriorities = [...diagnostics].sort((a, b) => b.adaptivePriorityScore - a.adaptivePriorityScore);
  const nextTopTopic = rankedPriorities[0];
  const reviewsDue = diagnostics.filter((d) => d.isReviewDue);
  const weakPoints = diagnostics
    .filter((d) => d.answeredCount > 0 && d.masteryScore < 70)
    .sort((a, b) => a.masteryScore - b.masteryScore)
    .slice(0, 3);

  const daysRemaining = daysUntilExam(now);
  const lastSimulation = user?.simulations?.[0];

  return (
    <div className="space-y-6 pb-20 sm:pb-8">
      {/* CARD PRINCIPAL (HERO) */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-2xl p-5 sm:p-7 shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-slate-700/60">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-md">
                  Transpetro 2026.3 • Ênfase 18
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-400" /> Prova: 06/12/2026 ({daysRemaining} dias)
                </span>
                <span className="text-xs text-orange-300 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5" /> {user?.currentStreak ?? 0}{" "}
                  {user?.currentStreak === 1 ? "dia seguido" : "dias seguidos"}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white mt-1.5">
                Olá, {user?.name || "Rafael"}. Motor Adaptativo Ativo.
              </h1>
            </div>

            {/* BOTÃO ESTUDAR AGORA HEROICO */}
            <Link
              href="/questoes?modo=estudar_agora"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/25 transition-all active:scale-95"
            >
              <Sparkles className="w-4 h-4 fill-slate-950" />
              ESTUDAR AGORA (10 QUESTÕES)
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* MÉTRICAS DE METAS OFICIAIS */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5">
            <Metric
              icon={<Target className="w-3.5 h-3.5 text-emerald-400" />}
              label="Sua Meta"
              value={bankStats.targetScore}
              suffix="/ 60 pts"
              detail="Acertos desejados na prova"
            />
            <Metric
              icon={<CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />}
              label="Domínio Médio"
              value={`${bankStats.overallMastery}%`}
              suffix=""
              detail="Score bayesiano calibrado"
            />
            <Metric
              icon={<BookOpen className="w-3.5 h-3.5 text-amber-400" />}
              label="Questões Resolvidas"
              value={bankStats.totalAnsweredUnique}
              suffix={`/ ${bankStats.totalAvailable}`}
              detail="Itens únicos enfrentados"
            />
            <Metric
              icon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
              label="Tópicos Dominados"
              value={bankStats.totalMastered}
              suffix={`/ ${totalTopicsCount}`}
              detail="Rendimento sólido (≥ 80%)"
            />
          </div>
        </div>
      </div>

      {/* PAINEL DO ACERVO MESTRE DE 940 QUESTÕES */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Painel do Acervo Oficial (940 Questões • 20 por Tópico)
            </h2>
          </div>
          <span className="text-xs text-slate-400">100% dos 47 tópicos cobertos</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
            <span className="text-[11px] text-slate-400">Total Disponível</span>
            <p className="text-xl font-black text-white mt-0.5">{bankStats.totalAvailable}</p>
            <span className="text-[10px] text-emerald-400">47 tópicos oficiais</span>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
            <span className="text-[11px] text-slate-400">Respondidas Únicas</span>
            <p className="text-xl font-black text-sky-400 mt-0.5">{bankStats.totalAnsweredUnique}</p>
            <span className="text-[10px] text-slate-400">
              {Math.round((bankStats.totalAnsweredUnique / bankStats.totalAvailable) * 100)}% do acervo
            </span>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
            <span className="text-[11px] text-slate-400">Não Vistas (Inéditas)</span>
            <p className="text-xl font-black text-amber-400 mt-0.5">{bankStats.totalUnseen}</p>
            <span className="text-[10px] text-slate-400">Prontas para treino</span>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
            <span className="text-[11px] text-slate-400">Com Erro Pendente</span>
            <p className="text-xl font-black text-rose-400 mt-0.5">{bankStats.totalWithPendingError}</p>
            <Link href="/questoes?modo=erros" className="text-[10px] text-rose-300 underline">
              Revisar meus erros
            </Link>
          </div>

          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
            <span className="text-[11px] text-slate-400">Revisões Vencidas</span>
            <p className="text-xl font-black text-purple-400 mt-0.5">{reviewsDue.length}</p>
            <span className="text-[10px] text-purple-300">Janela ótima de SRS</span>
          </div>
        </div>
      </div>

      {/* SESSÃO "ESTUDAR AGORA" DETALHADA */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
              Algoritmo de Seleção Adaptativa
            </span>
            <h3 className="text-base font-bold text-white mt-0.5">Prévia da Sessão Inteligente (10 Itens)</h3>
            <p className="text-xs text-slate-400">
              O motor distribui as questões entre os temas mais urgentes, calibrando a dificuldade ao seu histórico.
            </p>
          </div>
          <Link
            href="/questoes?modo=estudar_agora"
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs self-start sm:self-center transition-colors"
          >
            Iniciar Esta Bateria
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {studyNowSession.preview.selectedTopics.slice(0, 4).map((top, idx) => (
            <div key={top.topicId} className="bg-slate-800/70 border border-slate-700/70 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-emerald-400">{idx + 1}º Foco</span>
                <span className="text-slate-400">
                  {top.questionsCount} {top.questionsCount === 1 ? "questão" : "questões"}
                </span>
              </div>
              <h4 className="text-xs font-bold text-white line-clamp-1">
                {top.topicCode ? `${top.topicCode} ` : ""}
                {top.title}
              </h4>
              <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">{top.reason}</p>
              <div className="flex items-center justify-between pt-1 text-[10px]">
                <span className="px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">
                  Nível: {top.suggestedDifficulty === "FACIL" ? "Fácil" : top.suggestedDifficulty === "MEDIA" ? "Média" : "Difícil"}
                </span>
                <span className="text-slate-500">{top.subjectName.split(" ")[0]}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* REVISÃO DO DIA E PONTOS CRÍTICOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5" /> Revisão Espaçada (SRS)
              </span>
              <span className="px-2 py-0.5 text-xs font-semibold bg-sky-500/10 text-sky-300 border border-sky-500/20 rounded-full">
                {reviewsDue.length} pendentes
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mt-2">
              {reviewsDue.length > 0 ? `${reviewsDue.length} tópicos na janela de retenção` : "Revisões em dia!"}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Revisar no intervalo exato evita a curva do esquecimento e consolida a memória de longo prazo para a Cesgranrio.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
            <Link href="/flashcards" className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-400">
              Flashcards do dia <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/questoes?modo=estudar_agora"
              className="px-4 py-2 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-300 font-semibold text-xs"
            >
              Praticar Revisão
            </Link>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> Fila de Erros Ativa
              </span>
              <span className="text-xs text-slate-400">{bankStats.totalWithPendingError} itens com erro</span>
            </div>
            <h3 className="text-lg font-bold text-white mt-2">Treino de Correção de Erros</h3>
            {weakPoints.length > 0 ? (
              <div className="mt-2.5 space-y-1.5">
                {weakPoints.map((wp) => (
                  <div
                    key={wp.topicId}
                    className="flex items-center justify-between bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700/50 text-xs"
                  >
                    <span className="text-slate-200 truncate pr-2">
                      {wp.topicCode ? `${wp.topicCode} ` : ""}
                      {wp.topicTitle}
                    </span>
                    <span className="font-bold text-rose-400">{wp.masteryScore}%</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 mt-1">
                Sem pontos críticos acumulados. Continue resolvendo para calibrar o motor.
              </p>
            )}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Espaçamento progressivo</span>
            <Link
              href="/questoes?modo=erros"
              className="px-4 py-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 font-semibold text-xs"
            >
              Revisar Meus Erros
            </Link>
          </div>
        </div>
      </div>

      {/* PROGRESSO POR DISCIPLINA (6 DISCIPLINAS OFICIAIS) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Progresso e Domínio por Disciplina
            </h2>
            <p className="text-xs text-slate-400">Distribuição estrita da Ênfase 18 (Básicas e Específicas)</p>
          </div>
          <Link href="/edital" className="text-xs font-semibold text-emerald-400">
            Ver edital verticalizado <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {subjects.map((subj) => {
            const subjTopics = subj.topics;
            const total = subjTopics.length;
            const completed = subjTopics.filter(
              (t) => (attemptsByTopic.get(t.id)?.length || 0) > 0
            ).length;
            const avg = total
              ? Math.round(
                  subjTopics.reduce((sum, t) => {
                    const d = diagnostics.find((x) => x.topicId === t.id);
                    return sum + (d?.masteryScore || 0);
                  }, 0) / total
                )
              : 0;

            return (
              <div key={subj.id} className="bg-slate-800/70 border border-slate-700/60 rounded-xl p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-bold text-white line-clamp-1">{subj.name}</h4>
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">{avg}%</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2.5">
                  <span>
                    {completed} de {total} tópicos
                  </span>
                  <span>{subj.category === "ESPECIFICO" ? "Específica" : "Básica"}</span>
                </div>
                <div className="w-full bg-slate-700/50 rounded-full h-1.5 mt-1.5 overflow-hidden">
                  <div
                    className="bg-emerald-400 h-full rounded-full"
                    style={{ width: `${total > 0 ? Math.round((completed / total) * 100) : 0}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ÚLTIMOS SIMULADOS (60 QUESTÕES) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              Simulado Oficial Cesgranrio (60 Questões • 4 Horas)
            </h2>
            <p className="text-xs text-slate-400">10 Português • 10 Matemática • 40 Específicas</p>
          </div>
          <Link href="/simulado" className="px-3.5 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs">
            Fazer Simulado
          </Link>
        </div>

        {user?.simulations?.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
            {user.simulations.map((sim) => (
              <div
                key={sim.id}
                className="bg-slate-800/80 border border-slate-700/70 rounded-xl p-3.5 flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-300">{sim.title}</p>
                  <p className="text-[11px] text-slate-500">
                    {new Date(sim.completedAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-black text-white">{Math.round(sim.score)}</span>
                    <span className="text-xs text-slate-400">/ 60</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Meta: {bankStats.targetScore}/60</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 border border-dashed border-slate-800 rounded-xl">
            <p className="text-xs text-slate-400">Nenhum simulado registrado até o momento.</p>
            <Link
              href="/simulado?iniciar=true"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 mt-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Iniciar primeiro simulado completo
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
  suffix,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  suffix: string;
  detail: string;
}) {
  return (
    <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-3.5">
      <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
        {icon}
        {label}
      </p>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-2xl font-black text-white">{value}</span>
        {suffix && <span className="text-xs text-slate-400">{suffix}</span>}
      </div>
      <p className="text-[11px] text-slate-400 mt-1">{detail}</p>
    </div>
  );
}
