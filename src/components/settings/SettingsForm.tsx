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
            <h2 className="text-sm font-bold uppercase tracking-wider">Suas Metas</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Meta de acertos na prova</label>
              <div className="flex items-center gap-2">
                <input type="number" min="30" max="60" value={targetScore} onChange={(e) => setTargetScore(Number(e.target.value))} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-bold outline-none focus:border-emerald-500" />
                <span className="text-xs text-slate-400 font-semibold shrink-0">/ 60 questões</span>
              </div>
              <p className="text-[11px] text-slate-500">Sua meta pessoal para os simulados (o padrão recomendado é 47/60).</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Tempo diário de estudo</label>
              <div className="flex items-center gap-2">
                <input type="number" step="0.5" min="1" max="12" value={dailyHours} onChange={(e) => setDailyHours(Number(e.target.value))} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-bold outline-none focus:border-emerald-500" />
                <span className="text-xs text-slate-400 font-semibold shrink-0">horas por dia</span>
              </div>
              <p className="text-[11px] text-slate-500">Ajuda a calibrar seu cronograma até o dia da prova.</p>
            </div>
          </div>
          <div className="pt-2">
            <button type="submit" disabled={isSaving} className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-slate-950 font-bold text-xs shadow-md transition-colors flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSaving ? "Salvando..." : "Salvar alterações"}</span>
            </button>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-3">
          <div className="flex items-center gap-2 text-sky-400">
            <Sparkles className="w-4 h-4" />
            <h2 className="text-sm font-bold uppercase tracking-wider">Inteligência Artificial (Gemini)</h2>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">Sua chave de acesso ao Gemini fica protegida no servidor. As explicações e questões geradas são salvas para você poder revisitar sem consumir novas chamadas.</p>
          <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl">
            <ShieldCheck className="w-4 h-4" />
            <span>Serviço ativo e protegido no servidor</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-3">
          <div className="flex items-center gap-2 text-amber-400">
            <Download className="w-4 h-4" />
            <h2 className="text-sm font-bold uppercase tracking-wider">Backup e Cópia de Segurança</h2>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">Baixe um arquivo completo com todo o seu progresso: questões respondidas, simulados, horas de estudo, flashcards e mensagens com o professor.</p>
          <button type="button" onClick={handleExportData} disabled={isExporting} className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-60 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors">
            <Download className="w-4 h-4 text-emerald-400" />
            <span>{isExporting ? "Preparando arquivo..." : "Baixar cópia de segurança"}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
