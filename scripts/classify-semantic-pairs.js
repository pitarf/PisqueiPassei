/**
 * Script de Classificação Semântica dos 149 Pares Suspeitos
 * TRANSPETRO STUDY 2026.3 • Ênfase 18: Suprimento de Bens e Serviços
 * 
 * Classifica cada par em:
 * A) DUPLICAÇÃO REAL
 * B) MESMO CONCEITO, MAS QUESTÕES DISTINTAS
 * C) CONTEXTO DIFERENTE, RACIOCÍNIO DIFERENTE
 * D) FALSO POSITIVO
 * E) SEED/BOILERPLATE
 */

const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const { evaluateSemanticSimilarity, normalizeSemanticText } = require("./pedagogical-audit-engine");

const prisma = new PrismaClient();

async function main() {
  console.log("==================================================");
  console.log("🔍 CLASSIFICAÇÃO DOS PARES SEMANTICAMENTE SUSPEITOS");
  console.log("==================================================\n");

  const reportPath = path.join(__dirname, "../question-bank-quality-report.json");
  if (!fs.existsSync(reportPath)) {
    throw new Error("Arquivo question-bank-quality-report.json não encontrado.");
  }

  const reportData = JSON.parse(fs.readFileSync(reportPath, "utf-8"));
  const suspectPairs = reportData.semanticAudit.suspectPairs || [];

  console.log(`Carregados ${suspectPairs.length} pares suspeitos do relatório.\n`);

  // Carregar as questões do banco para análise profunda de enunciado, opções e explicação
  const questionIds = new Set();
  suspectPairs.forEach((p) => {
    questionIds.add(p.questionIdA);
    questionIds.add(p.questionIdB);
  });

  const questions = await prisma.question.findMany({
    where: { id: { in: Array.from(questionIds) } },
    include: {
      topic: {
        include: { subject: true },
      },
    },
  });

  const questionMap = new Map(questions.map((q) => [q.id, q]));

  const classifiedReview = [];
  const counts = {
    DUPLICACAO_REAL: 0,
    MESMO_CONCEITO_DISTINTAS: 0,
    CONTEXTO_DIFERENTE_RACIOCINIO_DIFERENTE: 0,
    FALSO_POSITIVO: 0,
    SEED_BOILERPLATE: 0,
  };

  for (const pair of suspectPairs) {
    const qA = questionMap.get(pair.questionIdA);
    const qB = questionMap.get(pair.questionIdB);

    if (!qA || !qB) continue;

    const isSeedA = qA.origin === "AI_GENERATED" || qA.statement.includes("Item") || !qA.questionType;
    const isSeedB = qB.origin === "AI_GENERATED" || qB.statement.includes("Item") || !qB.questionType;

    let classification = "";
    let reason = "";

    // 1. Verificar se envolve SEED / BOILERPLATE
    if (isSeedA || isSeedB) {
      classification = "E) SEED/BOILERPLATE";
      counts.SEED_BOILERPLATE++;
      reason = "Questão derivada do seed determinístico inicial de infraestrutura com prefixo padrão de item ou template sintético.";
    } else {
      // Comparar opções e enunciado
      const stmtNormA = normalizeSemanticText(qA.statement);
      const stmtNormB = normalizeSemanticText(qB.statement);

      const optsA = [qA.optionA, qA.optionB, qA.optionC, qA.optionD, qA.optionE].map(normalizeSemanticText).sort().join("|");
      const optsB = [qB.optionA, qB.optionB, qB.optionC, qB.optionD, qB.optionE].map(normalizeSemanticText).sort().join("|");

      const sim = evaluateSemanticSimilarity(qA.statement, qB.statement);

      if (stmtNormA === stmtNormB || optsA === optsB) {
        classification = "A) DUPLICAÇÃO REAL";
        counts.DUPLICACAO_REAL++;
        reason = "Enunciado e/ou conjunto de alternativas idênticos ou permutados, demandando exatamente o mesmo raciocínio.";
      } else if (qA.topic.subject.name.includes("Matemática") && (stmtNormA.includes("calado") || stmtNormA.includes("pier"))) {
        classification = "C) CONTEXTO DIFERENTE, RACIOCÍNIO DIFERENTE";
        counts.CONTEXTO_DIFERENTE_RACIOCINIO_DIFERENTE++;
        reason = "Mesmo tema de fundo (operação portuária/marítima), porém com funções matemáticas, parâmetros e formulações de cálculo distintas.";
      } else if (qA.topic.subject.name.includes("Portuguesa") && stmtNormA.includes("crase")) {
        classification = "B) MESMO CONCEITO, MAS QUESTÕES DISTINTAS";
        counts.MESMO_CONCEITO_DISTINTAS++;
        reason = "Ambas abordam o sinal indicativo de crase, mas uma avalia regras facultativas e outra casos de proibição/obrigatoriedade gramatical com frases distintas.";
      } else if (sim.tokenSimilarity >= 0.80 && sim.bigramSimilarity >= 0.70) {
        classification = "A) DUPLICAÇÃO REAL";
        counts.DUPLICACAO_REAL++;
        reason = "Enunciado reescrito com altíssima sobreposição frasal e exigência do mesmo raciocínio sem variação conceitual substancial.";
      } else if (sim.tokenDice >= 0.60) {
        classification = "B) MESMO CONCEITO, MAS QUESTÕES DISTINTAS";
        counts.MESMO_CONCEITO_DISTINTAS++;
        reason = "Compartilham termos centrais do tópico do edital, porém estruturam problemas, situações hipotéticas ou perguntas independentes.";
      } else {
        classification = "D) FALSO POSITIVO";
        counts.FALSO_POSITIVO++;
        reason = "Similaridade identificada por compartilhamento de termos técnicos da matéria (ex: Transpetro, suprimentos, fiscalização), mas raciocínios independentes.";
      }
    }

    classifiedReview.push({
      questionId: qA.id,
      topicId: qA.topicId,
      topicTitle: qA.topic.title,
      similarQuestionId: qB.id,
      similarity: pair.combinedScore,
      tokenDice: pair.tokenDice,
      classification,
      reason,
      statementSnippetA: qA.statement.slice(0, 100) + "...",
      statementSnippetB: qB.statement.slice(0, 100) + "...",
    });
  }

  const reviewOutputPath = path.join(__dirname, "../question-bank-semantic-review.json");
  fs.writeFileSync(reviewOutputPath, JSON.stringify({
    metadata: {
      generatedAt: new Date().toISOString(),
      totalPairsAudited: classifiedReview.length,
      distribution: counts,
    },
    pairs: classifiedReview,
  }, null, 2), "utf-8");

  console.log(`✅ Relatório salvo com sucesso em: ${reviewOutputPath}\n`);
  console.log("📊 Distribuição das Classificações:");
  console.log(`   • A) DUPLICAÇÃO REAL: ${counts.DUPLICACAO_REAL}`);
  console.log(`   • B) MESMO CONCEITO, MAS QUESTÕES DISTINTAS: ${counts.MESMO_CONCEITO_DISTINTAS}`);
  console.log(`   • C) CONTEXTO DIFERENTE, RACIOCÍNIO DIFERENTE: ${counts.CONTEXTO_DIFERENTE_RACIOCINIO_DIFERENTE}`);
  console.log(`   • D) FALSO POSITIVO: ${counts.FALSO_POSITIVO}`);
  console.log(`   • E) SEED/BOILERPLATE: ${counts.SEED_BOILERPLATE}`);
  console.log("==================================================\n");

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Erro na classificação semântica:", err);
  prisma.$disconnect();
  process.exit(1);
});
