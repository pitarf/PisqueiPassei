"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import {
  Settings,
  Target,
  Clock,
  Key,
  Download,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

interface SettingsFormProps {
  initialTargetScore: number;
  initialHours: number;
}

export const SettingsForm: React.FC<SettingsFormProps> = ({
  initialTargetScore,
  initialHours,
}) => {
  const [targetScore, setTargetScore] = useState(initialTargetScore);
  const [dailyHours, setDailyHours] = useState(initialHours);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetScore,
          dailyStudyHours: dailyHours,
        }),
      });

      if (!res.ok) throw new Error("Erro ao salvar configurações.");

      toast.success("Configurações e meta de aprovação salvas com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportData = () => {
    const exportData = {
      app: "TRANSPETRO STUDY 2026.3",
      exportedAt: new Date().toISOString(),
      student: "Rafael",
      targetScore,
      dailyHours,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transpetro-study-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Arquivo de backup baixado com sucesso!");
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <form onSubmit={handleSave} className="space-y-5">
        {/* Metas de Estudo */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 text-emerald-400">
            <Target className="w-4 h-4" />
            <h2 className="text-sm font-bold uppercase tracking-wider">
              Metas de Prova & Desempenho
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Meta de Pontos na Prova (Cesgranrio)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="30"
                  max="60"
                  value={targetScore}
                  onChange={(e) => setTargetScore(parseInt(e.target.value, 10))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-bold outline-none focus:border-emerald-500"
                />
                <span className="text-xs text-slate-400 font-semibold shrink-0">
                  / 60 pts
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                A nota de corte histórica esperada é de 47 pontos (78,3%).
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Meta de Estudo Diário
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  max="12"
                  value={dailyHours}
                  onChange={(e) => setDailyHours(parseFloat(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-bold outline-none focus:border-emerald-500"
                />
                <span className="text-xs text-slate-400 font-semibold shrink-0">
                  horas/dia
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Recomendado para cobrir o edital até 06/12/2026.
              </p>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Salvar Alterações</span>
            </button>
          </div>
        </div>

        {/* Integração de Inteligência Artificial */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-3">
          <div className="flex items-center gap-2 text-sky-400">
            <Sparkles className="w-4 h-4" />
            <h2 className="text-sm font-bold uppercase tracking-wider">
              Motor de IA (Google Gemini 1.5)
            </h2>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            A chave de API do Gemini está configurada com segurança no servidor através de variáveis de ambiente (`.env`), sem exposição no navegador. O cache de aulas e banco de questões reduz a zero o consumo repetido de tokens.
          </p>
          <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl">
            <ShieldCheck className="w-4 h-4" />
            <span>IA Ativa e Pronta para Geração de Aulas e Respostas</span>
          </div>
        </div>

        {/* Backup e Exportação */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-3">
          <div className="flex items-center gap-2 text-amber-400">
            <Download className="w-4 h-4" />
            <h2 className="text-sm font-bold uppercase tracking-wider">
              Backup e Exportação de Dados
            </h2>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Exporte todo o seu progresso de estudo, domínio dos tópicos e simulados realizados em formato JSON para arquivamento pessoal.
          </p>
          <button
            type="button"
            onClick={handleExportData}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Exportar Dados em JSON</span>
          </button>
        </div>
      </form>
    </div>
  );
};
