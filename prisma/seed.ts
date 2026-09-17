import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Script de Seed Oficial - Transpetro 2026.3 (Ênfase 18)
 * Popula a taxonomia do edital sem criar subtópicos artificiais.
 * A estrutura deve permanecer alinhada ao Anexo IV do edital.
 */
async function main() {
  console.log("🌱 Iniciando o Seed Oficial da Transpetro 2026.3...");

  const user = await prisma.user.upsert({
    where: { email: "rafael@estudos.transpetro" },
    update: {},
    create: { name: "Rafael", email: "rafael@estudos.transpetro", targetScore: 47, dailyStudyHours: 2.5, currentStreak: 1, xp: 150, lastStudyDate: new Date() },
  });
  console.log(`✅ Usuário configurado: ${user.name} (Meta: ${user.targetScore}/60 pontos)`);

  await prisma.systemSetting.upsert({
    where: { key: "siteTitle" },
    update: {},
    create: { key: "siteTitle", value: "TRANSPETRO STUDY 2026.3 • Ênfase 18: Suprimento de Bens e Serviços" },
  });
  await prisma.systemSetting.upsert({ where: { key: "examDate" }, update: { value: "2026-12-06" }, create: { key: "examDate", value: "2026-12-06" } });

  const subjectsData = [
    { name: "Língua Portuguesa", category: "BASICO", order: 1, topics: [
      { code: "1", title: "Compreensão de textos de gêneros variados", order: 1 }, { code: "2", title: "Ortografia oficial", order: 2 }, { code: "3", title: "Mecanismos de coesão textual", order: 3 }, { code: "4", title: "Emprego das classes de palavras", order: 4 }, { code: "5", title: "Concordância nominal e verbal", order: 5 }, { code: "6", title: "Emprego do sinal indicativo de crase", order: 6 }, { code: "7", title: "Sinais de pontuação", order: 7 }, { code: "8", title: "Significação das palavras", order: 8 },
    ]},
    { name: "Matemática", category: "BASICO", order: 2, topics: [
      { code: "1", title: "Conjuntos numéricos: naturais, inteiros, racionais e reais; ordem, operações e suas propriedades", order: 1 }, { code: "2", title: "Razão e proporção: regra de três simples e regra de três composta; porcentagem", order: 2 }, { code: "3", title: "Relações, funções: funções polinomiais, exponenciais, logarítmicas e trigonométricas", order: 3 }, { code: "4", title: "Equações: equações do 1º grau, do 2º grau, exponenciais, logarítmicas e sistemas de equações lineares", order: 4 }, { code: "5", title: "Análise combinatória: princípio fundamental da contagem; permutação; arranjo e combinação", order: 5 }, { code: "6", title: "Probabilidade básica: probabilidade em espaços equiprováveis", order: 6 }, { code: "7", title: "Estatística básica: representação tabular e gráfica; medidas de tendência central; medidas de dispersão", order: 7 }, { code: "8", title: "Matemática financeira: juros simples e juros compostos", order: 8 }, { code: "9", title: "Geometria plana: relações métricas no triângulo retângulo; perímetros e áreas", order: 9 }, { code: "10", title: "Geometria espacial: áreas e volumes", order: 10 },
    ]},
    { name: "1. Noções de Administração e Logística", category: "ESPECIFICO", order: 3, topics: [
      { code: "1.1", title: "Planejamento Estratégico, Tático e Operacional", order: 1 }, { code: "1.2", title: "Administração da qualidade", order: 2 }, { code: "1.3", title: "Gestão por processos", order: 3 }, { code: "1.4", title: "Atendimento ao cliente", order: 4 }, { code: "1.5", title: "Indicadores de Desempenho e KPIs logísticos", order: 5 },
    ]},
    { name: "2. Logística e Cadeia de Suprimentos", category: "ESPECIFICO", order: 4, topics: [
      { code: "2.1", title: "Conceitos de Logística e Gerenciamento de Cadeias de Suprimento", order: 1 }, { code: "2.2", title: "Gestão de Compras", order: 2 }, { code: "2.3", title: "Gestão de Estoques e Almoxarifados", order: 3 }, { code: "2.4", title: "Estratégias de Negociação", order: 4 }, { code: "2.5", title: "Noções de Comércio Eletrônico", order: 5 }, { code: "2.6", title: "Seleção e Avaliação de Fornecedores", order: 6 }, { code: "2.7", title: "Modalidades de Transporte", order: 7 }, { code: "2.8", title: "Gestão de Transporte de Cargas", order: 8 }, { code: "2.9", title: "Gestão e Fiscalização de Contratos", order: 9 }, { code: "2.10", title: "Sustentabilidade na Cadeia de Suprimentos", order: 10 }, { code: "2.11", title: "Logística 4.0 e digitalização da cadeia de suprimentos", order: 11 },
    ]},
    { name: "3. Legislação", category: "ESPECIFICO", order: 5, topics: [
      { code: "3.1", title: "Decreto nº 2.745, de 24 de agosto de 1998", description: "Procedimento licitatório simplificado da Petróleo Brasileiro S/A.", officialSource: "Decreto Presidencial nº 2.745/1998", order: 1 }, { code: "3.2", title: "Artigos 28 a 91 da Lei nº 13.303, de 30 de junho de 2016", description: "Estatuto jurídico da empresa pública, da sociedade de economia mista e de suas subsidiárias.", officialSource: "Lei 13.303/2016 (Arts. 28 a 91)", order: 2 }, { code: "3.3", title: "Artigos 42 a 49 da Lei Complementar nº 123, de 14 de dezembro de 2006", description: "Estatuto Nacional da Microempresa e da Empresa de Pequeno Porte aplicado a compras públicas.", officialSource: "LC 123/2006 (Arts. 42 a 49)", order: 3 }, { code: "3.4", title: "Lei nº 14.133/2021", description: "Nova Lei de Licitações e Contratos Administrativos.", officialSource: "Lei 14.133/2021", order: 4 }, { code: "3.5", title: "Regulamento de Licitações e Contratos da Transpetro", description: "Regulamento de Licitações e Contratos da Transpetro (RLCT).", officialSource: "Regulamento de Licitações e Contratos da Transpetro", order: 5 }, { code: "3.6", title: "Lei Geral de Proteção de Dados Pessoais (LGPD) aplicada a contratações públicas", description: "Lei nº 13.709/2018 aplicada no contexto de licitações e contratos.", officialSource: "Lei 13.709/2018", order: 6 },
    ]},
    { name: "4. Noções de Contabilidade e Informática", category: "ESPECIFICO", order: 6, topics: [
      { code: "4.1", title: "Conceitos, Objetivos e finalidades da Contabilidade", order: 1 }, { code: "4.2", title: "Receita, Despesa, Custos e Resultados", order: 2 }, { code: "4.3", title: "Documentos Fiscais, Nota Fiscal de venda de Bens e Serviços", order: 3 }, { code: "4.4", title: "Noções de administração tributária", order: 4 }, { code: "4.5", title: "Noções básicas de Excel, Office 365", order: 5 }, { code: "4.6", title: "Noções básicas de Word, Office 365", order: 6 }, { code: "4.7", title: "Noções básicas do PowerPoint, Office 365", order: 7 },
    ]},
  ];

  let totalTopics = 0;
  for (const sub of subjectsData) {
    let existingSubject = await prisma.subject.findFirst({ where: { name: sub.name } });
    if (!existingSubject) existingSubject = await prisma.subject.create({ data: { name: sub.name, category: sub.category, order: sub.order } });
    for (const top of sub.topics) {
      totalTopics++;
      let existingTopic = await prisma.topic.findFirst({ where: { subjectId: existingSubject.id, code: top.code } });
      const topicData = { title: top.title, description: (top as { description?: string }).description || null, officialSource: (top as { officialSource?: string }).officialSource || null, order: top.order };
      if (!existingTopic) existingTopic = await prisma.topic.create({ data: { subjectId: existingSubject.id, code: top.code, ...topicData } });
      else await prisma.topic.update({ where: { id: existingTopic.id }, data: topicData });
      await prisma.userTopicProgress.upsert({ where: { userId_topicId: { userId: user.id, topicId: existingTopic.id } }, update: {}, create: { userId: user.id, topicId: existingTopic.id, status: "NAO_INICIADO", masteryScore: 0 } });
    }

    // Remove tópicos obsoletos que não constem na taxonomia oficial do edital
    const validCodes = sub.topics.map((t) => t.code);
    const obsoleteTopics = await prisma.topic.findMany({
      where: {
        subjectId: existingSubject.id,
        code: { notIn: validCodes },
      },
    });
    for (const obs of obsoleteTopics) {
      await prisma.userTopicProgress.deleteMany({ where: { topicId: obs.id } });
      await prisma.topic.delete({ where: { id: obs.id } });
      console.log(`🧹 Tópico obsoleto removido: ${obs.code} - ${obs.title}`);
    }
  }
  console.log(`✅ Edital carregado com sucesso! Total de ${subjectsData.length} matérias e ${totalTopics} tópicos cadastrados.`);
}

main().catch((e) => { console.error("❌ Erro durante o Seed:", e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
