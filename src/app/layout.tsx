import type { Metadata } from "next";
import "./globals.css";
import { AppHeader } from "@/components/layout/AppHeader";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { BottomNav } from "@/components/layout/BottomNav";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "TRANSPETRO STUDY 2026.3 • Ênfase 18: Suprimento de Bens e Serviços",
  description: "Plataforma especializada de estudos para o concurso da Transpetro 2026.3. Banca Cesgranrio.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full bg-slate-950">
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 antialiased selection:bg-emerald-500 selection:text-white">
        <AppHeader />
        <div className="flex-1 flex max-w-7xl w-full mx-auto">
          <SidebarNav />
          <main className="flex-1 p-3 sm:p-6 pb-24 sm:pb-8 w-full max-w-5xl overflow-y-auto">
            {children}
          </main>
        </div>
        <BottomNav />
        <Toaster
          richColors
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: "#0f172a",
              color: "#f8fafc",
              border: "1px solid #1e293b",
            },
          }}
        />
      </body>
    </html>
  );
}
