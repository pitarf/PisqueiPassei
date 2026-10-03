/**
 * Orquestrador Mestre de Expansão do Acervo Pedagógico - TRANSPETRO STUDY 2026.3
 * Ênfase 18: Suprimento de Bens e Serviços
 *
 * Suporta expansão modular por disciplina até a meta de 40 questões por tópico (1.880 no total).
 * Uso: node -r dotenv/config scripts/expand-bank.js --subject="Logística" --target=40 --batch=5
 */

const { PrismaClient } = require("@prisma/client");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { createHash } = require("crypto");
const fs = require("fs");
const path = require("path");

const {
  evaluateSemanticSimilarity,
  validateExcelFunctions,
  validateLegislationCitations,
} = require("./pedagogical-audit-engine");

const prisma = new PrismaClient();
const apiKey = process.env.GEMINI_API_KEY || "";
if (!apiKey) {
  console.error("❌ ERRO: GEMINI_API_KEY não configurada no ambiente (.env)");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

function normalizeText(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function computeStatementHash(statement) {
  return createHash("sha256").update(normalizeText(statement)).digest("hex");
}

function getRagContext(query) {
  try {
    const docsDir = path.join(__dirname, "..", "documents");
    if (!fs.existsSync(docsDir)) return "";

    function collectMarkdownFiles(dir) {
      if (!fs.existsSync(dir)) return [];
      return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) return collectMarkdownFiles(fullPath);
        return entry.isFile() && entry.name.endsWith(".md") ? [fullPath] : [];
      });
    }

    const files = collectMarkdownFiles(docsDir);
    const norm = (t) => String(t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const normQuery = norm(query);
    const terms = normQuery.split(/[^a-z0-9]+/).filter((t) => t.length >= 4);

    const scoredDocs = [];
    for (const file of files) {
      const content = fs.readFileSync(file, "utf8");
      const normContent = norm(content);
      const relative = path.relative(path.join(__dirname, ".."), file).replace(/\\/g, "/");

      let score = 0;
      for (const term of terms) {
        const count = normContent.split(term).length - 1;
        if (count > 0) score += Math.min(count, 8) * 5;
      }

      if (relative.includes("documents/legislacao")) score += 20;
      if (relative.includes("edital-retificacao")) score += 15;
      if (relative.includes("edital-oficial")) score += 10;

      if (score > 0) scoredDocs.push({ file, relative, content, score });
    }

    scoredDocs.sort((a, b) => b.score - a.score);
    const topDocs = scoredDocs.slice(0, 4);
    if (topDocs.length === 0) return "";

    let context = "";
    for (const doc of topDocs) {
      const excerpt = doc.content.length > 1500 ? doc.content.slice(0, 1500) + "\n[...trecho focado...]" : doc.content;
      const block = `### FONTE LOCAL: ${doc.relative}\n### RELEVÂNCIA RAG: ${doc.score} pts\n${excerpt}\n\n---\n\n`;
      if (context.length + block.length > 6000) break;
      context += block;
    }
    return context;
  } catch {
    return "";
  }
}

const SYSTEM_PROMPT = `Você é o Elaborador Sênior e Especialista Pedagógico da banca Cesgranrio para o concurso da TRANSPETRO 2026.3, Ênfase 18: Suprimento de Bens e Serviços.
Sua missão é gerar questões inéditas de nível médio técnico, no estilo Cesgranrio, com alta precisão técnica e pedagógica.

DIRETRIZES DE QUALIDADE PEDAGÓGICA:
1. Formato estrito: exatamente 5 alternativas (A, B, C, D, E) com apenas UMA alternativa correta.
2. GABARITO DIVERSIFICADO: Alterne a posição da resposta correta entre A, B, C, D e E de forma equilibrada no lote. NÃO concentre respostas na mesma letra.
3. EQUILÍBRIO DE EXTENSÃO: Todas as 5 opções devem ter comprimento visual similar. JAMAIS faça a resposta correta visivelmente mais longa ou detalhada que os distratores.
4. DISTRATORES PLAUSÍVEIS: Crie distratores inteligentes baseados em pegadinhas conceituais típicas da Cesgranrio (troca de termos técnicos, generalizações falsas como 'sempre/nunca', inversão de causa/efeito).
5. RIGOR NORMATIVO: Em legislação e normas (Lei 13.303, Lei 14.133, Decreto 2.745, RLCT, LGPD, LC 123), cite artigos e incisos reais na justificativa. NUNCA invente leis ou artigos inexistentes.
6. EM INFORMÁTICA (Office 365, Excel, Word, PowerPoint): Use comandos, atalhos, fórmulas e funções reais em português (ex: PROCV, SOMA, SE, CONT.SE, guia Inserir, Layout). NUNCA invente funções.
7. EM LOGÍSTICA: Explore situações operacionais reais (gestão de almoxarifados, curva ABC, ponto de pedido, lote econômico de compra, modais rodoviário/dutoviário/marítimo, conferência de carga, fiscalização de contratos, acordos de nível de serviço).
8. EM MATEMÁTICA: O cálculo deve ser deterministicamente verificável com números redondos e somente uma alternativa correta. Diversifique os contextos práticos.
9. INÉDITISMO ABSOLUTO (ANTI-RECITATION): Crie situações e cenários 100% originais com nomes fictícios de empresas e terminais (ex: Terminal Portuário Atlântico Sul, AlfaLog Transportes, Cargas Marítimas Delta). NUNCA copie literalmente enunciados ou textos de fontes externas.
10. PROVENIÊNCIA: As questões são estritamente INÉDITAS (origin: "INEDITA_IA", banca: "IA (perfil Cesgranrio)"). NUNCA afirme que a questão foi aplicada em prova oficial real.
11. EXPLICAÇÃO COMPLETA: A explicação deve justificar por que o gabarito está certo E indicar por que as outras opções estão incorretas.

Retorne EXCLUSIVAMENTE um array de questões no formato JSON:
{
  "questions": [
    {
      "statement": "Enunciado detalhado e contextualizado...",
      "optionA": "Texto da alternativa A...",
      "optionB": "Texto da alternativa B...",
      "optionC": "Texto da alternativa C...",
      "optionD": "Texto da alternativa D...",
      "optionE": "Texto da alternativa E...",
      "correctOption": "A",
      "explanation": "Justificativa pedagógica minuciosa...",
      "difficulty": "FACIL|MEDIA|DIFICIL",
      "questionType": "CONCEITO|APLICACAO|CALCULO|INTERPRETACAO|CASO_PRATICO|COMPARACAO|EXCECAO|PROCEDIMENTO",
      "cognitiveLevel": "CONHECER|COMPREENDER|APLICAR|ANALISAR|AVALIAR",
      "subtopic": "Subtópico específico trabalhado na questão",
      "sourceRef": "Questão inédita em estilo compatível com o perfil da banca. Baseada no edital e nas normas oficiais do programa."
    }
  ]
}`;

function cleanJsonResponse(rawText) {
  let clean = rawText
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  const firstBrace = clean.indexOf("{");
  const firstBracket = clean.indexOf("[");
  let startIdx = 0;
  let endIdx = clean.length;

  if (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
    startIdx = firstBracket;
    endIdx = clean.lastIndexOf("]") + 1;
  } else if (firstBrace !== -1) {
    startIdx = firstBrace;
    endIdx = clean.lastIndexOf("}") + 1;
  }

  if (startIdx !== -1 && endIdx > startIdx) {
    clean = clean.slice(startIdx, endIdx);
  }
  return JSON.parse(clean);
}

function extractQuestionsArray(parsed) {
  if (Array.isArray(parsed)) return parsed;
  if (Array.isArray(parsed?.questions)) return parsed.questions;
  if (Array.isArray(parsed?.questoes)) return parsed.questoes;
  if (Array.isArray(parsed?.itens)) return parsed.itens;
  return [];
}

const VALID_LETTERS = new Set(["A", "B", "C", "D", "E"]);
const VALID_DIFFS = new Set(["FACIL", "MEDIA", "DIFICIL"]);
const VALID_TYPES = new Set(["CONCEITO", "APLICACAO", "CALCULO", "INTERPRETACAO", "CASO_PRATICO", "COMPARACAO", "EXCECAO", "PROCEDIMENTO"]);
const VALID_COGNITIVES = new Set(["CONHECER", "COMPREENDER", "APLICAR", "ANALISAR", "AVALIAR"]);

function findCorrectLetter(raw) {
  const direct = String(
    raw.correctOption ||
    raw.correct_option ||
    raw.correctAnswer ||
    raw.correct_answer ||
    raw.answer ||
    raw.gabarito ||
    raw.resposta ||
    raw.resposta_correta ||
    raw.correta ||
    ""
  ).trim().toUpperCase();

  if (VALID_LETTERS.has(direct)) return direct;

  const letterMatch = direct.match(/\b([A-E])\b/);
  if (letterMatch && VALID_LETTERS.has(letterMatch[1])) return letterMatch[1];

  if (direct.length >= 3) {
    const opts = [raw.optionA, raw.optionB, raw.optionC, raw.optionD, raw.optionE];
    for (let i = 0; i < 5; i++) {
      if (opts[i] && (opts[i].includes(direct) || direct.includes(opts[i]))) {
        return String.fromCharCode(65 + i);
      }
    }
  }
  return "";
}

function normalizeRawQuestion(raw) {
  if (!raw || typeof raw !== "object") return {};
  const opts = raw.options && Array.isArray(raw.options) ? raw.options : null;
  const optA = String(raw.optionA || raw.opcaoA || raw.a || (opts && opts[0]) || "").trim();
  const optB = String(raw.optionB || raw.opcaoB || raw.b || (opts && opts[1]) || "").trim();
  const optC = String(raw.optionC || raw.opcaoC || raw.c || (opts && opts[2]) || "").trim();
  const optD = String(raw.optionD || raw.opcaoD || raw.d || (opts && opts[3]) || "").trim();
  const optE = String(raw.optionE || raw.opcaoE || raw.e || (opts && opts[4]) || "").trim();

  const correctLetter = findCorrectLetter({
    ...raw,
    optionA: optA,
    optionB: optB,
    optionC: optC,
    optionD: optD,
    optionE: optE,
  });

  return {
    statement: String(raw.statement || raw.enunciado || raw.texto || "").trim(),
    optionA: optA,
    optionB: optB,
    optionC: optC,
    optionD: optD,
    optionE: optE,
    correctOption: correctLetter,
    explanation: String(raw.explanation || raw.justificativa || raw.comentario || "").trim(),
    difficulty: raw.difficulty || raw.dificuldade || "MEDIA",
    questionType: raw.questionType || raw.tipo || "APLICACAO",
    cognitiveLevel: raw.cognitiveLevel || raw.nivelCognitivo || "APLICAR",
    subtopic: raw.subtopic || raw.subtopico || null,
    sourceRef: raw.sourceRef || "Questão inédita em estilo compatível com o perfil da banca. Baseada no edital."
  };
}

function validateGeneratedQuestion(q, subjectName) {
  if (!q.statement || typeof q.statement !== "string" || q.statement.trim().length < 35) {
    return { valid: false, reason: "Enunciado ausente ou muito curto (<35 chars)" };
  }
  const options = [q.optionA, q.optionB, q.optionC, q.optionD, q.optionE];
  for (let i = 0; i < 5; i++) {
    const opt = options[i];
    if (!opt || typeof opt !== "string" || opt.trim().length < 2) {
      return { valid: false, reason: `Opção ${String.fromCharCode(65 + i)} inválida ou vazia` };
    }
  }

  const optSet = new Set(options.map((o) => normalizeText(o)));
  if (optSet.size !== 5) {
    return { valid: false, reason: "Opções idênticas detectadas" };
  }

  if (!VALID_LETTERS.has(q.correctOption)) {
    return { valid: false, reason: `Gabarito inválido: ${q.correctOption}` };
  }

  if (!q.explanation || typeof q.explanation !== "string" || q.explanation.trim().length < 40) {
    return { valid: false, reason: "Explicação ausente ou muito curta (<40 chars)" };
  }

  const lengths = options.map((o) => o.trim().length);
  const correctIdx = q.correctOption.charCodeAt(0) - 65;
  const correctLen = lengths[correctIdx];
  const distractorLens = lengths.filter((_, idx) => idx !== correctIdx);
  const avgDistractor = distractorLens.reduce((a, b) => a + b, 0) / distractorLens.length;
  const maxDistractor = Math.max(...distractorLens);

  if ((correctLen >= 2.8 * avgDistractor || correctLen >= 2.8 * maxDistractor) && correctLen - maxDistractor >= 40) {
    return { valid: false, reason: "Alternativa correta com disparidade métrica extrema (outlier de tamanho)" };
  }

  if (subjectName && subjectName.toLowerCase().includes("legislação")) {
    const fullText = `${q.statement} ${q.explanation} ${options.join(" ")}`;
    const legCheck = validateLegislationCitations(fullText);
    if (legCheck && legCheck.hasInvalidArticles) {
      const invalidList = legCheck.citedArticles
        .filter((a) => !a.isValid)
        .map((a) => `${a.law} Art. ${a.article}`)
        .join(", ");
      return { valid: false, reason: `Citação jurídica inconsistente com artigo fora do limite oficial: ${invalidList}` };
    }
  }

  if (subjectName && (subjectName.toLowerCase().includes("informática") || subjectName.toLowerCase().includes("contabilidade"))) {
    const fullText = `${q.statement} ${q.explanation} ${options.join(" ")}`;
    const itCheck = validateExcelFunctions(fullText);
    if (itCheck && itCheck.hasInvalidFunctions) {
      return { valid: false, reason: `Uso de função do Excel inexistente ou inventada: ${itCheck.invalidFunctions.join(", ")}` };
    }
  }

  return { valid: true };
}

async function generateBatchFromGemini(topic, subject, count, difficultyHint, existingStatements, neededLetters) {
  const model = genAI.getGenerativeModel({
    model: "gemini-3.8-flash",
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      temperature: 0.35,
      responseMimeType: "application/json",
    },
  });

  const rag = getRagContext(`${subject.name} ${topic.title} ${topic.officialSource || ""}`);

  const existingExcerpts = existingStatements
    .slice(-15)
    .map((s, idx) => `  ${idx + 1}) "${s.slice(0, 110)}..."`)
    .join("\n");

  const letterInstruction = neededLetters && neededLetters.length > 0
    ? `DIVERSIFICAÇÃO OBRIGATÓRIA DE GABARITO: Priorize as seguintes letras como correctOption nas ${count} questões: [${neededLetters.join(", ")}].`
    : `DIVERSIFICAÇÃO OBRIGATÓRIA DE GABARITO: Distribua as respostas corretas entre A, B, C, D e E sem repetir a mesma letra consecutivamente.`;

  const prompt = `Gere exatamente ${count} questões inéditas para o concurso Transpetro 2026.3 (Ênfase 18).
Disciplina: "${subject.name}"
Tópico Oficial: [${topic.code || ""}] "${topic.title}"
${topic.officialSource ? `Referência do Edital: "${topic.officialSource}"` : ""}
${rag ? `\nContexto normativo/estudo recuperado:\n${rag}` : ""}

Orientações para este lote:
- Dificuldade sugerida: mescle ${difficultyHint || "FACIL, MEDIA e DIFICIL"}.
- Tipos de questão sugeridos: varie entre CASO_PRATICO, APLICACAO, CONCEITO, PROCEDIMENTO, COMPARACAO, EXCECAO, CALCULO.
- Níveis cognitivos: varie entre COMPREENDER, APLICAR, ANALISAR e AVALIAR.
- ${letterInstruction}

${existingExcerpts ? `ATENÇÃO MÁXIMA - NÃO REPETIR AS QUESTÕES JÁ EXISTENTES:
O banco já possui as seguintes questões cadastradas para este tópico:
${existingExcerpts}
GERE QUESTÕES COM ABORDAGENS, SITUAÇÕES PRÁTICAS, ARTIGOS, REGRAS OU CONCEITOS TOTALMENTE NOVOS E DIFERENTES DOS ACIMA.` : ""}`;

  let attempts = 0;
  while (attempts < 3) {
    try {
      attempts++;
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const parsed = cleanJsonResponse(text);
      const rawArray = extractQuestionsArray(parsed);
      return rawArray.map(normalizeRawQuestion);
    } catch (err) {
      if (attempts >= 3) throw err;
      const isRateLimit = String(err.message).includes("429") || String(err.message).includes("ResourceExhausted");
      const waitTime = isRateLimit ? 10000 * attempts : 3000 * attempts;
      console.log(`\n      ⏳ Rate limit ou lentidão na API (${err.message}). Aguardando ${waitTime / 1000}s...`);
      await new Promise((r) => setTimeout(r, waitTime));
    }
  }
  return [];
}

async function expandSubject(subjectFilter, targetPerTopic = 40, batchSize = 5) {
  const topics = await prisma.topic.findMany({
    where: {
      subject: {
        OR: [
          { name: { contains: subjectFilter, mode: "insensitive" } },
          { category: { contains: subjectFilter, mode: "insensitive" } },
        ],
      },
    },
    include: {
      subject: true,
      questions: {
        select: { id: true, statement: true, statementHash: true, correctOption: true },
      },
    },
    orderBy: [{ subject: { order: "asc" } }, { order: "asc" }],
  });

  console.log(`\n================================================================================`);
  console.log(`🚀 EXPANSÃO: "${subjectFilter}" (${topics.length} tópicos encontrados)`);
  console.log(`🎯 Meta: ${targetPerTopic} questões por tópico`);
  console.log(`================================================================================\n`);

  let addedInSubject = 0;
  let rejectedInSubject = 0;
  let duplicatesInSubject = 0;

  for (let idx = 0; idx < topics.length; idx++) {
    const topic = topics[idx];
    const currentCount = topic.questions.length;
    let deficit = targetPerTopic - currentCount;

    console.log(`[${idx + 1}/${topics.length}] (${topic.code}) ${topic.title.slice(0, 50)}...`);
    console.log(`   Atual: ${currentCount} | Meta: ${targetPerTopic} | A gerar: ${Math.max(0, deficit)}`);

    if (deficit <= 0) {
      console.log(`   ⏭️  Tópico já com meta atingida.\n`);
      continue;
    }

    const existingHashes = new Set(topic.questions.map((q) => q.statementHash));
    const existingStatements = topic.questions.map((q) => q.statement);
    const letterCounts = { A: 0, B: 0, C: 0, D: 0, E: 0 };
    for (const q of topic.questions) {
      if (letterCounts[q.correctOption] !== undefined) letterCounts[q.correctOption]++;
    }

    let attempts = 0;
    while (deficit > 0 && attempts < 8) {
      attempts++;
      const requestCount = Math.min(deficit, batchSize);
      const diffHint = deficit > 10 ? "FACIL, MEDIA e DIFICIL" : deficit <= 5 ? "MEDIA e DIFICIL" : "FACIL e MEDIA";

      const neededLetters = Object.entries(letterCounts)
        .sort((a, b) => a[1] - b[1])
        .slice(0, Math.min(requestCount + 1, 5))
        .map(([l]) => l);

      try {
        process.stdout.write(`   ⏳ Gerando lote com ${requestCount} itens (tentativa ${attempts})... `);
        const rawBatch = await generateBatchFromGemini(
          topic,
          topic.subject,
          requestCount,
          diffHint,
          existingStatements,
          neededLetters
        );
        console.log(`Recebidas: ${rawBatch.length}`);

        for (const raw of rawBatch) {
          const val = validateGeneratedQuestion(raw, topic.subject.name);
          if (!val.valid) {
            rejectedInSubject++;
            console.log(`      ⚠️ Rejeitada: ${val.reason}`);
            continue;
          }

          const hash = computeStatementHash(raw.statement);
          if (existingHashes.has(hash)) {
            duplicatesInSubject++;
            console.log(`      🔁 Duplicidade por statementHash evitada.`);
            continue;
          }

          let isSemanticDuplicate = false;
          let maxSim = 0;
          for (const existingStmt of existingStatements) {
            const sim = evaluateSemanticSimilarity(raw.statement, existingStmt);
            if (sim.combinedScore > maxSim) maxSim = sim.combinedScore;
            if (sim.isSuspectDuplicate || sim.combinedScore >= 0.52) {
              isSemanticDuplicate = true;
              break;
            }
          }

          if (isSemanticDuplicate) {
            duplicatesInSubject++;
            console.log(`      🔁 Rejeitada por similaridade semântica (${maxSim.toFixed(3)}).`);
            continue;
          }

          try {
            await prisma.question.create({
              data: {
                topicId: topic.id,
                statement: raw.statement.trim(),
                statementHash: hash,
                optionA: raw.optionA.trim(),
                optionB: raw.optionB.trim(),
                optionC: raw.optionC.trim(),
                optionD: raw.optionD.trim(),
                optionE: raw.optionE.trim(),
                correctOption: raw.correctOption,
                explanation: raw.explanation.trim(),
                difficulty: VALID_DIFFS.has(raw.difficulty) ? raw.difficulty : "MEDIA",
                origin: "INEDITA_IA",
                banca: "IA (perfil Cesgranrio)",
                sourceRef: raw.sourceRef || "Questão inédita em estilo compatível com o perfil da banca. Baseada no edital.",
                questionType: VALID_TYPES.has(raw.questionType) ? raw.questionType : "APLICACAO",
                cognitiveLevel: VALID_COGNITIVES.has(raw.cognitiveLevel) ? raw.cognitiveLevel : "APLICAR",
                subtopic: raw.subtopic ? String(raw.subtopic).slice(0, 100) : null,
                verificationStatus: "APROVADA",
              },
            });

            existingHashes.add(hash);
            existingStatements.push(raw.statement.trim());
            letterCounts[raw.correctOption] = (letterCounts[raw.correctOption] || 0) + 1;
            addedInSubject++;
            deficit--;
            console.log(`      ✅ Salva [${raw.correctOption}] (${raw.difficulty} / ${raw.questionType || "APL"} / ${raw.cognitiveLevel || "APL"})`);
            if (deficit <= 0) break;
          } catch (dbErr) {
            if (dbErr.code === "P2002") {
              duplicatesInSubject++;
              console.log(`      🔁 Colisão P2002 no banco.`);
            } else {
              console.error(`      ❌ Erro no DB:`, dbErr.message);
            }
          }
        }
      } catch (genErr) {
        console.error(`\n   ❌ Erro na chamada IA:`, genErr.message);
        await new Promise((r) => setTimeout(r, 4000));
      }
      // Pequeno intervalo entre lotes para respeitar a cota da API
      await new Promise((r) => setTimeout(r, 1200));
    }
    console.log(`   ✨ Tópico concluído! Atual: ${existingStatements.length} questões.\n`);
  }

  return { addedInSubject, rejectedInSubject, duplicatesInSubject };
}

async function main() {
  const args = process.argv.slice(2);
  let targetPerTopic = 40;
  let batchSize = 5;
  let singleSubject = null;

  for (const arg of args) {
    if (arg.startsWith("--target=")) targetPerTopic = parseInt(arg.split("=")[1], 10) || 40;
    if (arg.startsWith("--batch=")) batchSize = parseInt(arg.split("=")[1], 10) || 5;
    if (arg.startsWith("--subject=")) singleSubject = arg.split("=")[1];
  }

  console.log("================================================================================");
  console.log(`🌟 EXPANSÃO DO ACERVO DE QUESTÕES ➔ META: ${targetPerTopic} POR TÓPICO`);
  console.log("TRANSPETRO 2026.3 • ÊNFASE 18: SUPRIMENTO DE BENS E SERVIÇOS");
  console.log("================================================================================\n");

  const initialCount = await prisma.question.count();
  console.log(`📊 Total de Questões Inicial no Banco: ${initialCount}`);

  const subjectsToRun = singleSubject
    ? [singleSubject]
    : [
        "2. Logística e Cadeia de Suprimentos",
        "1. Noções de Administração e Logística",
        "3. Legislação",
        "4. Noções de Contabilidade e Informática",
        "Língua Portuguesa",
        "Matemática",
      ];

  let totalAdded = 0;
  let totalRejected = 0;
  let totalDuplicates = 0;

  for (const subj of subjectsToRun) {
    const res = await expandSubject(subj, targetPerTopic, batchSize);
    totalAdded += res.addedInSubject;
    totalRejected += res.rejectedInSubject;
    totalDuplicates += res.duplicatesInSubject;
  }

  const finalCount = await prisma.question.count();
  console.log("\n================================================================================");
  console.log("🏁 EXPANSÃO CONCLUÍDA");
  console.log("================================================================================");
  console.log(`Questões Iniciais: ${initialCount}`);
  console.log(`Novas Questões Adicionadas: ${totalAdded}`);
  console.log(`Total Final no Banco: ${finalCount}`);
  console.log(`Questões Rejeitadas na Validação: ${totalRejected}`);
  console.log(`Duplicações Semânticas/Hash Evitadas: ${totalDuplicates}`);
  console.log("================================================================================\n");
}

if (require.main === module) {
  main()
    .catch((e) => {
      console.error("❌ Erro fatal:", e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = { expandSubject };
