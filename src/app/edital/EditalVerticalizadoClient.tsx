"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Sparkles,
  HelpCircle,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  Search,
  Filter,
  Layers,
} from "lucide-react";

interface Topic {
  id: string;
  code: string | null;
  title: string;
  description: string | null;
  officialSource: string | null;
  order: number;
  userProgress: Array<{
    status: string;
    masteryScore: number;
    nextReviewDate: Date | string | null;
  }>;
  lessons: Array<{ id: string }>;
  _count: {
    questions: number;
    flashcards: number;
  };
}

interface Subject {
  id: string;
  name: string;
  category: string;
  order: number;
  topics: Topic[];
}

interface EditalVerticalizadoClientProps {
  subjects: Subject[];
  totalTopics: number;
  studiedTopicsCount: number;
}

export function EditalVerticalizadoClient({
  subjects,
  totalTopics,
  studiedTopicsCount,
}: EditalVerticalizadoClientProps) {
  const [activeCategory, setActiveCategory] = useState<"TODOS" | "ESPECIFICO" | "BASICO">("TODOS");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("TODOS");
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>(() => {
    // Expand all subjects by default for convenience
    const initial: Record<string, boolean> = {};
    subjects.forEach((s) => {
      initial[s.id] = true;
    });
    return initial;
  });

  const toggleSubject = (subjectId: string) => {
    setExpandedSubjects((prev) => ({
      ...prev,
      [subjectId]: !prev[subjectId],
    }));
  };

  const expandAll = () => {
    const next: Record<string, boolean> = {};
    subjects.forEach((s) => {
      next[s.id] = true;
    });
    setExpandedSubjects(next);
  };

  const collapseAll = () => {
    setExpandedSubjects({});
  };

  // Filtered list
  const filteredSubjects = useMemo(() => {
    return subjects
      .filter((s) => {
        if (activeCategory === "TODOS") return true;
        return s.category === activeCategory;
      })
      .map((subject) => {
        const matchingTopics = subject.topics.filter((topic) => {
          const progress = topic.userProgress[0];
          const status = progress?.status || "NAO_INICIADO";

          if (statusFilter !== "TODOS" && status !== statusFilter) {
            return false;
          }

          if (searchTerm.trim()) {
            const query = searchTerm.toLowerCase();
            const titleMatch = topic.title.toLowerCase().includes(query);
            const codeMatch = topic.code ? topic.code.toLowerCase().includes(query) : false;
            const descMatch = topic.description ? topic.description.toLowerCase().includes(query) : false;
            return titleMatch || codeMatch || descMatch;
          }

          return true;
        });

        return {
          ...subject,
          topics: matchingTopics,
        };
      })
      .filter((subject) => subject.topics.length > 0 || (searchTerm === "" && statusFilter === "TODOS"));
  }, [subjects, activeCategory, searchTerm, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Página */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-md">
                Edital Oficial 2026.3
              </span>
              <span className="text-xs text-slate-400">
                Ênfase 18 • Suprimento de Bens e Serviços
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
              Edital Verticalizado & Domínio de Conteúdo
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
              Taxonomia 100% fiel à publicação oficial da Transpetro / Cesgranrio. Acompanhe seu status e nível de domínio tópico por tópico.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-800/80 px-4 py-2.5 rounded-xl border border-slate-700/60 shrink-0 self-start sm:self-auto">
            <div>
              <p className="text-[11px] text-slate-400">Progresso do Edital</p>
              <p className="text-lg font-bold text-emerald-400">
                {totalTopics > 0 ? Math.round((studiedTopicsCount / totalTopics) * 100) : 0}%
              </p>
            </div>
            <div className="text-right border-l border-slate-700 pl-3">
              <p className="text-[11px] text-slate-400">Cobertura</p>
              <p className="text-sm font-semibold text-slate-200">
                {studiedTopicsCount} / {totalTopics} tópicos
              </p>
            </div>
          </div>
        </div>

        {/* Barra de Filtros e Busca */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Abas de Categorias */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeCategory === "TODOS"}
              onClick={() => setActiveCategory("TODOS")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors shrink-0 ${
                activeCategory === "TODOS"
                  ? "bg-emerald-500 text-slate-950 shadow-sm"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
              }`}
            >
              Todas as Matérias
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeCategory === "ESPECIFICO"}
              onClick={() => setActiveCategory("ESPECIFICO")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors shrink-0 ${
                activeCategory === "ESPECIFICO"
                  ? "bg-emerald-500 text-slate-950 shadow-sm"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
              }`}
            >
              Específicas (40q)
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeCategory === "BASICO"}
              onClick={() => setActiveCategory("BASICO")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors shrink-0 ${
                activeCategory === "BASICO"
                  ? "bg-emerald-500 text-slate-950 shadow-sm"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
              }`}
            >
              Básicas (20q)
            </button>
          </div>

          {/* Busca e Filtro de Status */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar tópico ou código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-800/90 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:border-emerald-500/70 transition-colors"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-slate-800/90 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500/70"
            >
              <option value="TODOS">Todos os Status</option>
              <option value="NAO_INICIADO">Não Iniciado</option>
              <option value="EM_ESTUDO">Em Estudo</option>
              <option value="EM_REVISAO">Em Revisão</option>
              <option value="DOMINADO">Dominado</option>
            </select>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={expandAll}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs transition-colors"
                title="Expandir todas as matérias"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Matérias e Tópicos com Acordeom */}
      <div className="space-y-4">
        {filteredSubjects.length === 0 ? (
          <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl">
            <p className="text-sm text-slate-400">Nenhum tópico encontrado para os filtros selecionados.</p>
            <button
              onClick={() => {
                setActiveCategory("TODOS");
                setSearchTerm("");
                setStatusFilter("TODOS");
              }}
              className="mt-2 text-xs font-semibold text-emerald-400 hover:underline"
            >
              Limpar filtros
            </button>
          </div>
        ) : (
          filteredSubjects.map((subject) => {
            const isSpecific = subject.category === "ESPECIFICO";
            const isExpanded = !!expandedSubjects[subject.id];

            return (
              <div
                key={subject.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm transition-all"
              >
                {/* Header da Matéria clicável para expandir/recolher */}
                <button
                  type="button"
                  onClick={() => toggleSubject(subject.id)}
                  aria-expanded={isExpanded}
                  className="w-full text-left bg-slate-850 px-5 py-4 border-b border-slate-800/80 flex items-center justify-between hover:bg-slate-800/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        isSpecific ? "bg-emerald-400" : "bg-sky-400"
                      }`}
                    />
                    <div>
                      <h2 className="text-base font-bold text-white text-left">
                        {subject.name}
                      </h2>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {isSpecific ? "Conhecimentos Específicos (40 questões)" : "Conhecimentos Básicos (10 questões)"} • {subject.topics.length} tópicos
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-slate-400">
                    <span className="text-xs font-medium hidden sm:inline-block">
                      {isExpanded ? "Recolher" : "Expandir"}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        isExpanded ? "transform rotate-180 text-emerald-400" : ""
                      }`}
                    />
                  </div>
                </button>

                {/* Tópicos da Matéria (quando expandido) */}
                {isExpanded && (
                  <div className="divide-y divide-slate-800/70">
                    {subject.topics.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-500">
                        Nenhum tópico correspondente nesta matéria.
                      </div>
                    ) : (
                      subject.topics.map((topic) => {
                        const progress = topic.userProgress[0];
                        const status = progress?.status || "NAO_INICIADO";
                        const mastery = Math.round(progress?.masteryScore || 0);
                        const hasLessonCache = topic.lessons.length > 0;

                        return (
                          <div
                            key={topic.id}
                            className="p-4 sm:p-5 hover:bg-slate-800/40 transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                          >
                            <div className="space-y-1 max-w-xl">
                              <div className="flex items-center gap-2 flex-wrap">
                                {topic.code && (
                                  <span className="px-2 py-0.5 text-xs font-mono font-bold bg-slate-800 text-slate-300 rounded border border-slate-700">
                                    {topic.code}
                                  </span>
                                )}
                                <h3 className="text-sm font-semibold text-slate-100">
                                  {topic.title}
                                </h3>
                              </div>

                              {topic.description && (
                                <p className="text-xs text-slate-400 leading-relaxed pl-1">
                                  {topic.description}
                                </p>
                              )}

                              {topic.officialSource && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400/90 pl-1">
                                  <ShieldCheck className="w-3 h-3" />
                                  {topic.officialSource}
                                </span>
                              )}

                              {/* Status de Domínio e Próxima Revisão */}
                              <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-400 pl-1 flex-wrap">
                                <span
                                  className={`font-semibold px-2 py-0.5 rounded text-[10px] ${
                                    status === "DOMINADO"
                                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                      : status === "EM_REVISAO"
                                      ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                                      : status === "EM_ESTUDO"
                                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                      : "bg-slate-800 text-slate-400"
                                  }`}
                                >
                                  {status === "NAO_INICIADO"
                                    ? "Não Iniciado"
                                    : status === "EM_ESTUDO"
                                    ? "Em Estudo"
                                    : status === "EM_REVISAO"
                                    ? "Em Revisão"
                                    : "Dominado"}
                                </span>

                                <span>Domínio: <strong className="text-slate-200">{mastery}%</strong></span>

                                {progress?.nextReviewDate && (
                                  <span className="flex items-center gap-1 text-slate-400">
                                    <Clock className="w-3 h-3" />
                                    Revisão: {new Date(progress.nextReviewDate).toLocaleDateString("pt-BR")}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Botões de Ação do Tópico */}
                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                              <Link
                                href={`/questoes?topicId=${topic.id}`}
                                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1.5"
                                title="Treinar Questões deste Tópico"
                              >
                                <HelpCircle className="w-3.5 h-3.5" />
                                <span>Questões</span>
                              </Link>

                              <Link
                                href={`/aula/${topic.id}`}
                                className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>{hasLessonCache ? "Revisar Aula" : "Estudar Agora"}</span>
                                <ChevronRight className="w-3 h-3" />
                              </Link>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
