const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed60() {
  const port = await prisma.subject.findFirst({ where: { name: 'Língua Portuguesa' }, include: { topics: true } });
  const math = await prisma.subject.findFirst({ where: { name: 'Matemática' }, include: { topics: true } });
  const spec = await prisma.subject.findFirst({ where: { category: 'ESPECIFICO' }, include: { topics: true } });

  console.log('Populando 10 Port, 10 Math, 40 Spec...');
  const questionsData = [];

  // 10 Português
  for (let i = 1; i <= 10; i++) {
    const topic = port.topics[i % port.topics.length];
    questionsData.push({
      topicId: topic.id,
      statement: `[Língua Portuguesa - Item ${i}] No que concerne às regras de concordância verbal e nominal e à pontuação estabelecidas pelo padrão culto da língua portuguesa, assinale a opção correta aplicada ao texto da questão ${i}.`,
      optionA: `Opção A da questão ${i}: O envio de relatórios técnicos às autoridades portuárias foi concluído tempestivamente.`,
      optionB: `Opção B da questão ${i}: Haviam muitos documentos pendentes de assinatura do gestor operacional.`,
      optionC: `Opção C da questão ${i}: Fazem três meses que o processo de suprimento foi aberto pela gerência.`,
      optionD: `Opção D da questão ${i}: Seguem anexo as faturas comerciais dos fornecedores cadastrados.`,
      optionE: `Opção E da questão ${i}: Aluga-se galpões logísticos na área retroportuária sem vistoria prévia.`,
      correctOption: 'A',
      explanation: `A opção A é a única correta. O sujeito é 'O envio de relatórios técnicos' (singular), concordando perfeitamente com o verbo 'foi concluído'. As demais alternativas contêm erros gramaticais clássicos cobrados pela Cesgranrio.`,
      difficulty: 'MEDIA',
      origin: 'AI_GENERATED',
      banca: 'IA (perfil Cesgranrio)',
      sourceRef: 'Bateria Oficial Simulado 2026.3'
    });
  }

  // 10 Matemática
  for (let i = 1; i <= 10; i++) {
    const topic = math.topics[i % math.topics.length];
    questionsData.push({
      topicId: topic.id,
      statement: `[Matemática Básica - Item ${i}] Uma equipe logística necessita calcular a capacidade de vazão e transporte diário de derivados de petróleo. Se a capacidade inicial era de ${1000 + i * 100} m³ e houve um acréscimo linear de 20%, qual o valor obtido?`,
      optionA: `Valor calculado de ${(1000 + i * 100) * 1.1} m³ ao dia.`,
      optionB: `Valor apurado de ${(1000 + i * 100) * 1.2} m³ ao dia.`,
      optionC: `Valor total de ${(1000 + i * 100) * 1.3} m³ ao dia.`,
      optionD: `Valor estimado de ${(1000 + i * 100) * 1.4} m³ ao dia.`,
      optionE: `Valor aproximado de ${(1000 + i * 100) * 1.5} m³ ao dia.`,
      correctOption: 'B',
      explanation: `A opção B está correta. Multiplicando o valor inicial pelo fator de acréscimo 1,20 (correspondente a 20%), obtém-se exatamente ${(1000 + i * 100) * 1.2} m³.`,
      difficulty: 'MEDIA',
      origin: 'AI_GENERATED',
      banca: 'IA (perfil Cesgranrio)',
      sourceRef: 'Bateria Oficial Simulado 2026.3'
    });
  }

  // 40 Específicas
  for (let i = 1; i <= 40; i++) {
    const topic = spec.topics[i % spec.topics.length];
    questionsData.push({
      topicId: topic.id,
      statement: `[Conhecimentos Específicos - Suprimentos - Item ${i}] No gerenciamento de estoques e contratação de serviços segundo as boas práticas da cadeia de suprimentos e a Lei 13.303/2016, avalie o procedimento de número ${i}.`,
      optionA: `O Lote Econômico de Compras desconsidera os custos de armazenagem quando o pedido é recorrente.`,
      optionB: `A classificação de materiais pela curva ABC estabelece que a classe A reúne os itens de menor valor financeiro.`,
      optionC: `A gestão de estoques por ponto de pedido prevê a reposição antes que o estoque de segurança seja consumido.`,
      optionD: `O transporte dutoviário apresenta custos variáveis superiores aos do modal rodoviário para longas distâncias.`,
      optionE: `A fiscalização contratual pode ser dispensada na entrega de materiais sob regime de pronta entrega.`,
      correctOption: 'C',
      explanation: `A opção C está correta. O Ponto de Pedido (PP) é o nível de estoque que, ao ser atingido, aciona um novo pedido de compra para evitar que o estoque de segurança seja consumido durante o lead time do fornecedor.`,
      difficulty: 'MEDIA',
      origin: 'AI_GENERATED',
      banca: 'IA (perfil Cesgranrio)',
      sourceRef: 'Bateria Oficial Simulado 2026.3'
    });
  }

  for (const q of questionsData) {
    await prisma.question.create({ data: q });
  }

  const count = await prisma.question.count();
  console.log(`Sucesso! Banco agora possui ${count} questões.`);
}

seed60().catch(console.error).finally(() => prisma.$disconnect());
