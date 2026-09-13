"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { Target, Download, CheckCircle2, Sparkles, ShieldCheck } from "lucide-react";

interface SettingsFormProps {
  initialTargetScore: number;
  initialHours: number;
}

export const SettingsForm: React.FC<SettingsFormProps> = ({ initialTargetScore, initialHours }) => {
  const [targetScore, setTargetScore] = useState(initialTargetScore);
  const [dailyHours, setDailyHours] = useState(initialHours);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetScore, dailyStudyHours: dailyHours }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Erro ao salvar configurações.");
      setTargetScore(data.user.targetScore);
      setDailyHours(data.user.dailyStudyHours);
      toast.success("Configurações salvas com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const res = await fetch("/api/backup", { cache: "no-store" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Não foi possível gerar o backup.");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `transpetro-study-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Backup completo baixado com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao gerar backup.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <form onSubmit={handleSave} className="space-y-5">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 text-emerald-400">
            <Target className="w-4 h-4" />
            <h2 className="text-sm font-bold uppercase tracking-wider">Metas de Prova & Desempenho</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Meta de Pontos na Prova</label>
              <div className="flex items-center gap-2">
                <input type="number" min="30" max="60" value={targetScore} onChange={(e) => setTargetScore(Number(e.target.value))} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-bold outline-none focus:border-emerald-500" />
                <span className="text-xs text-slate-400 font-semibold shrink-0">/ 60 pts</span>
              </div>
              <p className="text-[11px] text-slate-500">Meta de estudo definida no app: 47/60. Isso não representa uma nota de corte oficial.</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Meta de Estudo Diário</label>
              <div className="flex items-center gap-2">
                <input type="number" step="0.5" min="1" max="12" value={dailyHours} onChange={(e) => setDailyHours(Number(e.target.value))} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-bold outline-none focus:border-emerald-500" />
                <span className="text-xs text-slate-400 font-semibold shrink-0">horas/dia</span>
              </div>
              <p className="text-[11px] text-slate-500">Use essa meta para organizar sua rotina até a prova.</p>
            </div>
          </div>
          <div className="pt-2">
            <button type="submit" disabled={isSaving} className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-slate-950 font-bold text-xs shadow-md transition-colors flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSaving ? "Salvando..." : "Salvar Alterações"}</span>
            </button>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-3">
          <div className="flex items-center gap-2 text-sky-400">
            <Sparkles className="w-4 h-4" />
            <h2 className="text-sm font-bold uppercase tracking-wider">Motor de IA (Google Gemini)</h2>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">A chave de API do Gemini fica somente no servidor através de variável de ambiente. As aulas e questões geradas são armazenadas no banco para evitar geração repetida desnecessária.</p>
          <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl">
            <ShieldCheck className="w-4 h-4" />
            <span>IA configurada no servidor</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-3">
          <div className="flex items-center gap-2 text-amber-400">
            <Download className="w-4 h-4" />
            <h2 className="text-sm font-bold uppercase tracking-wider">Backup e Exportação de Dados</h2>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">Exporte seu progresso, desempenho por tópico, tentativas, simulados, sessões de estudo, avaliações de flashcards e conversas com o Professor IA em um único JSON.</p>
          <button type="button" onClick={handleExportData} disabled={isExporting} className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-60 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors">
            <Download className="w-4 h-4 text-emerald-400" />
            <span>{isExporting ? "Gerando backup..." : "Exportar Backup Completo"}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
