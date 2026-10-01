/**
 * Motor CJS de Auditoria Pedagógica e Integridade Semântica
 * TRANSPETRO STUDY 2026.3 • Ênfase 18: Suprimento de Bens e Serviços
 */

const PT_STOPWORDS = new Set([
  "a", "o", "as", "os", "um", "uma", "uns", "umas", "de", "do", "da", "dos", "das",
  "em", "no", "na", "nos", "nas", "por", "pelo", "pela", "pelos", "pelas", "para",
  "com", "sem", "sob", "sobre", "entre", "que", "e", "ou", "se", "como", "mas",
  "ao", "aos", "qual", "quais", "sua", "seu", "suas", "seus", "este", "esta",
  "estes", "estas", "esse", "essa", "esses", "essas", "aquele", "aquela", "aqueles",
  "aquelas", "isto", "isso", "aquilo", "sao", "ser", "foi", "era", "esta", "estao",
  "ter", "tem", "ha", "havia", "sobre", "quanto", "quando", "onde", "quem"
]);

function normalizeSemanticText(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/(\d+)\.(\d+)/g, "$1$2")
    .replace(/[^a-z0-9\s_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractSemanticTokens(text) {
  const normalized = normalizeSemanticText(text);
  return normalized
    .split(/\s+/)
    .filter((word) => word.length >= 3 && !PT_STOPWORDS.has(word));
}

function generateTokenBigrams(tokens) {
  const bigrams = new Set();
  for (let i = 0; i < tokens.length - 1; i++) {
    bigrams.add(`${tokens[i]}_${tokens[i + 1]}`);
  }
  return bigrams;
}

function calculateJaccardSimilarity(setA, setB) {
  if (setA.size === 0 && setB.size === 0) return 1.0;
  if (setA.size === 0 || setB.size === 0) return 0.0;
  let intersectionCount = 0;
  for (const item of setA) {
    if (setB.has(item)) intersectionCount++;
  }
  const unionSize = setA.size + setB.size - intersectionCount;
  return unionSize > 0 ? intersectionCount / unionSize : 0;
}

function calculateDiceSimilarity(setA, setB) {
  if (setA.size === 0 && setB.size === 0) return 1.0;
  if (setA.size === 0 || setB.size === 0) return 0.0;
  let intersectionCount = 0;
  for (const item of setA) {
    if (setB.has(item)) intersectionCount++;
  }
  return (2 * intersectionCount) / (setA.size + setB.size);
}

function evaluateSemanticSimilarity(textA, textB) {
  const tokensA = extractSemanticTokens(textA);
  const tokensB = extractSemanticTokens(textB);
  const setTokensA = new Set(tokensA);
  const setTokensB = new Set(tokensB);
  const tokenDice = calculateDiceSimilarity(setTokensA, setTokensB);
  const tokenJaccard = calculateJaccardSimilarity(setTokensA, setTokensB);

  const bigramsA = generateTokenBigrams(tokensA);
  const bigramsB = generateTokenBigrams(tokensB);
  const bigramDice = calculateDiceSimilarity(bigramsA, bigramsB);

  const combinedScore = (tokenDice * 0.7) + (bigramDice * 0.3);
  const isSuspectDuplicate = combinedScore >= 0.55 || tokenDice >= 0.65;

  return {
    tokenSimilarity: Number(tokenJaccard.toFixed(4)),
    bigramSimilarity: Number(bigramDice.toFixed(4)),
    combinedScore: Number(combinedScore.toFixed(4)),
    tokenDice: Number(tokenDice.toFixed(4)),
    isSuspectDuplicate,
  };
}

const VALID_EXCEL_FUNCTIONS_PTBR = new Set([
  "SOMA", "MEDIA", "SOMASE", "SOMASES", "MEDIASES", "CONT.SE", "CONT.SES", "CONT.VALORES",
  "CONTAR.VAZIO", "CONT.NUM", "SE", "E", "OU", "NAO", "SEERRO", "SE.ERRO", "SES",
  "PROCV", "PROCH", "PROCX", "CORRESP", "CORRESPX", "INDICE", "DESLOC",
  "CONCATENAR", "CONCAT", "TEXTO", "MAIUSCULA", "MINUSCULA", "PRI.MAIUSCULA",
  "EXT.TEXTO", "EXTR.TEXTO", "ESQUERDA", "DIREITA", "LOCALIZAR", "PROCURAR", "SUBSTITUIR",
  "HOJE", "AGORA", "DATA", "ANO", "MES", "DIA", "DIATRABALHO", "DIAS360",
  "ARRED", "ARREDONDAR.PARA.CIMA", "ARREDONDAR.PARA.BAIXO", "INT", "ABS",
  "POTENCIA", "RAIZ", "MOD", "MAXIMO", "MINIMO", "MAIOR", "MENOR",
  "ALEATORIO", "ALEATORIOENTRE", "VF", "VP", "TAXA", "NPER", "PGTO",
  "UNICOS", "UNICO", "ORDENAR", "FILTRO", "MATRIZPARATEXTO", "SUBTOTAL", "TRANSPOR",
  "ESCOLHER", "CLASSIFICAR", "SEQUENCIA", "SOMARPRODUTO", "CONVERTER", "AGRUPAR",
  "DATADIF", "DIATRABALHOTOTAL", "DIATRABALHO.TOTAL"
]);

function validateExcelFunctions(text) {
  // Padrão que captura funções como =SOMA(...) ou função/fórmula SOMA(...)
  const regex = /(?:=\s*|(?:\bfuncao|\bformula)\s+)([A-ZÁÉÍÓÚÂÊÔÃÕÇ\._]+)\s*\(/gi;
  const detected = new Set();
  let match;

  while ((match = regex.exec(text)) !== null) {
    const rawFunc = match[1].toUpperCase();
    const cleanFunc = rawFunc.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (cleanFunc.length >= 2 && !["EXEMPLO", "FIGURA", "TABELA", "ITEM", "ART", "LEI", "OPCAO", "PODE", "II", "III", "IV", "CMV", "DANFE", "ISSQN", "CFOP", "NCM"].includes(cleanFunc)) {
      detected.add(cleanFunc);
    }
  }

  const detectedFunctions = Array.from(detected);
  const invalidFunctions = detectedFunctions.filter((fn) => !VALID_EXCEL_FUNCTIONS_PTBR.has(fn));

  return {
    detectedFunctions,
    invalidFunctions,
    isValid: invalidFunctions.length === 0,
  };
}

const OFFICIAL_LEGISLATION_REFS = [
  {
    code: "LEI_13303",
    label: "Lei nº 13.303/2016 (Estatuto das Estatais)",
    keywords: ["13.303", "13303", "estatuto das estatais", "estatais"],
    validArticlesMax: 97,
  },
  {
    code: "LEI_14133",
    label: "Lei nº 14.133/2021 (Nova Lei de Licitações)",
    keywords: ["14.133", "14133", "nova lei de licitacoes"],
    validArticlesMax: 194,
  },
  {
    code: "DECRETO_2745",
    label: "Decreto nº 2.745/1998 (Petrobras)",
    keywords: ["2.745", "2745", "decreto 2745"],
    validArticlesMax: 10,
  },
  {
    code: "LC_123",
    label: "Lei Complementar nº 123/2006 (ME/EPP)",
    keywords: ["123/2006", "lc 123", "lei complementar 123", "microempresa"],
    validArticlesMax: 89,
  },
  {
    code: "LGPD_13709",
    label: "Lei nº 13.709/2018 (LGPD)",
    keywords: ["13.709", "13709", "lgpd", "protecao de dados"],
    validArticlesMax: 65,
  },
  {
    code: "CF_88",
    label: "Constituição Federal de 1988 (art. 37, 173 etc.)",
    keywords: ["constituicao federal", "constituicao", "cf/88", "cf 88", "carta magna"],
    validArticlesMax: 250,
  },
  {
    code: "RLCT_TRANSPETRO",
    label: "RLCT Transpetro",
    keywords: ["rlct", "regulamento de licitacoes e contratos", "regulamento da transpetro"],
    validArticlesMax: 200,
  }
];

function validateLegislationCitations(text) {
  const norm = normalizeSemanticText(text);
  const detectedLaws = [];
  const citedArticles = [];

  for (const law of OFFICIAL_LEGISLATION_REFS) {
    const matched = law.keywords.some((kw) => norm.includes(normalizeSemanticText(kw)));
    if (matched) {
      detectedLaws.push(law.code);
      const artRegex = /(?:art\.?|artigo)\s*([0-9]{1,3})/gi;
      let match;
      while ((match = artRegex.exec(text)) !== null) {
        const artNum = parseInt(match[1], 10);
        if (!isNaN(artNum)) {
          const isValid = artNum <= law.validArticlesMax;
          citedArticles.push({ law: law.code, article: artNum, isValid });
        }
      }
    }
  }

  const hasInvalidArticles = citedArticles.some((ca) => !ca.isValid);
  return { detectedLaws, citedArticles, hasInvalidArticles };
}

const CATEGORICAL_BIAS_TERMS = [
  "sempre", "nunca", "jamais", "em qualquer hipotese", "em nenhuma hipotese",
  "obrigatoriamente sem excecao", "exclusivamente", "unicamente", "sob qualquer condicao"
];

const CARICATURAL_DISTRACTOR_TERMS = [
  "magica", "sobrenatural", "nunca na vida", "com certeza absoluta e sem ler",
  "impossivel de saber", "inutil", "de forma ridicula", "totalmente descabido e sem nexo"
];

function auditQuestionOptions(question) {
  const optionsMap = {
    A: question.optionA || "",
    B: question.optionB || "",
    C: question.optionC || "",
    D: question.optionD || "",
    E: question.optionE || "",
  };

  const letters = ["A", "B", "C", "D", "E"];
  const categoricalTermsFound = [];
  const caricaturalTermsFound = [];

  for (const letter of letters) {
    const optText = optionsMap[letter];
    const norm = normalizeSemanticText(optText);

    for (const term of CATEGORICAL_BIAS_TERMS) {
      if (norm.includes(normalizeSemanticText(term))) {
        categoricalTermsFound.push({
          option: letter,
          term,
          isCorrect: letter === question.correctOption,
        });
      }
    }

    for (const term of CARICATURAL_DISTRACTOR_TERMS) {
      if (norm.includes(normalizeSemanticText(term))) {
        caricaturalTermsFound.push({ option: letter, term });
      }
    }
  }

  const internalSynonymPairs = [];
  for (let i = 0; i < letters.length; i++) {
    for (let j = i + 1; j < letters.length; j++) {
      const opt1 = letters[i];
      const opt2 = letters[j];
      const set1 = new Set(extractSemanticTokens(optionsMap[opt1]));
      const set2 = new Set(extractSemanticTokens(optionsMap[opt2]));
      const sim = calculateDiceSimilarity(set1, set2);
      if (sim >= 0.60) {
        internalSynonymPairs.push({
          option1: opt1,
          option2: opt2,
          similarity: Number(sim.toFixed(3)),
        });
      }
    }
  }

  const lengths = letters.map((l) => optionsMap[l].length);
  const minLen = Math.min(...lengths);
  const maxLen = Math.max(...lengths);
  const lengthVarianceRatio = minLen > 0 ? Number((maxLen / minLen).toFixed(2)) : 0;

  const correctLen = optionsMap[question.correctOption]?.length || 0;
  const incorrectLengths = letters
    .filter((l) => l !== question.correctOption)
    .map((l) => optionsMap[l]?.length || 0);
  const avgIncorrect = incorrectLengths.reduce((a, b) => a + b, 0) / (incorrectLengths.length || 1);

  const hasOutlierCorrectOption = correctLen > avgIncorrect * 1.5 && (correctLen - avgIncorrect > 35);

  return {
    categoricalTermsFound,
    caricaturalTermsFound,
    internalSynonymPairs,
    lengthVarianceRatio,
    hasOutlierCorrectOption,
  };
}

function auditMathQuestion(statement, options) {
  const numberRegex = /[0-9]+(?:[\.,][0-9]+)?/g;
  const statementMatches = (statement || "").match(numberRegex) || [];
  const optionsList = [options.optionA, options.optionB, options.optionC, options.optionD, options.optionE];
  const optionMatches = optionsList.map((opt) => (opt || "").match(numberRegex) || []);
  const optionsWithNumbers = optionMatches.filter((m) => m.length > 0).length;
  const uniqueNormalizedOptions = new Set(optionsList.map(normalizeSemanticText));

  return {
    hasNumbersInStatement: statementMatches.length > 0,
    hasNumbersInOptions: optionsWithNumbers >= 3,
    uniqueOptionValues: uniqueNormalizedOptions.size,
    isDeterministicCandidate: statementMatches.length > 0 && uniqueNormalizedOptions.size === 5,
  };
}

function computeQaRiskScore(question) {
  let riskScore = 0;
  const anomalyFlags = [];

  // 1. Metadados pedagógicos obrigatórios
  if (!question.questionType || !question.cognitiveLevel) {
    riskScore += 30;
    anomalyFlags.push("METADADOS_PEDAGOGICOS_AUSENTES");
  }

  // 2. Detecção de boilerplate / template sintético de seed
  const stmt = question.statement || "";
  if (
    stmt.includes("Item 1]") ||
    stmt.includes("Item 2]") ||
    stmt.includes("[Conhecimentos Específicos") ||
    stmt.includes("[Língua Portuguesa") ||
    stmt.includes("[Matemática") ||
    stmt.includes("Uma equipe logística necessita calcular")
  ) {
    riskScore += 40;
    anomalyFlags.push("BOILERPLATE_SINTETICO_SEED");
  }

  // 3. Origem de seed não enriquecida
  if (question.origin === "AI_GENERATED" && (!question.questionType || !question.cognitiveLevel)) {
    riskScore += 20;
    anomalyFlags.push("ORIGEM_SEED_NAO_ENRIQUECIDA");
  }

  // 4. Par suspeito de duplicidade semântica
  if (question.isSuspectDuplicate) {
    riskScore += 25;
    anomalyFlags.push("ALTA_SIMILARIDADE_SEMANTICA");
  }

  // 5. Auditoria de opções
  const optAudit = auditQuestionOptions(question);
  if (optAudit.hasOutlierCorrectOption) {
    riskScore += 25;
    anomalyFlags.push("VIÉS_TAMANHO_CORRETA_LONGA");
  }
  if (optAudit.caricaturalTermsFound.length > 0) {
    riskScore += 30;
    anomalyFlags.push("DISTRATOR_CARICATO_ABSURDO");
  }
  if (optAudit.internalSynonymPairs.length > 0) {
    riskScore += 20;
    anomalyFlags.push("ALTERNATIVAS_SINONIMAS_REDUNDANTES");
  }

  const categoricalOnCorrect = optAudit.categoricalTermsFound.filter((c) => c.isCorrect);
  if (categoricalOnCorrect.length > 0) {
    riskScore += 15;
    anomalyFlags.push("CORRETA_COM_TERMO_CATEGORICO_ABSOLUTISTA");
  }

  const explLen = (question.explanation || "").trim().length;
  if (explLen < 60) {
    riskScore += 35;
    anomalyFlags.push("EXPLICACAO_EXTREMAMENTE_CURTA");
  } else if (explLen < 150) {
    riskScore += 10;
    anomalyFlags.push("EXPLICACAO_POUCO_FUNDAMENTADA");
  }

  const stmtLen = stmt.trim().length;
  if (stmtLen < 80) {
    riskScore += 20;
    anomalyFlags.push("ENUNCIADO_CURTO_OU_GENERICO");
  }

  return {
    riskScore: Math.min(riskScore, 100),
    anomalyFlags,
  };
}

module.exports = {
  normalizeSemanticText,
  extractSemanticTokens,
  evaluateSemanticSimilarity,
  validateExcelFunctions,
  validateLegislationCitations,
  auditQuestionOptions,
  auditMathQuestion,
  computeQaRiskScore,
  VALID_EXCEL_FUNCTIONS_PTBR,
  OFFICIAL_LEGISLATION_REFS,
};
