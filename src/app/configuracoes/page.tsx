import React from "react";
import { prisma } from "@/lib/prisma";
import { SettingsForm } from "@/components/settings/SettingsForm";

export const revalidate = 0;

export default async function ConfiguracoesPage() {
  const user = await prisma.user.findFirst({
    where: { email: "rafael@estudos.transpetro" },
  });

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-md">
        <h1 className="text-xl sm:text-2xl font-black text-white">
          Configurações
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Ajuste suas metas de estudo, entenda a integração com a IA e exporte seus dados quando quiser.
        </p>
      </div>

      <SettingsForm
        initialTargetScore={user?.targetScore || 47}
        initialHours={user?.dailyStudyHours || 2.5}
      />
    </div>
  );
}
