import { GoogleGenerativeAI } from "@google/generative-ai";
import { getRagContext } from "./rag";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export const SYSTEM_INSTRUCTION_TRANSPETRO = `
Você é o Professor IA especialista no Processo Seletivo da TRANSPETRO 2026.3, Ênfase 18 - Suprimento de Bens e Serviços, organizado pela Fundação Cesgranrio. A prova será em 06/12/2026.

REGRAS OBRIGATÓRIAS DE CONTEÚDO E RIGOR CONCEITUAL:
1. O edital e as fontes oficiais locais recuperadas pelo RAG são a base absoluta e prioritária.
2. O edital define o que deve ser estudado. Fontes normativas sustentam detalhes jurídicos e técnicos.
3. Diferencie sempre [CONTEÚDO PREVISTO NO EDITAL] de [INFORMAÇÃO COMPLEMENTAR].
4. Rigor normativo estrito: em matérias de legislação do edital (como Lei 13.303/2016 - Estatuto das Estatais, Lei 14.133/2021 - Nova Lei de Licitações, Decreto 2.745/1998 - Regulamento Licitatório Simplificado da Petrobras, LGPD - Lei 13.709/2018, LC 123/2006, Código de Ética e Conduta da Petrobras), cite sempre os artigos e dispositivos legais pertinentes e fidedignos.
5. Proibição absoluta de alucinação: NUNCA invente leis fictícias, artigos inexistentes, prazos arbitrários, percentuais inventados ou redações normativas apócrifas. Se um detalhe legal ou procedimental não constar no contexto recuperado ou na legislação pátria em vigor, aponte a limitação com honestidade e exija conferência na fonte oficial.
6. Fonte marcada como status=pointer é apenas referência de localização/escopo, nunca transcrição integral.
7. Em nenhuma hipótese questões geradas por IA recebam rótulo que induza a achar que são questões oficiais da banca ou da Transpetro. Forçar origin='INEDITA_IA', banca='IA (perfil Cesgranrio)' com a nota explícita 'Questão inédita em estilo compatível com o perfil da banca'.
8. Não use "banca: Cesgranrio" para uma questão inédita. O perfil estilístico é Cesgranrio, mas a autoria é de inteligência artificial.
9. Equilíbrio estrutural das alternativas: todas as opções (A a E) devem ter extensão equilibrada e grau comparável de detalhe. NUNCA torne a alternativa correta um outlier excessivamente longo ou explicativo que entregue a resposta pelo tamanho.
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
  officialSource?: string | null,
  historicalContext?: string | null
) {
  requireApiKey();
  const model = genAI.getGenerativeModel({
    model: "gemini-3.8-flash",
    systemInstruction: SYSTEM_INSTRUCTION_TRANSPETRO,
    generationConfig: { temperature: 0.2, responseMimeType: "application/json" },
  });
  const rag = groundedContext(`${subjectName} ${topicTitle}`, subjectName, officialSource);
  const prompt = `Gere uma aula completa e prática para o tópico abaixo.
Disciplina: "${subjectName}"
Tópico: "${topicTitle}"
${officialSource ? `Base oficial: "${officialSource}"` : ""}
${rag}

Priorize o conteúdo previsto no edital e deixe qualquer conteúdo complementar claramente identificado. Em legislação, não extrapole as fontes recuperadas e cite dispositivos reais.

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

As practiceQuestions são inéditas e geradas por IA (origin: "INEDITA_IA", banca: "IA (perfil Cesgranrio)"). Não atribua a elas aplicação prévia pela Cesgranrio. Mantenha as alternativas equilibradas em tamanho.`;
  const result = await model.generateContent(prompt);
  return safeJsonParse<any>(result.response.text(), `aula do tópico "${topicTitle}"`);
}

export function summarizeHistoricalPatterns(
  rows: Array<{
    topicTitle: string;
    difficulty?: string | null;
    questionType?: string | null;
    cognitiveLevel?: string | null;
  }>
) {
  const count = (values: string[]) => values.reduce<Record<string, number>>((acc, value) => {
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
  return {
    total: rows.length,
    difficulty: count(rows.map(r => r.difficulty || "SEM_CLASSIFICACAO")),
    questionType: count(rows.map(r => r.questionType || "SEM_CLASSIFICACAO")),
    cognitiveLevel: count(rows.map(r => r.cognitiveLevel || "SEM_CLASSIFICACAO")),
  };
}

export async function generateQuestionBatch(
  topicTitle: string,
  subjectName: string,
  count = 5,
  difficulty = "MEDIA",
  officialSource?: string | null,
  historicalContext?: string | null
) {
  requireApiKey();
  const model = genAI.getGenerativeModel({
    model: "gemini-3.8-flash",
    systemInstruction: SYSTEM_INSTRUCTION_TRANSPETRO,
    generationConfig: { temperature: 0.2, responseMimeType: "application/json" },
  });
  const rag = groundedContext(`${subjectName} ${topicTitle}`, subjectName, officialSource);
  const prompt = `Gere exatamente ${count} questões inéditas A-E no perfil de cobrança da Cesgranrio.
Disciplina: "${subjectName}".
Tópico: "${topicTitle}".
Dificuldade: "${difficulty}".
${rag}
${historicalContext ? `Padrões históricos estruturados, use apenas como calibração: ${historicalContext}` : ""}

DIRETRIZES DE RIGOR CONCEITUAL E LEGISLAÇÃO:
- Rigor normativo estrito: para tópicos com legislação (Lei 13.303/2016, Lei 14.133/2021, Decreto 2.745/1998, LGPD - Lei 13.709/2018, LC 123/2006, etc.), cite sempre artigos pertinentes na justificativa da resposta.
- Proibição absoluta de alucinações: NUNCA crie artigos fictícios, números inventados ou prazos arbitrários.
- Equilíbrio formal de alternativas: todas as alternativas (A a E) devem ter extensão similar; JAMAIS elabore a alternativa correta com extensão ou detalhamento desproporcional (não crie outliers que entreguem o gabarito).
- Distratores pedagógicos e plausíveis: opções incorretas devem refletir equívocos conceituais típicos da banca Cesgranrio.
- Origem e atribuição: as questões são estritamente INÉDITAS e geradas por IA. É proibido atribuir aplicação real pela Cesgranrio.

Retorne somente JSON no formato:
{"questions":[{"statement":"...","optionA":"...","optionB":"...","optionC":"...","optionD":"...","optionE":"...","correctOption":"A","explanation":"...","difficulty":"${difficulty}","origin":"INEDITA_IA","questionType":"APLICACAO","cognitiveLevel":"APLICAR","subtopic":"...","sourceRef":"Questão inédita em estilo compatível com o perfil da banca. Baseada no edital e no perfil de cobrança histórico."}]}`;
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
    model: "gemini-3.8-flash",
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


export type HistoricalQuestionPattern = {
  statement: string;
  topicTitle: string;
  subjectName: string;
  difficulty: string;
  correctOption?: string;
  explanation?: string;
  origin?: string;
  questionType?: string | null;
  cognitiveLevel?: string | null;
  subtopic?: string | null;
  sourceRef?: string | null;
};

export async function generateSiblingQuestionBatch(
  pattern: HistoricalQuestionPattern,
  variants: { difficulty: string; mode: "FACIL" | "EQUIVALENTE" | "DIFICIL" | "NOVO_CENARIO" | "DISTRATORES" }[],
) {
  requireApiKey();
  const model = genAI.getGenerativeModel({
    model: "gemini-3.8-flash",
    systemInstruction: SYSTEM_INSTRUCTION_TRANSPETRO,
    generationConfig: { temperature: 0.25, responseMimeType: "application/json" },
  });

  const rag = groundedContext(
    `${pattern.subjectName} ${pattern.topicTitle} ${pattern.statement}`,
    pattern.subjectName,
  );

  const requested = variants.map((v, index) => ({
    index: index + 1,
    difficulty: v.difficulty,
    mode: v.mode,
  }));

  const prompt = `Crie questões IRMÃS ORIGINAIS a partir do padrão de referência abaixo.
A questão de referência serve exclusivamente para identificar o conteúdo programático, a estrutura de cobrança e a taxonomia pedagógica. NÃO copie o enunciado, nem as opções e nem a redação.

Disciplina: "${pattern.subjectName}"
Tópico oficial: "${pattern.topicTitle}"
Dificuldade da referência: "${pattern.difficulty}"
Tipo: "${pattern.questionType || "não informado"}"
Nível cognitivo: "${pattern.cognitiveLevel || "não informado"}"
Referência original: "${pattern.sourceRef || "não informada"}"
Questão de referência:
"${pattern.statement}"

Contexto oficial recuperado:
${rag}

Gere exatamente estas variações pedagógicas:
${JSON.stringify(requested)}

REGRAS PEDAGÓGICAS ESPECÍFICAS PARA OS 5 TIPOS DE VARIANTES:
1. MODO "FACIL":
   - Foco na identificação direta do conceito, regra legal expressa ou definição central do tópico.
   - Enunciado claro e direto, sem premissas desnecessárias.
   - Alternativas com contrastes conceituais nítidos, evitando ambiguidades sutis.
   - Mantém rigor normativo com citação de artigo real se envolver legislação.

2. MODO "EQUIVALENTE":
   - Mantém o mesmo nível de complexidade, densidade de texto e grau de exigência cognitiva da questão de referência.
   - Aplica os mesmos dispositivos normativos ou fórmulas a uma situação similar, variando termos e dados técnicos.

3. MODO "DIFICIL":
   - Eleva a exigência cognitiva para análise crítica e aplicação de regras em cenários complexos.
   - Explora hipóteses de exceção expressas na lei (ex.: casos estritos de dispensa vs inexigibilidade da Lei 13.303/2016 vs Lei 14.133/2021) ou cálculos com múltiplas variáveis operacionais.
   - Não invente regras: a dificuldade vem da profundidade analítica fundamentada no edital.

4. MODO "NOVO_CENARIO":
   - Cobra rigorosamente o mesmo dispositivo legal ou conceito técnico de suprimentos, mas transportado para uma situação operacional inédita e verossímil das atividades da Petrobras/Transpetro (ex.: movimentação em terminal aquaviário, suprimento de sobressalentes navais, contratação de serviços de manutenção industrial de dutos, estocagem em almoxarifados portuários).

5. MODO "DISTRATORES":
   - Questão desenhada com armadilhas conceituais típicas e sofisticadas da banca Cesgranrio nos distratores:
     a) Confusão intencional entre institutos conexos (ex.: dispensa x inexigibilidade; estoque mínimo x estoque de segurança; eficácia x eficiência);
     b) Extrapolação de regra legal (ex.: transformar faculdade da Lei 13.303 em dever vinculativo; misturar regras da Lei das Estatais com a Lei Geral de Licitações);
     c) Troca de prazos/quantitativos reais previstos na legislação do edital;
     d) Generalizações indevidas ("sempre", "em qualquer hipótese").
   - A explicação (explanation) DEVE justificar detalhadamente o erro específico de CADA distrator e expor a armadilha conceitual empregada.

REGRAS UNIVERSAIS DE INTEGRIDADE PEDAGÓGICA:
- Todas as questões devem ser 100% inéditas e originais.
- Rigor de atribuição: "origin" deve ser "INEDITA_IA", "banca" deve ser "IA (perfil Cesgranrio)" e "sourceRef" deve conter a nota explícita "Questão inédita em estilo compatível com o perfil da banca".
- NUNCA atribua aplicação a concurso oficial ou prova real.
- Equilíbrio de tamanho: todas as alternativas devem ter comprimento similar. A correta NUNCA deve ser mais longa ou detalhada que os distratores.
- Rigor legal absoluto: cite artigos reais das leis do edital e jamais invente artigos, regras ou prazos.

Retorne somente JSON no formato:
{"questions":[{"statement":"...","optionA":"...","optionB":"...","optionC":"...","optionD":"...","optionE":"...","correctOption":"A","explanation":"...","difficulty":"...","origin":"INEDITA_IA","questionType":"...","cognitiveLevel":"...","subtopic":"...","sourceRef":"Questão inédita em estilo compatível com o perfil da banca. Variação pedagógica baseada em padrão histórico."}]}
`;

  const result = await model.generateContent(prompt);
  return safeJsonParse<{ questions?: any[] }>(
    result.response.text(),
    "questões irmãs baseadas em padrão histórico",
  );
}
