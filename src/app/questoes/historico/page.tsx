import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Database, ExternalLink, Filter, ArrowRight } from "lucide-react";

export const revalidate = 0;

export default async function HistoricoQuestoesPage() {
  const [exams, topics, historicalQuestions] = await Promise.all([
    prisma.historicalExam.findMany({
      include: { _count: { select: { questions: true } } },
      orderBy: [{ year: "desc" }, { organization: "asc" }],
    }),
    prisma.historicalQuestion.findMany({
      select: { topicId: true, difficulty: true, questionType: true, cognitiveLevel: true, verificationStatus: true },
    }),
    prisma.topic.findMany({
      include: { subject: true, _count: { select: { historicalQuestions: true } } },
      orderBy: [{ subject: { order: "asc" } }, { order: "asc" }],
    }),
  ]);

  const totalHistorical = historicalQuestions.length;
  const countBy = (key: "difficulty" | "questionType" | "cognitiveLevel" | "verificationStatus") => Object.entries(historicalQuestions.reduce<Record<string, number>>((acc, row) => { const value = row[key] || "SEM_CLASSIFICACAO"; acc[value] = (acc[value] || 0) + 1; return acc; }, {})).sort((a,b) => b[1] - a[1]);
  const coveredTopics = topics.filter(t => t._count.historicalQuestions > 0).length;
  const patterns = [
    ["Dificuldade", countBy("difficulty")],
    ["Tipo de questão", countBy("questionType")],
    ["Nível cognitivo", countBy("cognitiveLevel")],
    ["Verificação", countBy("verificationStatus")],
  ] as const;

  return <div className="space-y-6 pb-20">
    <header className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-md">
      <div className="flex flex-wrap items-center gap-2">
        <span className="px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-md">Banco histórico</span>
        <span className="text-xs text-slate-500">{exams.length} provas catalogadas</span>
      </div>
      <h1 className="text-xl sm:text-2xl font-black text-white mt-2">Provas e padrões históricos</h1>
      <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-3xl">Catálogo das provas usadas como referência de conteúdo, estrutura, dificuldade e perfil de cobrança. As questões inéditas derivadas são identificadas separadamente.</p>
    </header>

    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      <Metric label="Provas catalogadas" value={exams.length} />
      <Metric label="Questões históricas" value={totalHistorical} />
      <Metric label="Tópicos com histórico" value={coveredTopics + "/" + topics.length} />
    </div>

    <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
      <h2 className="text-base font-bold text-white">Padrões catalogados</h2>
      <p className="text-xs text-slate-500 mt-1">Distribuições descritivas do material histórico já registrado.</p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
        {patterns.map(([title, rows]) => <Pattern key={title} title={title} rows={rows} />)}
      </div>
    </section>

    <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
      <h2 className="text-base font-bold text-white flex items-center gap-2"><Database className="w-4 h-4 text-emerald-400" />Provas catalogadas</h2>
      <div className="mt-4 space-y-3">
        {exams.length ? exams.map(exam => <div key={exam.id} className="bg-slate-800/70 border border-slate-700/60 rounded-xl p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-white">{exam.organization} · {exam.year}</p>
              <p className="text-xs text-slate-300 mt-0.5">{exam.processName}</p>
              <p className="text-[11px] text-slate-500 mt-1">{[exam.role, exam.emphasis, exam.banca].filter(Boolean).join(" · ") || "Metadados complementares não informados"}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs font-bold text-slate-300">{exam._count.questions} questões</span>
              {exam.sourceUrl && <a href={exam.sourceUrl} target="_blank" rel="noreferrer" className="p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-white" aria-label="Abrir fonte"><ExternalLink className="w-4 h-4" /></a>}
            </div>
          </div>
        </div>) : <p className="text-xs text-slate-500 text-center py-6">Nenhuma prova histórica foi importada ainda.</p>}
      </div>
    </section>

    <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
      <div className="flex items-center justify-between gap-3">
        <div><h2 className="text-base font-bold text-white flex items-center gap-2"><Filter className="w-4 h-4 text-sky-400" />Cobertura por tópico</h2><p className="text-xs text-slate-500 mt-0.5">Ajuda a identificar onde o histórico já fornece material de análise.</p></div>
        <Link href="/questoes" className="text-xs font-semibold text-emerald-400 flex items-center gap-1">Treinar <ArrowRight className="w-3.5 h-3.5" /></Link>
      </div>
      <div className="mt-4 space-y-2">
        {topics.map(topic => <div key={topic.id} className="flex items-center justify-between gap-3 bg-slate-800/50 rounded-lg px-3 py-2.5 border border-slate-800">
          <div className="min-w-0"><p className="text-xs text-slate-300 truncate">{topic.code ? topic.code + " · " : ""}{topic.title}</p><p className="text-[10px] text-slate-500 truncate">{topic.subject.name}</p></div>
          <span className="text-xs font-bold text-sky-300 shrink-0">{topic._count.historicalQuestions}</span>
        </div>)}
      </div>
    </section>

    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
      <p className="text-xs text-amber-200/80"><strong>Proveniência:</strong> o catálogo separa material histórico de questões inéditas. Referências externas devem apontar para fontes públicas, e conteúdo protegido não deve ser reproduzido sem base adequada.</p>
    </div>
  </div>;
}

function Pattern({ title, rows }: { title: string; rows: [string, number][] }) { return <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3"><p className="text-xs font-bold text-slate-300">{title}</p><div className="mt-2 space-y-1.5">{rows.slice(0,4).map(([name,count]) => <div key={name} className="flex justify-between gap-2 text-[10px]"><span className="text-slate-500 truncate">{name}</span><span className="font-bold text-sky-300">{count}</span></div>)}</div></div>; }\n\nfunction Metric({ label, value }: { label: string; value: number | string }) {
  return <div className="bg-slate-900 border border-slate-800 rounded-xl p-4"><p className="text-[11px] text-slate-500">{label}</p><p className="text-2xl font-black text-white mt-1">{value}</p></div>;
}
