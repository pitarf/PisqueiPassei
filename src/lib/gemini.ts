import { GoogleGenerativeAI } from "@google/generative-ai";
import { getRagContext } from "./rag";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export const SYSTEM_INSTRUCTION_TRANSPETRO = `
Você é o Professor IA especialista no Processo Seletivo da TRANSPETRO 2026.3, Ênfase 18 - Suprimento de Bens e Serviços, organizado pela Fundação Cesgranrio. A prova será em 06/12/2026.

REGRAS:
1. O edital e as fontes oficiais locais recuperadas pelo RAG são a base prioritária.
2. Diferencie sempre [CONTEÚDO PREVISTO NO EDITAL] de [INFORMAÇÃO COMPLEMENTAR].
3. Em legislação, nunca invente artigos, prazos, modalidades, requisitos ou redações. Se a fonte recuperada não sustentar uma afirmação, diga isso claramente.
4. Não trate conteúdo gerado por IA como texto oficial de lei.
5. Questões inéditas devem ser identificadas como "Questão gerada por IA, baseada no conteúdo do edital.".
6. Destaque pegadinhas e situações-problema compatíveis com a Cesgranrio, sem afirmar que uma questão inédita foi aplicada pela banca.
`;

function groundedContext(query: string) {
  return `\n\n=== CONTEXTO RAG LOCAL ===\n${getRagContext(query)}\n=== FIM DO CONTEXTO RAG ===\n`;
}

export async function generateStructuredLesson(topicTitle: string, subjectName: string, officialSource?: string | null) {
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: SYSTEM_INSTRUCTION_TRANSPETRO,
    generationConfig: { temperature: 0.2, responseMimeType: "application/json" },
  });

  const rag = groundedContext(`${subjectName} ${topicTitle} ${officialSource || ""}`);
  const prompt = `Gere uma aula completa e prática para o tópico:\nDisciplina: "${subjectName}"\nTópico: "${topicTitle}"\n${officialSource ? `Base oficial: "${officialSource}"` : ""}\n${rag}\n\nUse o RAG como fonte primária. Retorne JSON com: title e sections contendo step1_whatYouNeedToLearn, step2_simpleExplanation, step3_fundamentalConcepts, step4_examples, step5_cesgranrioTraps, step6_whatToMemorize, step7_summary, step8_flashcards (array de front/back) e step9_practiceQuestions (array com statement, optionA-E, correctOption e explanation).`;

  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text());
}

export async function generateQuestionBatch(topicTitle: string, subjectName: string, count = 5, difficulty = "MEDIA") {
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: SYSTEM_INSTRUCTION_TRANSPETRO,
    generationConfig: { temperature: 0.3, responseMimeType: "application/json" },
  });

  const rag = groundedContext(`${subjectName} ${topicTitle}`);
  const prompt = `Gere exatamente ${count} questões inéditas A-E no perfil Cesgranrio. Disciplina: "${subjectName}". Tópico: "${topicTitle}". Dificuldade: "${difficulty}". ${rag}\nRetorne {"questions":[{"statement":"...","optionA":"...","optionB":"...","optionC":"...","optionD":"...","optionE":"...","correctOption":"A","explanation":"...","difficulty":"${difficulty}"}]}. Não invente fundamento normativo. Identifique a origem como IA no uso da aplicação.`;

  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text());
}

export async function askProfessorAI(
  userMessage: string,
  context: { studentName: string; currentMastery: number; weakPoints: string[]; recentErrors: string[] },
  chatHistory: { role: string; content: string }[] = []
) {
  const rag = groundedContext(userMessage);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: `${SYSTEM_INSTRUCTION_TRANSPETRO}\nAluno: ${context.studentName}\nMédia: ${context.currentMastery.toFixed(1)}%\nPontos fracos: ${context.weakPoints.join(", ") || "Nenhum"}\nErros recentes: ${context.recentErrors.join("; ") || "Nenhum"}${rag}\nAja como mentor direto e técnico.`,
  });

  const contents = [
    ...chatHistory.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
    { role: "user", parts: [{ text: userMessage }] },
  ];

  const result = await model.generateContent({ contents });
  return result.response.text();
}
