import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

/**
 * Prompt de sistema com diretrizes estritas da Banca Cesgranrio
 * e regras anti-alucinação de legislação do edital Transpetro 2026.3.
 */
export const SYSTEM_INSTRUCTION_TRANSPETRO = `
Você é o Professor IA especialista supremo no Processo Seletivo da TRANSPETRO (Petrobras Transporte S.A.), edital TRANSPETRO/PSP/TERRA/NÍVEL MÉDIO - 2026.3, para o cargo de Profissional Transpetro de Nível Técnico, Ênfase 18: Suprimento de Bens e Serviços, organizado pela Fundação Cesgranrio. A prova será em 06/12/2026.

REGRAS DE CONDUTA E DIRETRIZES FUNDAMENTAIS:
1. FIDELIDADE ABSOLUTA AO EDITAL:
   - O edital oficial é sua única fonte de verdade. Nunca invente matérias, leis ou prazos.
   - Em todas as suas respostas, diferencie explicitamente:
     • [CONTEÚDO PREVISTO NO EDITAL]: O que está estritamente delimitado no programa oficial.
     • [INFORMAÇÃO COMPLEMENTAR]: Doutrina ou contexto adicional que auxilia na compreensão.
2. RIGOR NA LEGISLAÇÃO:
   - Decreto nº 2.745/1998 (Procedimento Licitatório Simplificado da Petrobras).
   - Lei nº 13.303/2016 (Estatuto das Estatais - artigos 28 a 91).
   - LC nº 123/2006 (ME e EPP - artigos 42 a 49).
   - Lei nº 14.133/2021 (Nova Lei de Licitações) e Regulamento da Transpetro (RLCP).
   - LGPD (Lei nº 13.709/2018) em contratações.
   NUNCA invente números de artigos, prazos decadenciais ou modalidades licitatórias que não existam nessas normas.
3. ESTILO DA BANCA CESGRANRIO:
   - A Cesgranrio é técnica, direta e adora situações-problema práticas de transporte, estoque, suprimento e compras públicas.
   - Destacar sempre "Pegadinhas Clássicas da Cesgranrio".
4. IDENTIFICAÇÃO DE QUESTÕES:
   - Quando gerar questões inéditas, identifique sempre como: "Questão gerada por IA, baseada no conteúdo do edital."
`;

/**
 * Gera uma aula completa estruturada em 9 etapas didáticas para um tópico do edital
 */
export async function generateStructuredLesson(topicTitle: string, subjectName: string, officialSource?: string | null) {
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: SYSTEM_INSTRUCTION_TRANSPETRO,
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json",
    },
  });

  const prompt = `
Gere uma aula completa, aprofundada e prática para o tópico:
Disciplina: "${subjectName}"
Tópico: "${topicTitle}"
${officialSource ? `Base Oficial/Normativa: "${officialSource}"` : ""}

Retorne OBRIGATORIAMENTE um JSON com o seguinte schema exato:
{
  "title": "${topicTitle}",
  "sections": {
    "step1_whatYouNeedToLearn": "Texto claro com os objetivos de aprendizado exatos para a prova da Cesgranrio",
    "step2_simpleExplanation": "Explicação em linguagem simples e analógica do tema",
    "step3_fundamentalConcepts": "Conceitos teóricos e técnicos aprofundados com diferenciação [CONTEÚDO PREVISTO NO EDITAL] e [INFORMAÇÃO COMPLEMENTAR]",
    "step4_examples": "Exemplos práticos reais focados na operação da Transpetro / Petrobras",
    "step5_cesgranrioTraps": "As maiores pegadinhas e pegadinhas recorrentes da banca Fundação Cesgranrio neste assunto",
    "step6_whatToMemorize": "Mnemônicos, prazos, fórmulas ou listas cruciais para memorização",
    "step7_summary": "Resumo executivo em tópicos (bullet points) para revisão rápida",
    "step8_flashcards": [
      { "front": "Pergunta ou conceito chave", "back": "Resposta objetiva" },
      { "front": "Pergunta ou conceito chave 2", "back": "Resposta objetiva 2" },
      { "front": "Pergunta ou conceito chave 3", "back": "Resposta objetiva 3" }
    ],
    "step9_practiceQuestions": [
      {
        "statement": "Enunciado estilo Cesgranrio com situação-problema...",
        "optionA": "Opção A",
        "optionB": "Opção B",
        "optionC": "Opção C",
        "optionD": "Opção D",
        "optionE": "Opção E",
        "correctOption": "A",
        "explanation": "Explicação detalhada do porquê a alternativa A é correta com fundamentação normativa."
      }
    ]
  }
}
`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  return JSON.parse(text);
}

/**
 * Gera uma bateria de questões estilo Cesgranrio
 */
export async function generateQuestionBatch(
  topicTitle: string,
  subjectName: string,
  count: number = 5,
  difficulty: string = "MEDIA"
) {
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: SYSTEM_INSTRUCTION_TRANSPETRO,
    generationConfig: {
      temperature: 0.3,
      responseMimeType: "application/json",
    },
  });

  const prompt = `
Gere exatamente ${count} questões inéditas de múltipla escolha (A, B, C, D, E) com o perfil rigoroso da banca Fundação Cesgranrio para a Transpetro.
Disciplina: "${subjectName}"
Tópico: "${topicTitle}"
Nível de Dificuldade: "${difficulty}"

Retorne OBRIGATORIAMENTE um JSON com este array:
{
  "questions": [
    {
      "statement": "Enunciado no estilo Cesgranrio...",
      "optionA": "Alternativa A",
      "optionB": "Alternativa B",
      "optionC": "Alternativa C",
      "optionD": "Alternativa D",
      "optionE": "Alternativa E",
      "correctOption": "C",
      "explanation": "Explicação pedagógica completa, indicando [CONTEÚDO PREVISTO NO EDITAL] e [INFORMAÇÃO COMPLEMENTAR] se aplicável.",
      "difficulty": "${difficulty}"
    }
  ]
}
`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  return JSON.parse(text);
}

/**
 * Resposta interativa do Professor IA com contexto do aluno
 */
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
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: `${SYSTEM_INSTRUCTION_TRANSPETRO}
Aluno Atual: ${context.studentName}
Média Geral Atual: ${context.currentMastery.toFixed(1)}%
Pontos Fracos Recentes do Aluno: ${context.weakPoints.join(", ") || "Nenhum no momento"}
Erros Recentes em Questões: ${context.recentErrors.join("; ") || "Nenhum registrado"}

Aja como um mentor focado, encorajador, altamente técnico e direto ao ponto. Ajude ${context.studentName} a alcançar a meta de 47/60 pontos na Transpetro!`,
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
