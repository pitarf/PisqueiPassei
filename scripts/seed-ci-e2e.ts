import { PrismaClient } from "@prisma/client";
import { createHash } from "crypto";

const prisma = new PrismaClient();

function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function computeStatementHash(statement: string): string {
  return createHash("sha256").update(normalizeText(statement)).digest("hex");
}

async function main() {
  console.log("🌱 [CI-SEED] Iniciando seed determinístico para testes e E2E Playwright...");

  // 1. Garantir Usuário padrão
  const user = await prisma.user.upsert({
    where: { email: "rafael@estudos.transpetro" },
    update: {},
    create: {
      name: "Rafael",
      email: "rafael@estudos.transpetro",
      targetScore: 47,
      dailyStudyHours: 2.5,
      currentStreak: 1,
      xp: 150,
      lastStudyDate: new Date(),
    },
  });
  console.log(`✅ Usuário configurado: ${user.name}`);

  // 2. Configurações de Sistema
  await prisma.systemSetting.upsert({
    where: { key: "siteTitle" },
    update: {},
    create: {
      key: "siteTitle",
      value: "TRANSPETRO STUDY 2026.3 • Ênfase 18: Suprimento de Bens e Serviços",
    },
  });
  await prisma.systemSetting.upsert({
    where: { key: "examDate" },
    update: { value: "2026-12-06" },
    create: { key: "examDate", value: "2026-12-06" },
  });

  // 3. Matérias e Tópicos Oficiais (47 tópicos da Ênfase 18)
  const subjectsData = [
    {
      name: "Língua Portuguesa",
      category: "BASICO",
      order: 1,
      topics: [
        { code: "1", title: "Compreensão de textos de gêneros variados", order: 1 },
        { code: "2", title: "Ortografia oficial", order: 2 },
        { code: "3", title: "Mecanismos de coesão textual", order: 3 },
        { code: "4", title: "Emprego das classes de palavras", order: 4 },
        { code: "5", title: "Concordância nominal e verbal", order: 5 },
        { code: "6", title: "Emprego do sinal indicativo de crase", order: 6 },
        { code: "7", title: "Sinais de pontuação", order: 7 },
        { code: "8", title: "Significação das palavras", order: 8 },
      ],
    },
    {
      name: "Matemática",
      category: "BASICO",
      order: 2,
      topics: [
        { code: "1", title: "Conjuntos numéricos: naturais, inteiros, racionais e reais; ordem, operações e suas propriedades", order: 1 },
        { code: "2", title: "Razão e proporção: regra de três simples e regra de três composta; porcentagem", order: 2 },
        { code: "3", title: "Relações, funções: funções polinomiais, exponenciais, logarítmicas e trigonométricas", order: 3 },
        { code: "4", title: "Equações: equações do 1º grau, do 2º grau, exponenciais, logarítmicas e sistemas de equações lineares", order: 4 },
        { code: "5", title: "Análise combinatória: princípio fundamental da contagem; permutação; arranjo e combinação", order: 5 },
        { code: "6", title: "Probabilidade básica: probabilidade em espaços equiprováveis", order: 6 },
        { code: "7", title: "Estatística básica: representação tabular e gráfica; medidas de tendência central; medidas de dispersão", order: 7 },
        { code: "8", title: "Matemática financeira: juros simples e juros compostos", order: 8 },
        { code: "9", title: "Geometria plana: relações métricas no triângulo retângulo; perímetros e áreas", order: 9 },
        { code: "10", title: "Geometria espacial: áreas e volumes", order: 10 },
      ],
    },
    {
      name: "1. Noções de Administração e Logística",
      category: "ESPECIFICO",
      order: 3,
      topics: [
        { code: "1.1", title: "Planejamento Estratégico, Tático e Operacional", order: 1 },
        { code: "1.2", title: "Administração da qualidade", order: 2 },
        { code: "1.3", title: "Gestão por processos", order: 3 },
        { code: "1.4", title: "Atendimento ao cliente", order: 4 },
        { code: "1.5", title: "Indicadores de Desempenho e KPIs logísticos", order: 5 },
      ],
    },
    {
      name: "2. Logística e Cadeia de Suprimentos",
      category: "ESPECIFICO",
      order: 4,
      topics: [
        { code: "2.1", title: "Conceitos de Logística e Gerenciamento de Cadeias de Suprimento", order: 1 },
        { code: "2.2", title: "Gestão de Compras", order: 2 },
        { code: "2.3", title: "Gestão de Estoques e Almoxarifados", order: 3 },
        { code: "2.4", title: "Estratégias de Negociação", order: 4 },
        { code: "2.5", title: "Noções de Comércio Eletrônico", order: 5 },
        { code: "2.6", title: "Seleção e Avaliação de Fornecedores", order: 6 },
        { code: "2.7", title: "Modalidades de Transporte", order: 7 },
        { code: "2.8", title: "Gestão de Transporte de Cargas", order: 8 },
        { code: "2.9", title: "Gestão e Fiscalização de Contratos", order: 9 },
        { code: "2.10", title: "Sustentabilidade na Cadeia de Suprimentos", order: 10 },
        { code: "2.11", title: "Logística 4.0 e digitalização da cadeia de suprimentos", order: 11 },
      ],
    },
    {
      name: "3. Legislação",
      category: "ESPECIFICO",
      order: 5,
      topics: [
        { code: "3.1", title: "Decreto nº 2.745, de 24 de agosto de 1998", order: 1 },
        { code: "3.2", title: "Artigos 28 a 91 da Lei nº 13.303, de 30 de junho de 2016", order: 2 },
        { code: "3.3", title: "Artigos 42 a 49 da Lei Complementar nº 123, de 14 de dezembro de 2006", order: 3 },
        { code: "3.4", title: "Lei nº 14.133/2021", order: 4 },
        { code: "3.5", title: "Regulamento de Licitações e Contratos da Transpetro", order: 5 },
        { code: "3.6", title: "Lei Geral de Proteção de Dados Pessoais (LGPD) aplicada a contratações públicas", order: 6 },
      ],
    },
    {
      name: "4. Noções de Contabilidade e Informática",
      category: "ESPECIFICO",
      order: 6,
      topics: [
        { code: "4.1", title: "Conceitos, Objetivos e finalidades da Contabilidade", order: 1 },
        { code: "4.2", title: "Receita, Despesa, Custos e Resultados", order: 2 },
        { code: "4.3", title: "Documentos Fiscais, Nota Fiscal de venda de Bens e Serviços", order: 3 },
        { code: "4.4", title: "Noções de administração tributária", order: 4 },
        { code: "4.5", title: "Noções básicas de Excel, Office 365", order: 5 },
        { code: "4.6", title: "Noções básicas de Word, Office 365", order: 6 },
        { code: "4.7", title: "Noções básicas do PowerPoint, Office 365", order: 7 },
      ],
    },
  ];

  const topicMap = new Map<string, string>(); // codeKey -> topicId

  for (const s of subjectsData) {
    let sub = await prisma.subject.findFirst({ where: { name: s.name } });
    if (!sub) sub = await prisma.subject.create({ data: { name: s.name, category: s.category, order: s.order } });

    for (const top of s.topics) {
      let t = await prisma.topic.findFirst({ where: { subjectId: sub.id, code: top.code } });
      if (!t) {
        t = await prisma.topic.create({
          data: {
            subjectId: sub.id,
            code: top.code,
            title: top.title,
            order: top.order,
          },
        });
      }
      topicMap.set(`${s.name}:${top.code}`, t.id);
      await prisma.userTopicProgress.upsert({
        where: { userId_topicId: { userId: user.id, topicId: t.id } },
        update: {},
        create: { userId: user.id, topicId: t.id, status: "NAO_INICIADO", masteryScore: 0 },
      });
    }
  }

  const topicCount = await prisma.topic.count();
  console.log(`✅ Taxonomia pronta: ${topicCount} tópicos.`);

  // 4. Garantir Prova Histórica e Questões Históricas para a página /questoes/historico
  const exam = await prisma.historicalExam.upsert({
    where: { id: "exam-transpetro-2018-01" },
    update: {},
    create: {
      id: "exam-transpetro-2018-01",
      organization: "Transpetro",
      processName: "Processo Seletivo Público 2018.1",
      year: 2018,
      role: "Técnico de Suprimento de Bens e Serviços Júnior",
      emphasis: "Ênfase 18",
      banca: "Fundação Cesgranrio",
      examCode: "TRANSPETRO-2018-18",
      notes: "Prova oficial de referência histórica Cesgranrio.",
    },
  });

  const firstTopicId = Array.from(topicMap.values())[0];
  const histStatement = "No que se refere à interpretação textual e tipologia, o autor do texto expressa claramente uma visão orientada à precisão dos fatos comunicados.";
  await prisma.historicalQuestion.upsert({
    where: { examId_questionNumber: { examId: exam.id, questionNumber: "1" } },
    update: {},
    create: {
      examId: exam.id,
      topicId: firstTopicId,
      questionNumber: "1",
      statementHash: computeStatementHash(histStatement),
      difficulty: "MEDIA",
      questionType: "INTERPRETACAO",
      cognitiveLevel: "COMPREENDER",
      verificationStatus: "APROVADA",
      notes: histStatement,
    },
  });

  // 5. Garantir Estoque Mínimo para Simulado Oficial de 60 Questões (10 Português, 10 Matemática, 40 Específicas)
  const currentQuestionsCount = await prisma.question.count();
  if (currentQuestionsCount < 60) {
    console.log(`📦 Gerando semente determinística de 60 questões (Atual: ${currentQuestionsCount})...`);

    const portTopics = await prisma.topic.findMany({ where: { subject: { name: "Língua Portuguesa" } } });
    const mathTopics = await prisma.topic.findMany({ where: { subject: { name: "Matemática" } } });
    const specTopics = await prisma.topic.findMany({ where: { subject: { category: "ESPECIFICO" } } });

    // 10 Língua Portuguesa
    for (let i = 1; i <= 10; i++) {
      const topic = portTopics[(i - 1) % portTopics.length];
      const statement = `[Simulado Cesgranrio - Português #${i}] No contexto da norma-padrão da Língua Portuguesa para contratos e correspondências oficiais, assinale a opção correta quanto ao uso da linguagem.`;
      const statementHash = computeStatementHash(statement);

      await prisma.question.upsert({
        where: { topicId_statementHash: { topicId: topic.id, statementHash } },
        update: {},
        create: {
          topicId: topic.id,
          statement,
          statementHash,
          optionA: "A concordância verbal e nominal deve obedecer rigorosamente às normas gramaticais estabelecidas.",
          optionB: "O emprego de termos ambíguos é encorajado para flexibilizar prazos contratuais.",
          optionC: "A pontuação pode ser omitida livremente quando o parágrafo possuir mais de cinco linhas.",
          optionD: "O uso de gírias e coloquialismos é admitido em relatórios de auditoria interna.",
          optionE: "A crase é sempre obrigatória antes de qualquer verbo no infinitivo impessoal.",
          correctOption: "A",
          explanation: "A alternativa A é a única gramaticalmente e administrativamente correta.",
          difficulty: "MEDIA",
          origin: "INEDITA_IA",
          banca: "IA (perfil Cesgranrio)",
          sourceRef: "Base determinística de homologação CI/E2E",
          questionType: "APLICACAO",
          cognitiveLevel: "APLICAR",
          subtopic: "Norma Padrão",
          verificationStatus: "APROVADA",
        },
      });
    }

    // 10 Matemática
    for (let i = 1; i <= 10; i++) {
      const topic = mathTopics[(i - 1) % mathTopics.length];
      const statement = `[Simulado Cesgranrio - Matemática #${i}] Uma empresa de logística realizou uma análise de custos operacionais e verificou uma variação percentual proporcional ao volume de transporte no período apurado.`;
      const statementHash = computeStatementHash(statement);

      await prisma.question.upsert({
        where: { topicId_statementHash: { topicId: topic.id, statementHash } },
        update: {},
        create: {
          topicId: topic.id,
          statement,
          statementHash,
          optionA: "O valor total corresponde exatamente ao dobro da razão inicial estipulada em contrato.",
          optionB: "O custo unitário sofre um decréscimo estritamente aritmético sem ganho de escala.",
          optionC: "A taxa percentual acumulada reflete o acréscimo proporcional verificado no período.",
          optionD: "A média aritmética simples resulta em valor nulo para qualquer intervalo considerado.",
          optionE: "O volume mínimo de estocagem anula integralmente as despesas com frete rodoviário.",
          correctOption: "C",
          explanation: "A alternativa C expressa a correlação matemática direta entre taxa e custo operacional.",
          difficulty: "MEDIA",
          origin: "INEDITA_IA",
          banca: "IA (perfil Cesgranrio)",
          sourceRef: "Base determinística de homologação CI/E2E",
          questionType: "CALCULO",
          cognitiveLevel: "APLICAR",
          subtopic: "Matemática Aplicada",
          verificationStatus: "APROVADA",
        },
      });
    }

    // 40 Específicas
    for (let i = 1; i <= 40; i++) {
      const topic = specTopics[(i - 1) % specTopics.length];
      const statement = `[Simulado Cesgranrio - Específicas #${i}] No que concerne às boas práticas de gestão de suprimentos, contratos administrativos e logística integrada na Transpetro, analise a afirmativa técnica correta.`;
      const statementHash = computeStatementHash(statement);

      await prisma.question.upsert({
        where: { topicId_statementHash: { topicId: topic.id, statementHash } },
        update: {},
        create: {
          topicId: topic.id,
          statement,
          statementHash,
          optionA: "A gestão eficiente de compras exige planejamento, seleção criteriosa de fornecedores e fiscalização contínua.",
          optionB: "O inventário físico deve ser dispensado sempre que o sistema digital de almoxarifado estiver operando.",
          optionC: "As contratações de estatais dispensam a publicação de edital em qualquer circunstância de valor.",
          optionD: "A curva ABC classifica como itens do grupo A aqueles de menor relevância financeira para o estoque.",
          optionE: "O lote econômico de compra deve desconsiderar por completo os custos de armazenagem e manutenção.",
          correctOption: "A",
          explanation: "A alternativa A sintetiza com precisão os princípios fundamentais da cadeia de suprimentos e fiscalização contratual.",
          difficulty: "MEDIA",
          origin: "INEDITA_IA",
          banca: "IA (perfil Cesgranrio)",
          sourceRef: "Base determinística de homologação CI/E2E",
          questionType: "CASO_PRATICO",
          cognitiveLevel: "ANALISAR",
          subtopic: "Gestão e Legislação de Suprimentos",
          verificationStatus: "APROVADA",
        },
      });
    }
  }

  // 6. Garantir Flashcard para /flashcards
  const flashcardCount = await prisma.flashcard.count();
  if (flashcardCount === 0 && firstTopicId) {
    const card = await prisma.flashcard.create({
      data: {
        topicId: firstTopicId,
        front: "Qual o prazo de validade das propostas segundo o Regulamento da Transpetro?",
        back: "O prazo usual previsto em edital é de 60 (sessenta) dias, salvo disposição expressa em contrário.",
      },
    });

    await prisma.flashcardReview.create({
      data: {
        userId: user.id,
        flashcardId: card.id,
        rating: "BOM",
        intervalDays: 1,
        nextReviewDate: new Date(),
      },
    });
  }

  // 7. Garantir Aula para /aula/[topicId]
  const lessonCount = await prisma.lesson.count();
  if (lessonCount === 0 && firstTopicId) {
    await prisma.lesson.create({
      data: {
        topicId: firstTopicId,
        title: "Fundamentos de Suprimentos e Compreensão Textual Cesgranrio",
        contentJson: { summary: "Aula inaugural com foco nas exigências práticas do concurso Transpetro 2026.3." },
        rawMarkdown: "# Introdução ao Estudo Dirigido\n\nNesta aula estruturada abordamos os conceitos essenciais da disciplina.",
      },
    });
  }

  const finalQuestionsCount = await prisma.question.count();
  console.log(`🎉 [CI-SEED] Concluído com sucesso! Total de questões no banco: ${finalQuestionsCount}`);
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed determinístico:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
