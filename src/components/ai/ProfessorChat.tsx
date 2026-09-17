"use client";

import React, { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import {
  Bot,
  User,
  Send,
  Sparkles,
  Target,
  BookOpen,
  AlertTriangle,
  Lightbulb,
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ProfessorChatProps {
  initialConversationId?: string;
  initialQuestion?: string;
}

export const ProfessorChat: React.FC<ProfessorChatProps> = ({
  initialConversationId,
  initialQuestion = "",
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Olá, Rafael! Sou seu **Professor IA especializado na Transpetro (2026.3 • Ênfase 18)** e na banca **Fundação Cesgranrio**.\n\nConheço todo o edital, suas notas e seus erros mais recentes. Posso explicar matérias, resumir leis como o Decreto 2.745 e a Lei 13.303, apontar pegadinhas da Cesgranrio ou montar seu próximo plano de estudo. O que deseja ver agora?",
    },
  ]);
  const [inputMessage, setInputMessage] = useState(initialQuestion);
  const [conversationId, setConversationId] = useState<string | undefined>(
    initialConversationId
  );
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || isLoading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/professor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          conversationId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao consultar o Professor IA.");

      setConversationId(data.conversationId);
      setMessages((prev) => [
        ...prev,
        {
          id: data.messageId || `ai-${Date.now()}`,
          role: "assistant",
          content: data.response,
        },
      ]);
    } catch (err: any) {
      toast.error(err.message || "Erro na conexão com o Professor IA.");
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    "O que devo estudar agora?",
    "Quais são meus pontos mais fracos?",
    "Explique a Lei 13.303/2016 para a Cesgranrio",
    "Qual a diferença entre Estoque de Segurança e Estoque Máximo?",
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col h-[calc(100dvh-175px)] sm:h-[calc(100vh-120px)] shadow-xl overflow-hidden">
      {/* Topo do Chat */}
      <div className="bg-slate-850 px-4 sm:px-6 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
            <Bot className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span className="truncate">Professor IA Transpetro</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            </h2>
            <p className="text-[10px] text-slate-400 truncate">
              Conectado ao seu histórico de estudo • Banca Cesgranrio
            </p>
          </div>
        </div>

        <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-1 rounded-md border border-slate-700 shrink-0">
          Ênfase 18
        </span>
      </div>

      {/* Área de Mensagens */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map((m) => {
          const isUser = m.role === "user";
          return (
            <div
              key={m.id}
              className={`flex items-start gap-2.5 ${
                isUser ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  isUser
                    ? "bg-slate-700 text-slate-200"
                    : "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400"
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[85%] sm:max-w-xl p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-line shadow-sm ${
                  isUser
                    ? "bg-emerald-600 text-white rounded-tr-none"
                    : "bg-slate-800/90 border border-slate-700/80 text-slate-200 rounded-tl-none"
                }`}
              >
                {m.content}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <span className="italic">O Professor IA está elaborando sua resposta...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Prompts Rápidos */}
      <div className="px-4 py-2 bg-slate-850/60 border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {quickPrompts.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSend(prompt)}
            disabled={isLoading}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] text-slate-300 hover:text-white whitespace-nowrap transition-colors"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Campo de Envio */}
      <div className="p-3 sm:p-4 bg-slate-850 border-t border-slate-800 flex items-center gap-2">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Pergunte ao Professor sobre qualquer tópico do edital..."
          disabled={isLoading}
          className="flex-1 bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition-colors"
        />

        <button
          onClick={() => handleSend()}
          disabled={!inputMessage.trim() || isLoading}
          className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-bold text-xs sm:text-sm transition-all active:scale-95 shadow-md flex items-center gap-1.5 shrink-0"
        >
          <span>Enviar</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
