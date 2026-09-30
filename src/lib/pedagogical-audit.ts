/**
 * Módulo de Auditoria Pedagógica e Integridade Semântica
 * TRANSPETRO STUDY 2026.3 • Ênfase 18: Suprimento de Bens e Serviços
 * 
 * Fornece algoritmos determinísticos para:
 * 1. Detecção de duplicidade semântica (Jaccard / bigramas normalizados)
 * 2. Validação estrita de legislação e normas reais do edital
 * 3. Validação de funções do Excel (PT-BR) e recursos do Office 365
 * 4. Análise de distratores (termos denunciadores, sinônimos internos e plausibilidade)
 * 5. Consistência matemática em questões de cálculo
 * 6. Cálculo de Score de Risco de QA Pedagógico
 */

/** Stopwords fundamentais da língua portuguesa para filtragem semântica */
const PT_STOPWORDS = new Set([
  "a", "o", "as", "os", "um", "uma", "uns", "umas", "de", "do", "da", "dos", "das",
  "em", "no", "na", "nos", "nas", "por", "pelo", "pela", "pelos", "pelas", "para",
  "com", "sem", "sob", "sobre", "entre", "que", "e", "ou", "se", "como", "mas",
  "ao", "aos", "qual", "quais", "sua", "seu", "suas", "seus", "este", "esta",
  "estes", "estas", "esse", "essa", "esses", "essas", "aquele", "aquela", "aqueles",
  "aquelas", "isto", "isso", "aquilo", "sao", "ser", "foi", "era", "esta", "estao",
  "ter", "tem", "ha", "havia", "sobre", "quanto", "quando", "onde", "quem"
]);

/**
 * Normaliza texto removendo acentuação, caracteres especiais e espaços extras.
 * @param text Texto de entrada
 * @returns Texto em caixa baixa normalizado
 */
export function normalizeSemanticText(text: string): string {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    // Preservar números com pontos como 13.303 -> 13303
    .replace(/(\d+)\.(\d+)/g, "$1$2")
    .replace(/[^a-z0-9\s_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Extrai tokens semânticos significativos excluindo stopwords e termos curtos.
 * @param text Texto de entrada
 * @returns Lista de palavras-chave normalizadas
 */
export function extractSemanticTokens(text: string): string[] {
  const normalized = normalizeSemanticText(text);
  return normalized
    .split(/\s+/)
    .filter((word) => word.length >= 3 && !PT_STOPWORDS.has(word));
}

/**
 * Gera bigramas de tokens para capturar contexto e ordem local de termos.
 * @param tokens Lista de tokens
 * @returns Conjunto de pares de palavras consecutivas
 */
export function generateTokenBigrams(tokens: string[]): Set<string> {
  const bigrams = new Set<string>();
  for (let i = 0; i < tokens.length - 1; i++) {
    bigrams.add(`${tokens[i]}_${tokens[i + 1]}`);
  }
  return bigrams;
}

/**
 * Calcula o Coeficiente de Similaridade de Jaccard entre dois conjuntos de strings.
 * @param setA Primeiro conjunto
 * @param setB Segundo conjunto
 * @returns Índice de similaridade entre 0.0 e 1.0
 */
export function calculateJaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 && setB.size === 0) return 1.0;
  if (setA.size === 0 || setB.size === 0) return 0.0;

  let intersectionCount = 0;
  for (const item of setA) {
    if (setB.has(item)) {
      intersectionCount++;
    }
  }

  const unionSize = setA.size + setB.size - intersectionCount;
  return unionSize > 0 ? intersectionCount / unionSize : 0;
}

/**
 * Calcula o Coeficiente de Sørensen-Dice entre dois conjuntos.
 * @param setA Primeiro conjunto
 * @param setB Segundo conjunto
 * @returns Índice Dice entre 0.0 e 1.0
 */
export function calculateDiceSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 && setB.size === 0) return 1.0;
  if (setA.size === 0 || setB.size === 0) return 0.0;

  let intersectionCount = 0;
  for (const item of setA) {
    if (setB.has(item)) {
      intersectionCount++;
    }
  }

  return (2 * intersectionCount) / (setA.size + setB.size);
}

/**
 * Avalia se dois enunciados são semanticamente equivalentes ou repetitivos.
 * Combina Sørensen-Dice sobre palavras conceituais e bigramas.
 * @param textA Primeiro enunciado
 * @param textB Segundo enunciado
 * @returns Similaridade combinada e flag indicativa de duplicidade semântica
 */
export function evaluateSemanticSimilarity(textA: string, textB: string): {
  tokenSimilarity: number;
  bigramSimilarity: number;
  combinedScore: number;
  isSuspectDuplicate: boolean;
} {
  const tokensA = extractSemanticTokens(textA);
  const tokensB = extractSemanticTokens(textB);

  const setTokensA = new Set(tokensA);
  const setTokensB = new Set(tokensB);
  const tokenDice = calculateDiceSimilarity(setTokensA, setTokensB);
  const tokenJaccard = calculateJaccardSimilarity(setTokensA, setTokensB);

  const bigramsA = generateTokenBigrams(tokensA);
  const bigramsB = generateTokenBigrams(tokensB);
  const bigramDice = calculateDiceSimilarity(bigramsA, bigramsB);

  // Sørensen-Dice sobre tokens é a métrica principal para variação de vocabulário
  const combinedScore = (tokenDice * 0.7) + (bigramDice * 0.3);
  const isSuspectDuplicate = combinedScore >= 0.55 || tokenDice >= 0.65;

  return {
    tokenSimilarity: Number(tokenJaccard.toFixed(4)),
    bigramSimilarity: Number(bigramDice.toFixed(4)),
    combinedScore: Number(combinedScore.toFixed(4)),
    isSuspectDuplicate,
  };
}

/**
 * Lista canônica de funções oficiais do Microsoft Excel em Português Brasil (PT-BR).
 */
export const VALID_EXCEL_FUNCTIONS_PTBR = new Set([
  "SOMA", "MEDIA", "SOMASE", "SOMASES", "CONT.SE", "CONT.SES", "CONT.VALORES",
  "CONTAR.VAZIO", "CONT.NUM", "SE", "E", "OU", "NAO", "SEERRO", "SES",
  "PROCV", "PROCH", "PROCX", "CORRESP", "CORRESPX", "INDICE", "DESLOC",
  "CONCATENAR", "CONCAT", "TEXTO", "MAIUSCULA", "MINUSCULA", "PRI.MAIUSCULA",
  "EXT.TEXTO", "ESQUERDA", "DIREITA", "LOCALIZAR", "PROCURAR", "SUBSTITUIR",
  "HOJE", "AGORA", "DATA", "ANO", "MES", "DIA", "DIATRABALHO", "DIAS360",
  "ARRED", "ARREDONDAR.PARA.CIMA", "ARREDONDAR.PARA.BAIXO", "INT", "ABS",
  "POTENCIA", "RAIZ", "MOD", "MAXIMO", "MINIMO", "MAIOR", "MENOR",
  "ALEATORIO", "ALEATORIOENTRE", "VF", "VP", "TAXA", "NPER", "PGTO",
  "UNICOS", "ORDENAR", "FILTRO", "MATRIZPARATEXTO"
]);

/**
 * Valida se uma menção de fórmula/função de planilha refere-se a funções legítimas do Excel PT-BR.
 * @param text Texto contendo eventuais menções a funções do Excel
 * @returns Relatório de funções encontradas, funções válidas e anomalias
 */
export function validateExcelFunctions(text: string): {
  detectedFunctions: string[];
  invalidFunctions: string[];
  isValid: boolean;
} {
  // Padrão que captura funções como =SOMA(...) ou fórmulas mencionadas em texto MAIÚSCULAS_COM_UNDERLINE(...)
  const regex = /\b([A-ZÁÉÍÓÚÂÊÔÃÕÇ\._]+)\s*\(/g;
  const detected = new Set<string>();
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const rawFunc = match[1].toUpperCase();
    const cleanFunc = rawFunc.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    // Evitar falsos positivos como palavras comuns seguidas de parêntese
    if (cleanFunc.length >= 2 && !["EXEMPLO", "FIGURA", "TABELA", "ITEM", "ART", "LEI", "OPCAO"].includes(cleanFunc)) {
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

/**
 * Catálogo canônico de legislação oficial exigida para a Ênfase 18 do concurso Transpetro.
 */
export const OFFICIAL_LEGISLATION_REFS = [
  {
    code: "LEI_13303",
    label: "Lei nº 13.303/2016 (Estatuto das Empresas Estatais)",
    keywords: ["13.303", "13303", "estatuto das estatais", "estatais"],
    validArticlesMax: 97, // A Lei 13.303 possui 97 artigos
  },
  {
    code: "LEI_14133",
    label: "Lei nº 14.133/2021 (Nova Lei de Licitações e Contratos)",
    keywords: ["14.133", "14133", "nova lei de licitacoes"],
    validArticlesMax: 194, // A Lei 14.133 possui 194 artigos
  },
  {
    code: "DECRETO_2745",
    label: "Decreto nº 2.745/1998 (Regulamento Licitatório Petrobras)",
    keywords: ["2.745", "2745", "decreto 2745"],
    validArticlesMax: 10, // Decreto possui 9 artigos e regulamento anexo
  },
  {
    code: "LC_123",
    label: "Lei Complementar nº 123/2006 (Estatuto da ME e EPP)",
    keywords: ["123/2006", "lc 123", "lei complementar 123", "microempresa"],
    validArticlesMax: 89,
  },
  {
    code: "LGPD_13709",
    label: "Lei nº 13.709/2018 (Lei Geral de Proteção de Dados)",
    keywords: ["13.709", "13709", "lgpd", "protecao de dados"],
    validArticlesMax: 65, // A LGPD possui 65 artigos
  },
  {
    code: "CF_88",
    label: "Constituição Federal de 1988 (art. 37, 173 etc.)",
    keywords: ["constituicao federal", "constituicao", "cf/88", "cf 88", "carta magna"],
    validArticlesMax: 250,
  },
  {
    code: "RLCT_TRANSPETRO",
    label: "Regulamento de Licitações e Contratos da Transpetro / Petrobras",
    keywords: ["rlct", "regulamento de licitacoes e contratos", "regulamento da transpetro"],
    validArticlesMax: 200,
  }
];

/**
 * Valida referências a leis e artigos em questões de legislação para coibir artigos inexistentes.
 * @param text Texto com a fundamentação jurídica ou enunciado
 * @returns Relatório de conformidade normativa
 */
export function validateLegislationCitations(text: string): {
  detectedLaws: string[];
  citedArticles: { law: string; article: number; isValid: boolean }[];
  hasInvalidArticles: boolean;
} {
  const norm = normalizeSemanticText(text);
  const detectedLaws: string[] = [];
  const citedArticles: { law: string; article: number; isValid: boolean }[] = [];

  for (const law of OFFICIAL_LEGISLATION_REFS) {
    const matched = law.keywords.some((kw) => norm.includes(normalizeSemanticText(kw)));
    if (matched) {
      detectedLaws.push(law.code);

      // Buscar artigos associados (ex: "art. 28", "artigo 32", "art. 105")
      const artRegex = /(?:art\.?|artigo)\s*([0-9]{1,3})/gi;
      let match: RegExpExecArray | null;
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

  return {
    detectedLaws,
    citedArticles,
    hasInvalidArticles,
  };
}

/**
 * Termos categóricos / absolutistas que denunciam viés em questões de múltipla escolha.
 */
export const CATEGORICAL_BIAS_TERMS = [
  "sempre", "nunca", "jamais", "em qualquer hipotese", "em nenhuma hipotese",
  "obrigatoriamente sem excecao", "exclusivamente", "unicamente", "sob qualquer condicao"
];

/**
 * Termos caricatos ou absurdos que desqualificam a seriedade pedagógica do distrator.
 */
export const CARICATURAL_DISTRACTOR_TERMS = [
  "magica", "sobrenatural", "nunca na vida", "com certeza absoluta e sem ler",
  "impossivel de saber", "inutil", "de forma ridicula", "totalmente descabido e sem nexo"
];

/**
 * Avalia a qualidade das alternativas de uma questão em relação a distratores e vícios de banca.
 * @param question Objeto da questão com opções A-E e correctOption
 * @returns Relatório analítico de vícios de elaboração
 */
export function auditQuestionOptions(question: {
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  optionE: string;
  correctOption: string;
}): {
  categoricalTermsFound: { option: string; term: string; isCorrect: boolean }[];
  caricaturalTermsFound: { option: string; term: string }[];
  internalSynonymPairs: { option1: string; option2: string; similarity: number }[];
  lengthVarianceRatio: number;
  hasOutlierCorrectOption: boolean;
} {
  const optionsMap: Record<string, string> = {
    A: question.optionA,
    B: question.optionB,
    C: question.optionC,
    D: question.optionD,
    E: question.optionE,
  };

  const letters = ["A", "B", "C", "D", "E"];
  const categoricalTermsFound: { option: string; term: string; isCorrect: boolean }[] = [];
  const caricaturalTermsFound: { option: string; term: string }[] = [];

  for (const letter of letters) {
    const optText = optionsMap[letter] || "";
    const norm = normalizeSemanticText(optText);

    // Verificar termos categóricos
    for (const term of CATEGORICAL_BIAS_TERMS) {
      if (norm.includes(normalizeSemanticText(term))) {
        categoricalTermsFound.push({
          option: letter,
          term,
          isCorrect: letter === question.correctOption,
        });
      }
    }

    // Verificar termos caricatos
    for (const term of CARICATURAL_DISTRACTOR_TERMS) {
      if (norm.includes(normalizeSemanticText(term))) {
        caricaturalTermsFound.push({ option: letter, term });
      }
    }
  }

  // Verificar sinônimos internos (duas alternativas dizendo a mesma coisa)
  const internalSynonymPairs: { option1: string; option2: string; similarity: number }[] = [];
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

  // Análise de extensão e viés da correta
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

/**
 * Valida itens de Matemática (consistência numérica e formulação de dados).
 * @param statement Enunciado da questão
 * @param options Lista de alternativas
 * @returns Diagnóstico de consistência matemática
 */
export function auditMathQuestion(
  statement: string,
  options: { optionA: string; optionB: string; optionC: string; optionD: string; optionE: string }
): {
  hasNumbersInStatement: boolean;
  hasNumbersInOptions: boolean;
  uniqueOptionValues: number;
  isDeterministicCandidate: boolean;
} {
  const numberRegex = /[0-9]+(?:[\.,][0-9]+)?/g;
  const statementMatches = statement.match(numberRegex) || [];
  const optionsList = [options.optionA, options.optionB, options.optionC, options.optionD, options.optionE];

  const optionMatches = optionsList.map((opt) => opt.match(numberRegex) || []);
  const optionsWithNumbers = optionMatches.filter((m) => m.length > 0).length;

  const uniqueNormalizedOptions = new Set(optionsList.map(normalizeSemanticText));

  return {
    hasNumbersInStatement: statementMatches.length > 0,
    hasNumbersInOptions: optionsWithNumbers >= 3,
    uniqueOptionValues: uniqueNormalizedOptions.size,
    isDeterministicCandidate: statementMatches.length > 0 && uniqueNormalizedOptions.size === 5,
  };
}

/**
 * Calcula o Score de Risco de QA Pedagógico de uma questão (0 a 100).
 * 0 = Questão impecável sem vícios
 * 100 = Questão com múltiplos vícios críticos (tamanho tendencioso, distratores caricatos, falta de metadata, boilerplate etc.)
 * @param question Objeto completo da questão com metadados opcionais
 * @returns Pontuação de risco e array de anomalias detectadas
 */
export function computeQaRiskScore(question: {
  statement: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  optionE: string;
  correctOption: string;
  explanation: string;
  questionType?: string | null;
  cognitiveLevel?: string | null;
  origin?: string | null;
  isSuspectDuplicate?: boolean;
}): {
  riskScore: number;
  anomalyFlags: string[];
} {
  let riskScore = 0;
  const anomalyFlags: string[] = [];

  // 1. Auditoria de metadados pedagógicos obrigatórios
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

  // 3. Origem de seed ou legado não enriquecido
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

  // 6. Termos categóricos na opção correta
  const categoricalOnCorrect = optAudit.categoricalTermsFound.filter((c) => c.isCorrect);
  if (categoricalOnCorrect.length > 0) {
    riskScore += 15;
    anomalyFlags.push("CORRETA_COM_TERMO_CATEGORICO_ABSOLUTISTA");
  }

  // 7. Explicação superficial ou vazia
  const explLen = (question.explanation || "").trim().length;
  if (explLen < 60) {
    riskScore += 35;
    anomalyFlags.push("EXPLICACAO_EXTREMAMENTE_CURTA");
  } else if (explLen < 150) {
    riskScore += 10;
    anomalyFlags.push("EXPLICACAO_POUCO_FUNDAMENTADA");
  }

  // 8. Enunciado muito curto ou genérico
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

/**
 * Detecta anomalias estatísticas na distribuição de gabaritos (ex: letra com 0% ou letra com mais de 50%).
 * @param distribution Contagem de ocorrências por letra A, B, C, D, E
 * @returns Diagnóstico de concentração anômala
 */
export function detectAnswerAnomaly(distribution: { A: number; B: number; C: number; D: number; E: number }): {
  hasAnomaly: boolean;
  zeroLetters: string[];
  dominantLetters: { letter: string; percentage: number }[];
  total: number;
} {
  const letters = ["A", "B", "C", "D", "E"] as const;
  const total = letters.reduce((acc, l) => acc + (distribution[l] || 0), 0);

  if (total === 0) {
    return { hasAnomaly: false, zeroLetters: [], dominantLetters: [], total: 0 };
  }

  const zeroLetters: string[] = [];
  const dominantLetters: { letter: string; percentage: number }[] = [];

  for (const letter of letters) {
    const count = distribution[letter] || 0;
    const pct = (count / total) * 100;
    if (count === 0 && total >= 10) {
      zeroLetters.push(letter);
    }
    if (pct > 50.0 && total >= 10) {
      dominantLetters.push({ letter, percentage: Number(pct.toFixed(1)) });
    }
  }

  const hasAnomaly = zeroLetters.length > 0 || dominantLetters.length > 0;
  return {
    hasAnomaly,
    zeroLetters,
    dominantLetters,
    total,
  };
}

/**
 * Reordena com segurança a posição das alternativas de uma questão movendo a correta para uma letra alvo,
 * garantindo integridade e coerência absoluta de conteúdo e explicação.
 * @param question Questão com alternativas A-E e correctOption atual
 * @param targetLetter Letra de destino para a alternativa correta ("A" | "B" | "C" | "D" | "E")
 * @returns Nova questão com alternativas permutadas e correctOption atualizado
 */
export function reorderOptionsSafely<T extends {
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  optionE: string;
  correctOption: "A" | "B" | "C" | "D" | "E";
}>(question: T, targetLetter: "A" | "B" | "C" | "D" | "E"): T {
  if (question.correctOption === targetLetter) {
    return { ...question };
  }

  const currentOpts: Record<"A" | "B" | "C" | "D" | "E", string> = {
    A: question.optionA,
    B: question.optionB,
    C: question.optionC,
    D: question.optionD,
    E: question.optionE,
  };

  const correctText = currentOpts[question.correctOption];
  const targetCurrentText = currentOpts[targetLetter];

  // Troca a posição da alternativa correta com a alternativa que ocupava a letra de destino
  const newOpts = { ...currentOpts };
  newOpts[targetLetter] = correctText;
  newOpts[question.correctOption] = targetCurrentText;

  return {
    ...question,
    optionA: newOpts.A,
    optionB: newOpts.B,
    optionC: newOpts.C,
    optionD: newOpts.D,
    optionE: newOpts.E,
    correctOption: targetLetter,
  };
}
