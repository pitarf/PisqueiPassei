import { describe, expect, test } from "bun:test";
import {
  normalizeSemanticText,
  extractSemanticTokens,
  evaluateSemanticSimilarity,
  validateExcelFunctions,
  validateLegislationCitations,
  auditQuestionOptions,
  auditMathQuestion,
  computeQaRiskScore,
  detectAnswerAnomaly,
  reorderOptionsSafely,
} from "./pedagogical-audit";

describe("pedagogical-audit - Auditoria Semântica e Integridade Pedagógica", () => {
  test("extrai tokens e normaliza texto removendo stopwords e diacríticos", () => {
    const raw = "A Lei nº 13.303/2016 estabelece critérios para a fiscalização dos contratos!";
    const tokens = extractSemanticTokens(raw);

    expect(tokens).toContain("lei");
    expect(tokens).toContain("13303");
    expect(tokens).toContain("2016");
    expect(tokens).toContain("estabelece");
    expect(tokens).toContain("criterios");
    expect(tokens).toContain("fiscalizacao");
    expect(tokens).toContain("contratos");
    expect(tokens).not.toContain("dos");
    expect(tokens).not.toContain("para");
  });

  test("detecta similaridade semântica suspeita entre enunciados reescritos", () => {
    const stmt1 = "Em um almoxarifado de grande porte da Transpetro, a curva ABC é utilizada para classificar itens por valor de demanda anual.";
    const stmt2 = "No almoxarifado central da Transpetro, utiliza-se a curva ABC para classificar os materiais pelo valor de sua demanda anual.";

    const result = evaluateSemanticSimilarity(stmt1, stmt2);
    expect(result.combinedScore).toBeGreaterThan(0.55);
    expect(result.isSuspectDuplicate).toBe(true);
  });

  test("não classifica como duplicada questões com tópicos e contextos conceituais distintos", () => {
    const stmt1 = "O princípio da publicidade na Lei 13.303 exige a publicação tempestiva dos editais no Diário Oficial da União.";
    const stmt2 = "A interpolação linear em matemática financeira permite estimar valores intermediários entre dois pontos conhecidos.";

    const result = evaluateSemanticSimilarity(stmt1, stmt2);
    expect(result.combinedScore).toBeLessThan(0.30);
    expect(result.isSuspectDuplicate).toBe(false);
  });

  test("valida funções legítimas do Microsoft Excel em Português Brasil", () => {
    const textValid = "O usuário digitou a fórmula =PROCV(A2; B1:D100; 3; FALSO) e combinou com =SOMA(E1:E10).";
    const res = validateExcelFunctions(textValid);

    expect(res.isValid).toBe(true);
    expect(res.detectedFunctions).toContain("PROCV");
    expect(res.detectedFunctions).toContain("SOMA");
    expect(res.invalidFunctions).toHaveLength(0);
  });

  test("detecta funções fictícias ou inventadas de planilha eletrônica", () => {
    const textInvalid = "Para obter o total dinâmico, utilize a função =SOMATUDO_AGORA(A1:A10) ou =CALCULA_VALOR_FINAL(B2).";
    const res = validateExcelFunctions(textInvalid);

    expect(res.isValid).toBe(false);
    expect(res.invalidFunctions).toContain("SOMATUDO_AGORA");
    expect(res.invalidFunctions).toContain("CALCULA_VALOR_FINAL");
  });

  test("valida citações de artigos de leis reais do edital", () => {
    const text = "Conforme o art. 28 da Lei 13.303/2016 e o art. 32 da Lei 14.133/2021, as licitações seguem ritos específicos.";
    const res = validateLegislationCitations(text);

    expect(res.hasInvalidArticles).toBe(false);
    expect(res.detectedLaws).toContain("LEI_13303");
    expect(res.detectedLaws).toContain("LEI_14133");
  });

  test("identifica citação de artigo inexistente de lei (alucinação)", () => {
    // Lei 13.303 tem apenas 97 artigos. Artigo 950 é alucinação.
    const textWithHallucination = "Nos termos do art. 950 da Lei 13.303/2016, aplica-se a penalidade de suspensão.";
    const res = validateLegislationCitations(textWithHallucination);

    expect(res.hasInvalidArticles).toBe(true);
    const invalidArt = res.citedArticles.find((c) => !c.isValid);
    expect(invalidArt).toBeDefined();
    expect(invalidArt?.article).toBe(950);
  });

  test("identifica distratores caricatos, termos absolutistas e alternativas sinônimas", () => {
    const question = {
      optionA: "O fiscal deve sempre rejeitar a mercadoria sem qualquer exceção ou avaliação prévia.",
      optionB: "A mercadoria é recebida de forma mágica pelo almoxarifado sem conferência alguma.",
      optionC: "O procedimento exige verificação quantitativa e qualitativa dos itens.",
      optionD: "O procedimento exige conferência quantitativa e qualitativa dos materiais entregues.",
      optionE: "A nota fiscal é emitida após o pagamento integral antecipado.",
      correctOption: "C",
    };

    const audit = auditQuestionOptions(question);

    // Termo categórico na A ("sempre", "sem qualquer exceção")
    expect(audit.categoricalTermsFound.some((c) => c.option === "A")).toBe(true);
    // Termo caricato na B ("mágica")
    expect(audit.caricaturalTermsFound.some((c) => c.option === "B")).toBe(true);
    // Sinônimos internos entre C e D
    expect(audit.internalSynonymPairs.length).toBeGreaterThan(0);
  });

  test("avalia consistência em questões de cálculo matemático", () => {
    const statement = "Um investimento de R$ 10.000,00 rendeu juros compostos a uma taxa de 2% ao mês durante 3 meses.";
    const options = {
      optionA: "R$ 10.612,08",
      optionB: "R$ 10.600,00",
      optionC: "R$ 10.400,00",
      optionD: "R$ 10.200,00",
      optionE: "R$ 10.800,00",
    };

    const mathAudit = auditMathQuestion(statement, options);
    expect(mathAudit.hasNumbersInStatement).toBe(true);
    expect(mathAudit.hasNumbersInOptions).toBe(true);
    expect(mathAudit.uniqueOptionValues).toBe(5);
    expect(mathAudit.isDeterministicCandidate).toBe(true);
  });

  test("calcula QA Risk Score graduado conforme anomalias detectadas", () => {
    const perfectQuestion = {
      statement: "No contexto da gestão de estoques na indústria de óleo e gás, a acurácia de inventário mede a conformidade entre o registro contábil e a contagem física dos materiais.",
      optionA: "O indicador deve ser apurado trimestralmente por amostragem estratificada dos itens de maior giro.",
      optionB: "A divergência constatada deve ser estornada sem necessidade de apuração de responsabilidades operacionais.",
      optionC: "A acurácia de 100% é obrigatória para todos os itens da classe C independentemente do seu custo unitário.",
      optionD: "O inventário rotativo dispensa a conciliação documental quando realizado por equipe interna qualificada.",
      optionE: "A contagem física periódica visa exclusivamente à atualização do valor venal para fins de recolhimento tributário.",
      correctOption: "A",
      explanation: "A opção A está correta porque a acurácia de inventário requer auditorias periódicas, especialmente nos itens classe A da curva ABC, para garantir a fidedignidade dos registros operacionais e contábeis do estoque.",
      questionType: "CONCEITO",
      cognitiveLevel: "COMPREENDER",
    };

    const lowRisk = computeQaRiskScore(perfectQuestion);
    expect(lowRisk.riskScore).toBeLessThan(30);

    const flawedQuestion = {
      statement: "Marque a certa:",
      optionA: "Acontece mágica no armazém.",
      optionB: "Tudo funciona perfeitamente.",
      optionC: "Tudo funciona perfeitamente bem.",
      optionD: "O procedimento técnico operacional segundo as melhores práticas internacionais devidamente consolidadas na norma brasileira exige a documentação estrita de todas as fases da operação.",
      optionE: "Nenhuma das anteriores.",
      correctOption: "D",
      explanation: "É a D.",
    };

    const highRisk = computeQaRiskScore(flawedQuestion);
    expect(highRisk.riskScore).toBeGreaterThan(60);
    expect(highRisk.anomalyFlags).toContain("ENUNCIADO_CURTO_OU_GENERICO");
    expect(highRisk.anomalyFlags).toContain("VIÉS_TAMANHO_CORRETA_LONGA");
    expect(highRisk.anomalyFlags).toContain("DISTRATOR_CARICATO_ABSURDO");
    expect(highRisk.anomalyFlags).toContain("EXPLICACAO_EXTREMAMENTE_CURTA");
  });

  test("penaliza no QA Risk Score ausência de metadados pedagógicos e boilerplate de seed", () => {
    const seedQuestion = {
      statement: "[Conhecimentos Específicos - Suprimentos - Item 1] No gerenciamento de estoques e contratação de serviços segundo as boas práticas...",
      optionA: "Opção A genérica de seed.",
      optionB: "Opção B genérica de seed.",
      optionC: "A gestão de estoques por ponto de pedido prevê a reposição antes que o estoque atinja o nível de segurança operacional.",
      optionD: "Opção D genérica de seed.",
      optionE: "Opção E genérica de seed.",
      correctOption: "C",
      explanation: "Explicação padrão sintética.",
      questionType: null,
      cognitiveLevel: null,
      origin: "AI_GENERATED",
      isSuspectDuplicate: true,
    };

    const risk = computeQaRiskScore(seedQuestion);
    expect(risk.riskScore).toBeGreaterThan(50);
    expect(risk.anomalyFlags).toContain("METADADOS_PEDAGOGICOS_AUSENTES");
    expect(risk.anomalyFlags).toContain("BOILERPLATE_SINTETICO_SEED");
    expect(risk.anomalyFlags).toContain("ORIGEM_SEED_NAO_ENRIQUECIDA");
    expect(risk.anomalyFlags).toContain("ALTA_SIMILARIDADE_SEMANTICA");
  });

  test("detecta distribuição anômala de gabaritos quando há concentração excessiva ou letra zerada", () => {
    // Cenário de anomalia pré-curadoria em Administração: C=88% e A=0%
    const anomalousDist = { A: 0, B: 3, C: 44, D: 1, E: 2 };
    const diagAnomaly = detectAnswerAnomaly(anomalousDist);

    expect(diagAnomaly.hasAnomaly).toBe(true);
    expect(diagAnomaly.zeroLetters).toContain("A");
    expect(diagAnomaly.dominantLetters.some((d) => d.letter === "C" && d.percentage > 80)).toBe(true);

    // Cenário curado pós-curadoria: distribuição equilibrada sem concentração abusiva
    const balancedDist = { A: 12, B: 14, C: 7, D: 11, E: 6 };
    const diagBalanced = detectAnswerAnomaly(balancedDist);

    expect(diagBalanced.hasAnomaly).toBe(false);
    expect(diagBalanced.zeroLetters).toHaveLength(0);
    expect(diagBalanced.dominantLetters).toHaveLength(0);
  });

  test("reordena com segurança a posição das alternativas preservando integridade da resposta", () => {
    const originalQuestion = {
      optionA: "Texto da opção A incorreta",
      optionB: "Texto da opção B incorreta",
      optionC: "Texto da opção C VERDADEIRA E CORRETA",
      optionD: "Texto da opção D incorreta",
      optionE: "Texto da opção E incorreta",
      correctOption: "C" as const,
    };

    // Mover a alternativa correta de C para A com segurança
    const reordered = reorderOptionsSafely(originalQuestion, "A");

    expect(reordered.correctOption).toBe("A");
    expect(reordered.optionA).toBe("Texto da opção C VERDADEIRA E CORRETA");
    expect(reordered.optionC).toBe("Texto da opção A incorreta");
    expect(reordered.optionB).toBe("Texto da opção B incorreta");
  });
});

