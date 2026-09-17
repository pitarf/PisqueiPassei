import { GoogleGenerativeAI } from "@google/generative-ai";
import { getRagContext } from "./rag";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export const SYSTEM_INSTRUCTION_TRANSPETRO = `
Você é o Professor IA especialista no Processo Seletivo da TRANSPETRO 2026.3, Ênfase 18 - Suprimento de Bens e Serviços, organizado pela Fundação Cesgranrio. A prova será em 06/12/2026.

REGRAS OBRIGATÓRIAS DE CONTEÚDO:
1. O edital e as fontes oficiais locais recuperadas pelo RAG são a base prioritária.
2. O edital define o que deve ser estudado. Fontes normativas sustentam detalhes jurídicos.
3. Diferencie sempre [CONTEÚDO PREVISTO NO EDITAL] de [INFORMAÇÃO COMPLEMENTAR].
4. Em legislação, nunca invente artigos, prazos, modalidades, requisitos ou redações.
5. Fonte marcada como status=pointer é apenas referência de localização/escopo, nunca transcrição integral.
6. Nunca apresente questão gerada por IA como questão real ou previamente aplicada pela Cesgranrio.
7. Toda questão inédita deve ser tratada como "Questão gerada por IA, baseada no conteúdo do edital.".
8. Não use "banca: Cesgranrio" para uma questão inédita. O perfil pode ser Cesgranrio, mas a origem é IA.
9. Se o RAG não sustentar um detalhe jurídico, informe que o detalhe precisa ser conferido na fonte oficial.
10. Não transforme informação complementar em conteúdo oficialmente previsto.

DIRETRIZES DE COMUNICAÇÃO HUMANA (HUMANIZER):
- Escreva como um professor ou mentor humano experiente: direto ao ponto, claro, acolhedor e sem pedantismo.
- Evite vícios típicos de IA: não use fórmulas repetitivas como "não apenas X, mas também Y", "é fundamental lembrar que", "mergulhar em", "tapeçaria", "ecossistema" desnecessário, ou introduções pomposas vazias.
- Não comece nem termine toda resposta com frases de efeito genéricas ("Em suma...", "Rumo à sua aprovação!").
- Vá direto à explicação, usando frases curtas e objetivas intercaladas com exemplos práticos do dia a dia da Transpetro e da logística.
- Seja honesto, realista e natural.
`;

function requireApiKey() {
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY não configurada no servidor.");
  }
}

function groundedContext(query: string, subjectName?: string, officialSource?: string | null) {
  return `\n\n=== CONTEXTO RAG LOCAL ===\n${getRagContext(query, { subjectName, officialSource })}\n=== FIM DO CONTEXTO RAG ===\n`;
}

function safeJsonParse<T>(rawText: string, fallbackDesc: string): T {
  const clean = rawText
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(clean) as T;
  } catch (err) {
    const firstBrace = clean.indexOf("{");
    const lastBrace = clean.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(clean.slice(firstBrace, lastBrace + 1)) as T;
      } catch {
        // Falha no slice
      }
    }
    throw new Error(`Falha ao decodificar JSON retornado pela IA para ${fallbackDesc}: ${(err as Error).message}`);
  }
}

export async function generateStructuredLesson(
  topicTitle: string,
  subjectName: string,
  officialSource?: string | null
) {
  requireApiKey();
  const model = genAI.getGenerativeModel({
    model: "gemini-3.6-flash",
    systemInstruction: SYSTEM_INSTRUCTION_TRANSPETRO,
    generationConfig: { temperature: 0.2, responseMimeType: "application/json" },
  });
  const rag = groundedContext(`${subjectName} ${topicTitle}`, subjectName, officialSource);
  const prompt = `Gere uma aula completa e prática para o tópico abaixo.
Disciplina: "${subjectName}"
Tópico: "${topicTitle}"
${officialSource ? `Base oficial: "${officialSource}"` : ""}
${rag}

Priorize o conteúdo previsto no edital e deixe qualquer conteúdo complementar claramente identificado. Em legislação, não extrapole as fontes recuperadas.

Retorne JSON com title e sections contendo:
step1_whatYouNeedToLearn,
step2_simpleExplanation,
step3_fundamentalConcepts,
step4_examples,
step5_cesgranrioTraps,
step6_whatToMemorize,
step7_summary,
step8_flashcards (front/back),
step9_practiceQuestions (statement, optionA-E, correctOption, explanation).

As practiceQuestions são inéditas e geradas por IA. Não atribua a elas aplicação pela Cesgranrio.`;
  const result = await model.generateContent(prompt);
  return safeJsonParse<any>(result.response.text(), `aula do tópico "${topicTitle}"`);
}

export async function generateQuestionBatch(
  topicTitle: string,
  subjectName: string,
  count = 5,
  difficulty = "MEDIA",
  officialSource?: string | null
) {
  requireApiKey();
  const model = genAI.getGenerativeModel({
    model: "gemini-3.6-flash",
    systemInstruction: SYSTEM_INSTRUCTION_TRANSPETRO,
    generationConfig: { temperature: 0.2, responseMimeType: "application/json" },
  });
  const rag = groundedContext(`${subjectName} ${topicTitle}`, subjectName, officialSource);
  const prompt = `Gere exatamente ${count} questões inéditas A-E no perfil de cobrança da Cesgranrio.
Disciplina: "${subjectName}".
Tópico: "${topicTitle}".
Dificuldade: "${difficulty}".
${rag}

Teste somente conteúdo sustentado pelo edital e pelas fontes recuperadas. Em legislação, não crie artigo ou regra ausente nas fontes.
As questões são INÉDITAS e GERADAS POR IA. Nunca diga que foram aplicadas pela Cesgranrio.

Retorne somente JSON no formato:
{"questions":[{"statement":"...","optionA":"...","optionB":"...","optionC":"...","optionD":"...","optionE":"...","correctOption":"A","explanation":"...","difficulty":"${difficulty}","origin":"AI_GENERATED"}]}`;
  const result = await model.generateContent(prompt);
  return safeJsonParse<{ questions?: any[] }>(result.response.text(), `lote de questões de "${topicTitle}"`);
}

export async function askProfessorAI(
  userMessage: string,
  context: {
    studentName: string;
    currentMastery: number;
    weakPoints: string[];
    recentErrors: string[];
  },
  chatHistory: { role: string; content: string }[] = []
) {
  requireApiKey();
  const rag = groundedContext(userMessage);
  const model = genAI.getGenerativeModel({
    model: "gemini-3.6-flash",
    systemInstruction: `${SYSTEM_INSTRUCTION_TRANSPETRO}
Aluno: ${context.studentName}
Média: ${context.currentMastery.toFixed(1)}%
Pontos fracos: ${context.weakPoints.join(", ") || "Nenhum"}
Erros recentes: ${context.recentErrors.join("; ") || "Nenhum"}${rag}
Aja como mentor direto e técnico. Quando responder sobre legislação, baseie-se no contexto recuperado e sinalize quando for necessário conferir a fonte oficial.`,
  });
  const contents = [
    ...chatHistory.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
    { role: "user", parts: [{ text: userMessage }] },
  ];
  const result = await model.generateContent({ contents });
  return result.response.text();
}
