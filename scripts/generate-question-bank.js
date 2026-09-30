/**
 * Script de Geração e Abastecimento do Banco Pedagógico
 * TRANSPETRO STUDY 2026.3 • Ênfase 18: Suprimento de Bens e Serviços
 *
 * Uso:
 *   node -r dotenv/config scripts/generate-question-bank.js [opções]
 *
 * Opções:
 *   --all                 Abastece todos os 47 tópicos oficiais
 *   --subject=<nome/idx>  Filtra por disciplina (ex: "Logística", "Legislação", "Contabilidade", "Portuguesa", "Matemática")
 *   --topic=<codigo>      Filtra por código de tópico (ex: "2.1", "3.2", "1")
 *   --target=<numero>     Meta de questões por tópico (padrão: 10)
 *   --batch=<numero>      Tamanho do lote por chamada à IA (padrão: 5, máx: 10)
 *   --force               Gera mesmo se já atingiu o target
 */

const { PrismaClient } = require("@prisma/client");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { createHash } = require("crypto");
const fs = require("fs");
const path = require("path");

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

// Carregamento de contexto local (RAG)
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
      // Term matches
      for (const term of terms) {
        const count = normContent.split(term).length - 1;
        if (count > 0) {
          score += Math.min(count, 8) * 5;
        }
      }

      // Prioridade para documentos oficiais do edital e legislação
      if (relative.includes("documents/legislacao")) score += 20;
      if (relative.includes("edital-retificacao")) score += 15;
      if (relative.includes("edital-oficial")) score += 10;

      if (score > 0) {
        scoredDocs.push({ file, relative, content, score });
      }
    }

    scoredDocs.sort((a, b) => b.score - a.score);
    const topDocs = scoredDocs.slice(0, 4);

    if (topDocs.length === 0) return "";

    let context = "";
    for (const doc of topDocs) {
      const excerpt = doc.content.length > 3500 ? doc.content.slice(0, 3500) + "\n[...trecho focado...]" : doc.content;
      const block = `### FONTE LOCAL: ${doc.relative}\n### RELEVÂNCIA RAG: ${doc.score} pts\n${excerpt}\n\n---\n\n`;
      if (context.length + block.length > 12000) break;
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
8. PROVENIÊNCIA: As questões são estritamente INÉDITAS (origin: "INEDITA_IA", banca: "IA (perfil Cesgranrio)"). NUNCA afirme que a questão foi aplicada em prova oficial real.
9. EXPLICAÇÃO COMPLETA: A explicação deve justificar por que o gabarito está certo E indicar por que as outras opções estão incorretas.

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
  const lastBrace = clean.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    clean = clean.slice(firstBrace, lastBrace + 1);
  }
  return JSON.parse(clean);
}

const VALID_LETTERS = new Set(["A", "B", "C", "D", "E"]);
const VALID_DIFFS = new Set(["FACIL", "MEDIA", "DIFICIL"]);
const VALID_TYPES = new Set(["CONCEITO", "APLICACAO", "CALCULO", "INTERPRETACAO", "CASO_PRATICO", "COMPARACAO", "EXCECAO", "PROCEDIMENTO"]);
const VALID_COGNITIVES = new Set(["CONHECER", "COMPREENDER", "APLICAR", "ANALISAR", "AVALIAR"]);

function validateGeneratedQuestion(q) {
  if (!q.statement || typeof q.statement !== "string" || q.statement.trim().length < 25) {
    return { valid: false, reason: "Enunciado ausente ou muito curto" };
  }
  const options = [q.optionA, q.optionB, q.optionC, q.optionD, q.optionE];
  for (let i = 0; i < 5; i++) {
    const opt = options[i];
    if (!opt || typeof opt !== "string" || opt.trim().length < 2) {
      return { valid: false, reason: `Opção ${String.fromCharCode(65 + i)} inválida ou vazia` };
    }
  }

  // Verificar se há opções duplicadas
  const optSet = new Set(options.map((o) => normalizeText(o)));
  if (optSet.size !== 5) {
    return { valid: false, reason: "Opções idênticas detectadas" };
  }

  if (!VALID_LETTERS.has(q.correctOption)) {
    return { valid: false, reason: `Gabarito inválido: ${q.correctOption}` };
  }

  if (!q.explanation || typeof q.explanation !== "string" || q.explanation.trim().length < 30) {
    return { valid: false, reason: "Explicação ausente ou muito curta" };
  }

  // Verificar outlier de tamanho
  const lengths = options.map((o) => o.trim().length);
  const correctIdx = q.correctOption.charCodeAt(0) - 65;
  const correctLen = lengths[correctIdx];
  const distractorLens = lengths.filter((_, idx) => idx !== correctIdx);
  const avgDistractor = distractorLens.reduce((a, b) => a + b, 0) / distractorLens.length;
  const maxDistractor = Math.max(...distractorLens);

  if ((correctLen >= 3 * avgDistractor || correctLen >= 3 * maxDistractor) && correctLen - maxDistractor >= 35) {
    return { valid: false, reason: "Alternativa correta com disparidade métrica extrema (outlier)" };
  }

  return { valid: true };
}

async function generateBatchFromGemini(topic, subject, count, difficultyHint) {
  const model = genAI.getGenerativeModel({
    model: "gemini-3.8-flash",
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      temperature: 0.35,
      responseMimeType: "application/json",
    },
  });

  const rag = getRagContext(`${subject.name} ${topic.title} ${topic.officialSource || ""}`);

  const prompt = `Gere exatamente ${count} questões inéditas para o concurso Transpetro 2026.3 (Ênfase 18).
Disciplina: "${subject.name}"
Tópico Oficial: [${topic.code || ""}] "${topic.title}"
${topic.officialSource ? `Referência do Edital: "${topic.officialSource}"` : ""}
${rag ? `\nContexto normativo/estudo recuperado:\n${rag}` : ""}

Orientações para este lote:
- Dificuldade sugerida: mescle ${difficultyHint || "FACIL, MEDIA e DIFICIL"}.
- Tipos de questão sugeridos: varie entre CASO_PRATICO, APLICACAO, CONCEITO, PROCEDIMENTO.
- DISTRIBUA O GABARITO (varie as letras corretas entre A, B, C, D e E nas ${count} questões).`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const parsed = cleanJsonResponse(text);
  return Array.isArray(parsed?.questions) ? parsed.questions : [];
}

async function main() {
  const args = process.argv.slice(2);
  const allFlag = args.includes("--all");
  const forceFlag = args.includes("--force");
  
  let targetQuestions = 10;
  let batchSize = 5;
  let subjectFilter = null;
  let topicFilter = null;

  for (const arg of args) {
    if (arg.startsWith("--target=")) targetQuestions = parseInt(arg.split("=")[1], 10) || 10;
    if (arg.startsWith("--batch=")) batchSize = parseInt(arg.split("=")[1], 10) || 5;
    if (arg.startsWith("--subject=")) subjectFilter = arg.split("=")[1].toLowerCase();
    if (arg.startsWith("--topic=")) topicFilter = arg.split("=")[1];
  }

  console.log("================================================================================");
  console.log("🚀 ABASTECEDOR PEDAGÓGICO DE QUESTÕES - TRANSPETRO 2026.3 (ÊNFASE 18)");
  console.log("================================================================================");
  console.log(`🎯 Meta por tópico: ${targetQuestions} questões`);
  console.log(`📦 Tamanho do lote: ${batchSize} por chamada`);
  if (subjectFilter) console.log(`🔍 Filtro de Disciplina: "${subjectFilter}"`);
  if (topicFilter) console.log(`🔍 Filtro de Tópico: "${topicFilter}"`);
  console.log("--------------------------------------------------------------------------------\n");

  const topics = await prisma.topic.findMany({
    include: {
      subject: true,
      questions: {
        select: { id: true, statementHash: true },
      },
    },
    orderBy: [{ subject: { order: "asc" } }, { order: "asc" }],
  });

  // Filtragem
  let selectedTopics = topics;
  if (topicFilter) {
    selectedTopics = selectedTopics.filter((t) => t.code === topicFilter || t.id === topicFilter);
  }
  if (subjectFilter) {
    selectedTopics = selectedTopics.filter(
      (t) => t.subject.name.toLowerCase().includes(subjectFilter) || t.subject.category.toLowerCase().includes(subjectFilter)
    );
  }

  console.log(`📚 Tópicos selecionados para processamento: ${selectedTopics.length}\n`);

  let totalGenerated = 0;
  let totalSaved = 0;
  let totalRejected = 0;
  let totalDuplicates = 0;

  for (let idx = 0; idx < selectedTopics.length; idx++) {
    const topic = selectedTopics[idx];
    const currentCount = topic.questions.length;
    const deficit = targetQuestions - currentCount;

    console.log(
      `[${idx + 1}/${selectedTopics.length}] [${topic.subject.name}] (${topic.code}) ${topic.title.slice(0, 45)}...`
    );
    console.log(`   Atual: ${currentCount} questões | Meta: ${targetQuestions} | Déficit: ${Math.max(0, deficit)}`);

    if (deficit <= 0 && !forceFlag) {
      console.log(`   ⏭️  Meta já atingida. Pulando tópico.\n`);
      continue;
    }

    let needed = forceFlag ? batchSize : deficit;
    let topicSaved = 0;
    let attempts = 0;
    const existingHashes = new Set(topic.questions.map((q) => q.statementHash));

    while (needed > 0 && attempts < 4) {
      attempts++;
      const requestCount = Math.min(needed, batchSize);
      const diffHint = needed > 5 ? "FACIL, MEDIA e DIFICIL" : needed <= 2 ? "MEDIA e DIFICIL" : "FACIL e MEDIA";

      try {
        process.stdout.write(`   ⏳ Chamando IA para gerar ${requestCount} questões (tentativa ${attempts})... `);
        const rawBatch = await generateBatchFromGemini(topic, topic.subject, requestCount, diffHint);
        console.log(`Recebidas: ${rawBatch.length}`);

        for (const raw of rawBatch) {
          totalGenerated++;
          const val = validateGeneratedQuestion(raw);
          if (!val.valid) {
            totalRejected++;
            console.log(`      ⚠️ Questão rejeitada: ${val.reason}`);
            continue;
          }

          const hash = computeStatementHash(raw.statement);
          if (existingHashes.has(hash)) {
            totalDuplicates++;
            console.log(`      🔁 Duplicidade detectada por statementHash.`);
            continue;
          }

          // Inserção no banco
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
                verificationStatus: "PENDENTE",
              },
            });

            existingHashes.add(hash);
            topicSaved++;
            totalSaved++;
            needed--;
            console.log(`      ✅ Salva [${raw.correctOption}] (${raw.difficulty} / ${raw.questionType || "APL"})`);
            if (needed <= 0) break;
          } catch (dbErr) {
            if (dbErr.code === "P2002") {
              totalDuplicates++;
              console.log(`      🔁 Colisão P2002 no banco para este hash.`);
            } else {
              console.error(`      ❌ Erro ao salvar no banco:`, dbErr.message);
            }
          }
        }
      } catch (genErr) {
        console.error(`\n   ❌ Falha na geração com IA:`, genErr.message);
        // Aguarda 2 segundos antes de tentar novamente para evitar rate limit
        await new Promise((res) => setTimeout(res, 2000));
      }
    }

    console.log(`   ✨ Concluído no tópico: +${topicSaved} adicionadas (Total agora: ${currentCount + topicSaved})\n`);
  }

  console.log("================================================================================");
  console.log("🎉 ABASTECIMENTO FINALIZADO");
  console.log("================================================================================");
  console.log(`Total gerado pela IA: ${totalGenerated}`);
  console.log(`Total salvo com sucesso: ${totalSaved}`);
  console.log(`Total rejeitado pelo validador: ${totalRejected}`);
  console.log(`Total de duplicatas evitadas: ${totalDuplicates}`);
  console.log("================================================================================\n");
}

main()
  .catch((e) => {
    console.error("❌ Erro fatal:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
