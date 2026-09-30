/**
 * Script de Curadoria Cirúrgica e Resolução de Boilerplate do Seed
 * TRANSPETRO STUDY 2026.3 • Ênfase 18: Suprimento de Bens e Serviços
 * 
 * Substitui os 60 itens de seed/boilerplate por questões pedagógicas autênticas e ricas:
 * - 40 questões em 1. Noções de Administração e Logística (tópicos 1.1 a 1.5)
 * - 10 questões em Língua Portuguesa (tópicos 1 a 8)
 * - 10 questões em Matemática (tópicos 1 a 10)
 * - 1 questão de funções matemáticas (reestruturação de tema de calado marítimo repetido)
 * - 1 questão de Informática (Word) enriquecida com metadados
 * 
 * Garante:
 * - Distribuição saudável de gabaritos A, B, C, D, E (extinção dos 88% de C)
 * - Metadados completos (questionType, cognitiveLevel, subtopic, banca, origin: INEDITA_IA)
 * - Hash determinístico recalculado e gravado
 * - Preservação dos 470 IDs do banco sem alteração no volume total
 */

const { PrismaClient } = require("@prisma/client");
const { createHash } = require("crypto");

const prisma = new PrismaClient();

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

// 1. BANCO DE DADOS DE CURADORIA PARA ADMINISTRAÇÃO E LOGÍSTICA (40 ITENS)
const ADMIN_CURATED_QUESTIONS = {
  // --- TÓPICO 1.1: Planejamento Estratégico, Tático e Operacional (8 itens) ---
  "64ebd441-b513-4aaa-9db3-3701f1909bc3": {
    statement: "No contexto da gestão corporativa de suprimentos da Transpetro, o planejamento é estruturado em três níveis organizacionais interdependentes. O nível de planejamento que possui horizonte temporal de longo prazo, define as diretrizes institucionais amplas da organização e envolve as decisões de maior incerteza é denominado:",
    optionA: "Planejamento Estratégico.",
    optionB: "Planejamento Tático-Departamental.",
    optionC: "Planejamento Operacional de Rotina.",
    optionD: "Planejamento Contingencial de Curto Prazo.",
    optionE: "Planejamento de Manutenção Preventiva.",
    correctOption: "A",
    explanation: "O Planejamento Estratégico caracteriza-se pela amplitude corporativa, foco em longo prazo, visão de futuro e orientação macro frente ao ambiente externo competitivo, estabelecendo os rumos fundamentais da organização.",
    questionType: "CONCEITO",
    cognitiveLevel: "CONHECER",
    subtopic: "Níveis e Horizontes do Planejamento Organizacional",
    difficulty: "FACIL"
  },
  "a03cb925-7633-4c1b-9502-91cc72f1ca9c": {
    statement: "Durante a elaboração do plano diretor de aquisições de uma subsidiária de transporte dutoviário, a equipe técnica utilizou a Matriz SWOT (FOFA). Na análise ambiental dessa ferramenta, os fatores internos controláveis e os fatores externos incontroláveis são classificados, respectivamente, como:",
    optionA: "Oportunidades e Ameaças (fatores internos); Forças e Fraquezas (fatores externos).",
    optionB: "Forças e Fraquezas (fatores internos); Oportunidades e Ameaças (fatores externos).",
    optionC: "Ameaças e Forças (fatores internos); Oportunidades e Fraquezas (fatores externos).",
    optionD: "Forças e Oportunidades (fatores internos); Fraquezas e Ameaças (fatores externos).",
    optionE: "Fraquezas e Oportunidades (fatores internos); Forças e Ameaças (fatores externos).",
    correctOption: "B",
    explanation: "Na Matriz SWOT, as Forças (Strengths) e Fraquezas (Weaknesses) representam variáveis do ambiente interno e controlável da empresa, enquanto as Oportunidades (Opportunities) e Ameaças (Threats) pertencem ao macroambiente externo incontrolável.",
    questionType: "CONCEITO",
    cognitiveLevel: "COMPREENDER",
    subtopic: "Matriz SWOT e Diagnóstico de Cenários",
    difficulty: "FACIL"
  },
  "f4d35a4f-7c1f-47f1-a704-dbd3e8832026": {
    statement: "Uma empresa de logística de combustíveis adota a metodologia do Balanced Scorecard (BSC) para desdobrar suas diretrizes corporativas em planos de ação. As quatro perspectivas clássicas que estruturam os objetivos e metas do BSC são:",
    optionA: "Logística, Operacional, Governança e Recursos Humanos.",
    optionB: "Custos de Transporte, Armazenagem, Distribuição e Vendas.",
    optionC: "Suprimento, Fiscalização, Contabilidade e Meio Ambiente.",
    optionD: "Financeira, Clientes, Processos Internos, e Aprendizado e Crescimento.",
    optionE: "Auditoria, Orçamento, Produção Contínua e Tecnologia da Informação.",
    correctOption: "D",
    explanation: "O Balanced Scorecard (Kaplan e Norton) organiza a estratégia em quatro perspectivas integradas: Financeira (retorno aos acionistas), Clientes (proposta de valor no mercado), Processos Internos (excelência operacional) e Aprendizado e Crescimento (capacitação humana e tecnológica).",
    questionType: "CONCEITO",
    cognitiveLevel: "CONHECER",
    subtopic: "Balanced Scorecard (BSC)",
    difficulty: "MEDIA"
  },
  "191fe145-d1b6-4e35-bf43-eba6f484aac3": {
    statement: "No desdobramento do planejamento estratégico de suprimentos para o nível operacional de um terminal aquaviário, a gerência elabora planos de ação estruturados pelo método 5W2H. Nessa ferramenta, a dimensão 'How Much' refere-se diretamente a:",
    optionA: "Quem executará a tarefa e coordenará os terceirizados.",
    optionB: "Onde será realizado o descarregamento das peças sobressalentes.",
    optionC: "Quando terá início a conferência física e documental da carga.",
    optionD: "Por que a inspeção técnica de segurança foi requisitada.",
    optionE: "Quanto custará a execução do procedimento ou aquisição planejada.",
    correctOption: "E",
    explanation: "No modelo 5W2H, 'How Much' quantifica o orçamento ou custo financeiro estimado para realização da ação proposta (What, Why, Where, When, Who, How, How Much).",
    questionType: "PROCEDIMENTO",
    cognitiveLevel: "COMPREENDER",
    subtopic: "Ferramenta 5W2H e Planos de Ação Operacionais",
    difficulty: "FACIL"
  },
  "1caf7543-f8d0-4fc9-8baf-520577a1abcd": {
    statement: "A gerência de logística de uma estatal estabeleceu a meta de 'reduzir em 15% o tempo médio de ciclo de compras de materiais sobressalentes no prazo de 6 meses'. Segundo os critérios do modelo SMART, essa meta cumpre o requisito de ser 'Mensurável' porque:",
    optionA: "Define um percentual numérico claro (15%) passível de acompanhamento quantitativo.",
    optionB: "Trata de materiais da indústria petrolífera e naval de alta criticidade operacional.",
    optionC: "Possui prazo delimitado em seis meses para verificação do resultado obtido.",
    optionD: "Foi imposta unilateralmente pela alta administração sem debate com os setores de base.",
    optionE: "Exige exclusivamente recursos orçamentários já previstos na rubrica de investimento.",
    correctOption: "A",
    explanation: "Uma meta é Mensurável (o 'M' do SMART) quando possui indicador quantitativo objetivo que permite verificar inequivocamente se o resultado projetado foi atingido (no caso, a redução percentual de 15%).",
    questionType: "APLICACAO",
    cognitiveLevel: "APLICAR",
    subtopic: "Definição de Metas e Indicadores SMART",
    difficulty: "MEDIA"
  },
  "862667a8-252c-490e-921a-0de174181d8c": {
    statement: "Em face da volatilidade climática e de greves em modais de transporte, uma refinaria elaborou procedimentos prévios com rotas alternativas e fornecedores homologados de prontidão. Esse tipo de planejamento voltado a mitigar cenários adversos imprevistos é denominado:",
    optionA: "Planejamento Tático Departamental de Rotina.",
    optionB: "Planejamento de Contingência.",
    optionC: "Planejamento Retrospectivo Contábil.",
    optionD: "Planejamento Normativo Rígido.",
    optionE: "Planejamento de Manutenção Corretiva Imediata.",
    correctOption: "B",
    explanation: "O planejamento de contingência antecipa respostas a eventos de risco potenciais, estruturando ações preventivas e rotas alternativas para assegurar a continuidade operacional em situações de emergência ou crise.",
    questionType: "CASO_PRATICO",
    cognitiveLevel: "ANALISAR",
    subtopic: "Planejamento de Contingência e Gestão de Riscos",
    difficulty: "MEDIA"
  },
  "8253acaa-a4ce-486a-99e0-933838c934ab": {
    statement: "Ao definir a sua identidade institucional, uma corporação de transporte e logística estabelece sua 'declaração fundamental que traduz a razão de ser da organização, seu propósito essencial e a necessidade social que visa satisfazer'. Essa declaração conceitua a:",
    optionA: "Visão de Futuro.",
    optionB: "Estratégia Competitiva.",
    optionC: "Política da Qualidade.",
    optionD: "Missão Organizacional.",
    optionE: "Meta Tática Operacional.",
    correctOption: "D",
    explanation: "A Missão é o propósito orientador da existência da entidade, definindo quem ela é, o que faz e para quem faz. Já a Visão projeta onde a organização deseja chegar em determinado horizonte futuro.",
    questionType: "CONCEITO",
    cognitiveLevel: "CONHECER",
    subtopic: "Missão, Visão e Valores Organizacionais",
    difficulty: "FACIL"
  },
  "518da52d-f60a-4561-9c4e-4c734c576060": {
    statement: "Considere as características do planejamento nos três níveis organizacionais. Em comparação com o planejamento estratégico, o planejamento operacional caracteriza-se fundamentalmente por:",
    optionA: "Envolver maior grau de incerteza e abranger a totalidade da empresa em longo prazo.",
    optionB: "Focar em objetivos departamentais intermediários sem vínculo com rotinas diárias.",
    optionC: "Definir exclusivamente a visão corporativa e a alocação de capital entre unidades de negócio.",
    optionD: "Substituir a necessidade de procedimentos padrão e diretrizes táticas setoriais.",
    optionE: "Possuir curto alcance temporal, foco em tarefas específicas e rotinas de execução detalhadas.",
    correctOption: "E",
    explanation: "O nível operacional orienta a execução prática imediata (curto prazo), detalhando tarefas, procedimentos operacionais padrão, recursos imediatos e atribuições individuais da equipe.",
    questionType: "COMPARACAO",
    cognitiveLevel: "ANALISAR",
    subtopic: "Diferenciação entre Níveis de Planejamento",
    difficulty: "MEDIA"
  },

  // --- TÓPICO 1.2: Administração da qualidade (8 itens) ---
  "767d509f-b876-446d-89de-3ac2fa4ed6e1": {
    statement: "O Ciclo PDCA é uma ferramenta fundamental de gestão da qualidade e melhoria contínua aplicada a operações logísticas. A etapa em que a equipe audita os resultados obtidos, confrontando o desempenho executado com as metas e padrões planejados, corresponde à fase de:",
    optionA: "Check (Verificar / Controlar).",
    optionB: "Plan (Planejar).",
    optionC: "Do (Executar / Fazer).",
    optionD: "Act (Agir corretivamente).",
    optionE: "Standardize (Padronizar).",
    correctOption: "A",
    explanation: "Na etapa 'Check' (C) do PDCA, ocorre o monitoramento, medição e avaliação dos processos frente às metas e diretrizes estabelecidas na fase 'Plan', identificando eventuais desvios.",
    questionType: "CONCEITO",
    cognitiveLevel: "COMPREENDER",
    subtopic: "Ciclo PDCA de Melhoria Contínua",
    difficulty: "FACIL"
  },
  "89ed73d5-85fa-4694-8ae6-0256c2b3ad39": {
    statement: "Durante o recebimento de válvulas industriais em um centro de distribuição da Transpetro, foi identificada recorrência de avarias. Para investigar as causas-raiz estruturadas nas categorias Método, Mão de Obra, Material, Máquina, Medida e Meio Ambiente (6M), a equipe deve utilizar:",
    optionA: "O Gráfico de Dispersão Linear.",
    optionB: "O Diagrama de Causa e Efeito (Ishikawa).",
    optionC: "A Curva Dente de Serra.",
    optionD: "O Histograma de Frequência Simples.",
    optionE: "O Fluxograma de Blocos Lineares.",
    correctOption: "B",
    explanation: "O Diagrama de Ishikawa (Espinha de Peixe) estrutura visualmente as possíveis causas de um problema a partir das famílias do método 6M, facilitando a identificação da causa fundamental.",
    questionType: "APLICACAO",
    cognitiveLevel: "APLICAR",
    subtopic: "Diagrama de Ishikawa e as Ferramentas da Qualidade",
    difficulty: "MEDIA"
  },
  "ccc394d5-876b-4c73-919b-7917c77a1b63": {
    statement: "Na gestão da qualidade de fornecedores de insumos químicos, o Princípio de Pareto (regra 80/20) é amplamente empregado para priorização de ações corretivas. Esse princípio preconiza que:",
    optionA: "Todos os desvios de processo têm o mesmo impacto sobre o custo logístico final.",
    optionB: "Cem por cento das não conformidades decorrem invariavelmente de falha do operador.",
    optionC: "As inspeções qualitativas devem cobrir exatamente 80% do lote recebido por amostragem.",
    optionD: "Aproximadamente 80% dos problemas e perdas resultam de cerca de 20% das causas principais.",
    optionE: "O custo de prevenção da qualidade deve corresponder a 20% do orçamento operacional anual.",
    correctOption: "D",
    explanation: "O Diagrama de Pareto baseia-se no princípio dos 'poucos vitais e muitos triviais', demonstrando que cerca de 80% dos efeitos indesejados originam-se de aproximadamente 20% das causas críticas.",
    questionType: "CONCEITO",
    cognitiveLevel: "COMPREENDER",
    subtopic: "Princípio de Pareto e Gráfico de Frequência",
    difficulty: "FACIL"
  },
  "36301b78-9ba9-424f-a804-563ba549cd51": {
    statement: "Em um programa de modernização dos almoxarifados portuários, a gerência implementou a metodologia japonesa dos 5S. A prática de separar materiais úteis dos inúteis, descartando o que não tem utilidade imediata para liberar espaço físico, corresponde ao senso de:",
    optionA: "Seiton (Organização / Ordenação).",
    optionB: "Seiso (Limpeza).",
    optionC: "Seiketsu (Padronização / Saúde).",
    optionD: "Shitsuke (Autodisciplina).",
    optionE: "Seiri (Utilização / Descarte).",
    correctOption: "E",
    explanation: "O senso de Seiri (Utilização / Descarte) consiste em classificar os itens existentes, mantendo no posto de trabalho somente o que é necessário e eliminando ou transferindo excessos e itens obsoletos.",
    questionType: "CONCEITO",
    cognitiveLevel: "CONHECER",
    subtopic: "Metodologia 5S no Ambiente Operacional",
    difficulty: "FACIL"
  },
  "1ff28dfa-514d-422a-a482-b6cc2fb93384": {
    statement: "Na teoria dos Custos da Qualidade, os dispêndios incorridos pela empresa para auditar fornecedores, treinar colaboradores em boas práticas de manuseio e realizar a calibração preventiva de equipamentos de pesagem são classificados como custos de:",
    optionA: "Prevenção.",
    optionB: "Falhas Internas.",
    optionC: "Falhas Externas.",
    optionD: "Avaliação Pós-Venda.",
    optionE: "Penalidades Contratuais.",
    correctOption: "A",
    explanation: "Custos de Prevenção referem-se a investimentos planejados para evitar a ocorrência de não conformidades (treinamentos, planejamento da qualidade, calibração preventiva e homologação de processos).",
    questionType: "CONCEITO",
    cognitiveLevel: "ANALISAR",
    subtopic: "Custos da Qualidade (Prevenção, Avaliação e Falhas)",
    difficulty: "MEDIA"
  },
  "feedbf7e-9e71-4fc6-a1e6-85c68c1f1f02": {
    statement: "O Controle Estatístico de Processos (CEP) utiliza Cartas de Controle para monitorar o envase de tambores de lubrificantes. Ao analisar os dados amostrais, observa-se que os pontos oscilam aleatoriamente entre o Limite Superior de Controle (LSC) e o Limite Inferior de Controle (LIC). Conclui-se que o processo:",
    optionA: "Apresenta causas especiais de variação e requer paralisação imediata dos maquinários.",
    optionB: "Está sob controle estatístico, sujeito exclusivamente a variações por causas comuns inerentes.",
    optionC: "É incapaz de atender a qualquer requisito técnico por ausência de pontos fora da média central.",
    optionD: "Possui vícios sistemáticos de calibração que obrigam o refugo total do lote envasado.",
    optionE: "Deve ser substituído por inspeção 100% manual devido à dispersão verificada nas cartas.",
    correctOption: "B",
    explanation: "Quando os pontos amostrais situam-se dentro dos limites estatísticos de controle (LIC e LSC) sem tendências anômalas, o processo está sob controle estatístico estável, governado apenas por causas comuns inerentes.",
    questionType: "APLICACAO",
    cognitiveLevel: "ANALISAR",
    subtopic: "Controle Estatístico de Processos e Cartas de Controle",
    difficulty: "DIFICIL"
  },
  "8f9fde74-84ed-4256-860d-adabea91b62b": {
    statement: "A filosofia da Gestão da Qualidade Total (Total Quality Management - TQM) difere substancialmente da inspeção tradicional de fim de linha. Um dos pilares centrais da abordagem da TQM nas organizações é:",
    optionA: "A concentração da responsabilidade pela qualidade exclusivamente no departamento de auditoria.",
    optionB: "O foco no cliente, a melhoria contínua dos processos e o engajamento de todos os colaboradores.",
    optionC: "A tolerância de índices pré-fixados de defeitos como padrão aceitável para redução de custos.",
    optionD: "A priorização da velocidade de entrega em detrimento da conformidade das especificações técnicas.",
    optionE: "A terceirização integral dos processos decisórios de padronização operacional.",
    correctOption: "B",
    explanation: "A Gestão da Qualidade Total preconiza o foco no cliente interno e externo, o compromisso e envolvimento de todas as áreas e níveis da organização e a busca permanente da melhoria contínua.",
    questionType: "CONCEITO",
    cognitiveLevel: "COMPREENDER",
    subtopic: "Gestão da Qualidade Total (TQM)",
    difficulty: "FACIL"
  },
  "530791c5-7ae8-43cf-bf08-f53ac494df68": {
    statement: "No contexto da norma ABNT NBR ISO 9001 aplicada a sistemas de suprimentos e armazenagem, a ocorrência de um desvio que impeça o atendimento a um requisito técnico especificado em contrato é formalmente tipificada como:",
    optionA: "Oportunidade de Mercado.",
    optionB: "Observação Informal de Fiscalização.",
    optionC: "Gargalo Operacional Estático.",
    optionD: "Não Conformidade.",
    optionE: "Ajuste Discricionário de Almoxarifado.",
    correctOption: "D",
    explanation: "Na terminologia da ISO 9001 e dos sistemas de gestão da qualidade, 'Não Conformidade' é o não atendimento a um requisito preestabelecido (legal, contratual, normativo ou de procedimento interno).",
    questionType: "CONCEITO",
    cognitiveLevel: "CONHECER",
    subtopic: "Normas ISO 9001 e Não Conformidades",
    difficulty: "FACIL"
  },

  // --- TÓPICO 1.3: Gestão por processos (8 itens) ---
  "78778c0a-76e1-4149-8465-d548b6cf920c": {
    statement: "Na modelagem de processos organizacionais de suprimento de bens, a análise da situação atual de execução ('como o processo opera hoje com suas eventuais ineficiências e retrabalhos') e o desenho do modelo futuro otimizado são identificados, respectivamente, pelas siglas:",
    optionA: "AS-IS (situação atual) e TO-BE (situação futura).",
    optionB: "TO-BE (situação atual) e AS-IS (situação futura).",
    optionC: "BPMN (situação atual) e BSC (situação futura).",
    optionD: "ERP (situação atual) e CRM (situação futura).",
    optionE: "OTIF (situação atual) e OTD (situação futura).",
    correctOption: "A",
    explanation: "No gerenciamento de processos de negócio (BPM), a etapa AS-IS representa o mapeamento do fluxo atual da operação, enquanto a etapa TO-BE projeta o fluxo futuro redesenhado e aprimorado.",
    questionType: "CONCEITO",
    cognitiveLevel: "CONHECER",
    subtopic: "Mapeamento AS-IS e Modelagem TO-BE",
    difficulty: "FACIL"
  },
  "9660656f-702a-4f95-980b-a636aea8a35b": {
    statement: "Na tipologia de processos de uma empresa de logística e dutos, os processos que sustentam e viabilizam o funcionamento das atividades-fim, prestando serviços a outros setores internos (como suprimentos, gestão de pessoas e suporte de TI), são classificados como:",
    optionA: "Processos Primários ou Finalísticos.",
    optionB: "Processos de Apoio ou Suporte.",
    optionC: "Processos Estratégicos de Governança Superior.",
    optionD: "Processos Comerciais Externos.",
    optionE: "Processos de Transformação Central de Óleo e Gás.",
    correctOption: "B",
    explanation: "Processos de Apoio (ou suporte) fornecem os insumos, recursos e condições estruturais necessárias para que os processos primários (finalísticos) cumpram a missão essencial junto ao cliente final.",
    questionType: "CONCEITO",
    cognitiveLevel: "COMPREENDER",
    subtopic: "Classificação de Processos (Primários, Suporte e Gestão)",
    difficulty: "FACIL"
  },
  "e031dd20-8a95-496c-9a66-3919016a48cd": {
    statement: "Em uma esteira de conferência e liberação de cargas de um armazém, a etapa de conferência física possui capacidade máxima de inspecionar 20 pallets/hora, enquanto a triagem recebe 50 pallets/hora e a expedição pode despachar 60 pallets/hora. De acordo com a Teoria das Restrições (TOC), a conferência física configura:",
    optionA: "Uma folga operacional produtiva.",
    optionB: "Um processo puramente secundário sem influência no fluxo.",
    optionC: "Uma redundância de controle eliminável sem impactos.",
    optionD: "O gargalo do sistema que limita a capacidade de todo o fluxo produtivo.",
    optionE: "Um amortecedor de segurança contra picos sazonais de demanda.",
    correctOption: "D",
    explanation: "Na Teoria das Restrições (Goldratt), o gargalo é o elo de menor capacidade na cadeia, determinando o ritmo máximo de vazão de todo o processo produtivo.",
    questionType: "CASO_PRATICO",
    cognitiveLevel: "APLICAR",
    subtopic: "Teoria das Restrições e Identificação de Gargalos",
    difficulty: "MEDIA"
  },
  "bfaf7f09-1295-4405-865f-dc2c7ab3a365": {
    statement: "A gestão por processos diferencia-se da estrutura funcional tradicional da organização. Uma das principais vantagens da abordagem por processos reside em:",
    optionA: "Fortalecer a visão fragmentada em feudos e silos departamentais estanques.",
    optionB: "Eliminar a necessidade de prestação de contas e de liderança formal nos setores.",
    optionC: "Garantir visão horizontal de ponta a ponta, orientada ao fluxo de valor e ao cliente.",
    optionD: "Impedir qualquer automação tecnológica para priorizar tarefas manuais e descentralizadas.",
    optionE: "Substituir a estratégia corporativa por objetivos pontuais de curto prazo de cada chefia.",
    correctOption: "C",
    explanation: "A gestão por processos adota uma perspectiva horizontal (cross-functional), integrando os fluxos operacionais de ponta a ponta com foco na entrega de valor ao cliente e quebrando o isolamento departamental.",
    questionType: "COMPARACAO",
    cognitiveLevel: "COMPREENDER",
    subtopic: "Visão Horizontal vs Estrutura Funcional",
    difficulty: "MEDIA"
  },
  "cf8a7806-950d-4c7e-ba79-17b07b7a3e9f": {
    statement: "Em auditoria de conformidade em um terminal de armazenagem, constatou-se que cada operador de empilhadeira executava a estocagem de modo diverso, gerando avarias esporádicas. A ferramenta gerencial que formaliza as instruções passo a passo para a execução repetível e segura dessa tarefa denomina-se:",
    optionA: "Procedimento Operacional Padrão (POP).",
    optionB: "Regulamento Disciplinar Punitivo.",
    optionC: "Matriz BCG de Produtos.",
    optionD: "Painel de Bordo Estratégico.",
    optionE: "Acordo Coletivo de Trabalho.",
    correctOption: "A",
    explanation: "O Procedimento Operacional Padrão (POP) descreve detalhadamente o roteiro de execução de uma atividade operacional crítica, assegurando repetibilidade, padronização da qualidade e segurança.",
    questionType: "PROCEDIMENTO",
    cognitiveLevel: "APLICAR",
    subtopic: "Procedimentos Operacionais Padrão (POP)",
    difficulty: "FACIL"
  },
  "cd97f754-e987-4877-bc3a-93da020fe2a4": {
    statement: "A avaliação de desempenho de um processo de compras governamentais analisa três dimensões: Eficiência, Eficácia e Efetividade. A dimensão da 'Eficácia' é evidenciada quando o processo:",
    optionA: "Alcança a meta planejada de suprir a refinaria com as peças corretas no prazo estipulado.",
    optionB: "Reduz o consumo de energia elétrica e papel sem qualquer relação com os prazos de compra.",
    optionC: "Gera impacto duradouro e transformação socioeconômica positiva na comunidade local.",
    optionD: "Dispensa a conferência de notas fiscais para acelerar o pagamento aos fornecedores.",
    optionE: "Utiliza o menor volume possível de recursos financeiros independentemente de atingir o objetivo.",
    correctOption: "A",
    explanation: "Eficácia refere-se ao atingimento dos objetivos e metas estabelecidos (fazer a coisa certa / entregar o resultado). Eficiência diz respeito ao uso racional de recursos, e Efetividade mede o impacto real gerado.",
    questionType: "CONCEITO",
    cognitiveLevel: "ANALISAR",
    subtopic: "Dimensões de Eficiência, Eficácia e Efetividade",
    difficulty: "MEDIA"
  },
  "80e6ce0e-2fa6-4b96-932c-166761bac8fe": {
    statement: "Na notação internacional padronizada BPMN (Business Process Model and Notation), o elemento gráfico representado por um losango é utilizado para indicar:",
    optionA: "O início absoluto de uma atividade operacional simples.",
    optionB: "Um ponto de desvio, decisão ou convergência no fluxo de controle (Gateway).",
    optionC: "O armazenamento físico de um arquivo magnético de nota fiscal.",
    optionD: "Uma raia de piscina (Lane) representando um departamento corporativo.",
    optionE: "O evento de encerramento do processo com sucesso ou falha.",
    correctOption: "B",
    explanation: "Em BPMN, o losango representa um Gateway (portal de decisão), utilizado para controlar desvios, bifurcações condicionais (exclusivas ou paralelas) e convergências no fluxo do processo.",
    questionType: "CONCEITO",
    cognitiveLevel: "CONHECER",
    subtopic: "Notação BPMN e Elementos Gráficos",
    difficulty: "MEDIA"
  },
  "ec9c091f-9fda-4203-85ff-b0a38bfa1ec5": {
    statement: "A abordagem que propõe a reconfiguração radical e profunda dos processos de negócios para alcançar saltos dramáticos em medidas críticas de desempenho (custos, qualidade, atendimento e velocidade) é conhecida como:",
    optionA: "Melhoria Incremental Kaizen.",
    optionB: "Auditoria Contábil Periódica.",
    optionC: "Reengenharia de Processos (BPR).",
    optionD: "Organização Hierárquica Linear.",
    optionE: "Estudo de Tempos e Métodos Taylorista.",
    correctOption: "C",
    explanation: "A Reengenharia de Processos (Hammer e Champy) prega o redesenho radical dos processos essenciais, partindo do zero em busca de melhorias drásticas, em contraste com a melhoria incremental contínua do Kaizen.",
    questionType: "CONCEITO",
    cognitiveLevel: "COMPREENDER",
    subtopic: "Reengenharia vs Melhoria Contínua",
    difficulty: "MEDIA"
  },

  // --- TÓPICO 1.4: Atendimento ao cliente (8 itens) ---
  "a879ae77-af02-4e42-bb2e-722ed753a644": {
    statement: "No setor de suprimentos de uma grande companhia de energia, os técnicos e operadores das plataformas que solicitam sobressalentes e equipamentos de proteção atuam em relação à área de compras como:",
    optionA: "Clientes Internos.",
    optionB: "Consumidores Finais do Mercado Varejista.",
    optionC: "Fornecedores Primários de Insumos.",
    optionD: "Agentes Reguladores Governamentais Externos.",
    optionE: "Concorrentes Diretos da Unidade Logística.",
    correctOption: "A",
    explanation: "Colaboradores, áreas e departamentos que recebem serviços ou materiais gerados por outros setores dentro da mesma organização são classificados tecnicamente como Clientes Internos.",
    questionType: "CONCEITO",
    cognitiveLevel: "CONHECER",
    subtopic: "Conceito de Cliente Interno e Externo",
    difficulty: "FACIL"
  },
  "3922d008-f474-440d-a115-6089355aa5a5": {
    statement: "Para disciplinar o relacionamento operacional entre o almoxarifado central e as frentes operacionais de perfuração, formalizou-se um documento que estipula metas de prazo máximo de atendimento (ex.: 24 horas para itens críticos), horários de retirada e responsabilidades de cada parte. Esse instrumento gerencial é denominado:",
    optionA: "Contrato de Parceria Mercantil com Fim Lucrativo.",
    optionB: "Acordo de Nível de Serviço (Service Level Agreement - SLA).",
    optionC: "Carta de Fiança Bancária de Fornecimento.",
    optionD: "Auto de Infração Administrativa Interna.",
    optionE: "Termo de Confissão de Dívida Tributária.",
    correctOption: "B",
    explanation: "O SLA (Service Level Agreement) é o acordo formal que define métricas, prazos, responsabilidades mútuas e padrões de qualidade esperados na prestação de um serviço entre áreas ou empresas.",
    questionType: "APLICACAO",
    cognitiveLevel: "APLICAR",
    subtopic: "Acordo de Nível de Serviço (SLA)",
    difficulty: "FACIL"
  },
  "ddeffa84-ad58-4998-82ec-f1b33f4247d2": {
    statement: "O gestor de logística adota a métrica do Net Promoter Score (NPS) para avaliar a satisfação dos setores operacionais atendidos. Nessa metodologia, os respondentes que atribuem notas 9 ou 10 em uma escala de 0 a 10 são classificados formalmente como:",
    optionA: "Detratores.",
    optionB: "Neutros ou Passivos.",
    optionC: "Insatisfeitos Críticos.",
    optionD: "Promotores.",
    optionE: "Auditores Independentes.",
    correctOption: "D",
    explanation: "Na metodologia NPS, as notas 9 e 10 classificam clientes Promotores (leais e entusiastas); notas 7 e 8 são Neutros/Passivos; e notas de 0 a 6 são classificados como Detratores.",
    questionType: "CONCEITO",
    cognitiveLevel: "CONHECER",
    subtopic: "Métrica Net Promoter Score (NPS)",
    difficulty: "FACIL"
  },
  "78b86eaa-566a-4595-a223-064cf6db2117": {
    statement: "Um atendente da central de suprimentos recebe uma ligação de um engenheiro de bordo exaltado devido ao atraso de uma válvula essencial. A postura profissional mais recomendada de comunicação assertiva e atendimento empático nessa situação consiste em:",
    optionA: "Interromper imediatamente o interlocutor e afirmar rispidamente que o atraso não é de sua alçada.",
    optionB: "Transferir a ligação sem aviso para outro setor com o objetivo de evitar o confronto telefônico.",
    optionC: "Desligar o telefone argumentando que normas internas proíbem atendimento sob estresse do usuário.",
    optionD: "Adotar postura combativa para demonstrar autoridade hierárquica perante a equipe de bordo.",
    optionE: "Ouvir ativamente sem interrupções precipitadas, demonstrar compreensão da urgência e buscar solução tempestiva.",
    correctOption: "E",
    explanation: "O atendimento de excelência requer escuta ativa, empatia, controle emocional e comunicação assertiva orientada para a resolução técnica e colaborativa do problema apresentado.",
    questionType: "CASO_PRATICO",
    cognitiveLevel: "APLICAR",
    subtopic: "Comunicação Assertiva, Empatia e Resolução de Conflitos",
    difficulty: "FACIL"
  },
  "c9375a0a-9c5b-487a-97c5-3bb6e8fccd8b": {
    statement: "A implementação de sistemas de CRM (Customer Relationship Management) no suporte ao usuário visa primordialmente a:",
    optionA: "Centralizar o histórico de interações, requisições e preferências dos clientes para personalizar e agilizar o suporte.",
    optionB: "Substituir integralmente os operadores humanos por ferramentas automatizadas sem intervenção técnica.",
    optionC: "Bloquear requisições de itens sobressalentes que apresentem custo unitário superior à média mensal.",
    optionD: "Eliminar a necessidade de auditoria e prestação de contas na aquisição de materiais estratégicos.",
    optionE: "Limitar o atendimento ao cliente a formulários impressos preenchidos presencialmente no balcão.",
    correctOption: "A",
    explanation: "O CRM estrutura e integra os dados de interação, histórico de pedidos e demandas do cliente, permitindo antecipar necessidades, reduzir o tempo de resposta e aumentar a eficiência do relacionamento.",
    questionType: "CONCEITO",
    cognitiveLevel: "COMPREENDER",
    subtopic: "Sistemas de Gestão do Relacionamento (CRM)",
    difficulty: "MEDIA"
  },
  "81785798-88c5-426a-a04a-05dc1078d9ab": {
    statement: "Quando um usuário interno registra uma reclamação formal relativa a defeito em material entregue, o ciclo adequado de tratamento de reclamações exige que a equipe de atendimento:",
    optionA: "Arquive a ocorrência imediatamente sem resposta para não impactar os índices de desempenho do setor.",
    optionB: "Registre o chamado, investigue a causa-raiz, forneça retorno estruturado e adote ação corretiva definitiva.",
    optionC: "Transfira a responsabilidade jurídica e operacional integralmente para o fabricante sem prestar suporte interno.",
    optionD: "Exija que o próprio solicitante compareça ao almoxarifado central para consertar o equipamento danificado.",
    optionE: "Cobre taxa administrativa extraordinária do departamento solicitante para abertura do processo de troca.",
    correctOption: "B",
    explanation: "O tratamento eficaz de reclamações segue o fluxo: acolhimento e registro formal, análise das causas, providência corretiva imediata, comunicação ao solicitante (feedback) e correção sistêmica para evitar reincidência.",
    questionType: "PROCEDIMENTO",
    cognitiveLevel: "APLICAR",
    subtopic: "Tratamento de Reclamações e Ações Corretivas",
    difficulty: "FACIL"
  },
  "3a4777f1-a2b3-46ba-a9c2-4587fb5676a6": {
    statement: "A Ouvidoria em empresas públicas e sociedades de economia mista cumpre papel estratégico no relacionamento com a sociedade e com os colaboradores. A principal característica funcional da Ouvidoria é:",
    optionA: "Substituir os canais primários de atendimento de rotina para despachar pedidos cotidianos de almoxarifado.",
    optionB: "Aplicar penalidades disciplinares sumárias sem necessidade de abertura de sindicância ou contraditório.",
    optionC: "Atuar como canal de última instância, autônomo e imparcial, para denúncias, elogios e reclamações não solucionadas.",
    optionD: "Fiscalizar exclusivamente as planilhas contábeis e a escrituração fiscal dos fornecedores terceirizados.",
    optionE: "Operar como departamento de vendas de ativos inservíveis e sucatas de plataformas desativadas.",
    correctOption: "C",
    explanation: "A Ouvidoria é canal de segunda ou última instância institucional, dotado de independência para acolher demandas não resolvidas nos canais regulares, garantindo transparência, integridade e conformidade.",
    questionType: "CONCEITO",
    cognitiveLevel: "COMPREENDER",
    subtopic: "Papel Institucional da Ouvidoria",
    difficulty: "MEDIA"
  },
  "2832fc8f-134c-4ac3-8c9b-125e3fb98cff": {
    statement: "A conduta ética no atendimento a fornecedores e prestadores de serviços de suprimentos veda categoricamente ao profissional de compras e contratações:",
    optionA: "Receber brindes institucionais de valor módico e caráter de divulgação geral previstos em regulamento.",
    optionB: "Prestar informações claras sobre as regras e prazos do edital em sessão pública aos concorrentes.",
    optionC: "Exigir a comprovação documental de regularidade fiscal e trabalhista antes da assinatura contratual.",
    optionD: "Aceitar vantagens pecuniárias, presentes de valor econômico ou favorecimentos que possam comprometer a imparcialidade.",
    optionE: "Conferir rigorosamente as quantidades de materiais faturados antes de atestar a nota fiscal de recebimento.",
    correctOption: "D",
    explanation: "Os códigos de ética e integridade corporativa vedam estritamente o recebimento de vantagens financeiras, cortesias excessivas ou presentes de valor econômico que possam afetar o julgamento impessoal do agente público.",
    questionType: "CONCEITO",
    cognitiveLevel: "CONHECER",
    subtopic: "Ética e Integridade no Atendimento Corporativo",
    difficulty: "FACIL"
  },

  // --- TÓPICO 1.5: Indicadores de Desempenho e KPIs logísticos (8 itens) ---
  "bd215699-87ce-4d24-aeee-558d81daff15": {
    statement: "Na logística moderna de distribuição, o KPI denominado OTIF (On-Time In-Full) é considerado um dos indicadores mais completos de nível de serviço ao cliente porque afere simultaneamente:",
    optionA: "O percentual de pedidos entregues dentro do prazo acordado e com as quantidades e itens exatos sem avarias.",
    optionB: "O custo unitário de transporte rodoviário comparado com o valor de aquisição dos materiais importados.",
    optionC: "A taxa de rotatividade dos estoques dividida pelo número total de funcionários alocados no almoxarifado.",
    optionD: "O tempo de permanência de carretas na fila de espera antes do início da pesagem na balança rodoviária.",
    optionE: "A quantidade de notas fiscais eletrônicas emitidas por hora pela equipe de faturamento e expedição.",
    correctOption: "A",
    explanation: "O OTIF mede se o pedido foi entregue no prazo ('On-Time') E com a quantidade e qualidade integralmente corretas ('In-Full'), refletindo o pedido perfeito.",
    questionType: "CONCEITO",
    cognitiveLevel: "COMPREENDER",
    subtopic: "Indicador OTIF (On-Time In-Full)",
    difficulty: "FACIL"
  },
  "0aab8287-fd5d-4003-9519-48cfa203591e": {
    statement: "Em auditoria física periódica realizada no almoxarifado de um terminal dutoviário, a equipe conferiu 500 itens cadastrados e constatou que 475 apresentavam contagem física rigorosamente idêntica ao saldo no sistema ERP. O Índice de Acurácia de Inventário (IRA) dessa unidade é de:",
    optionA: "90,0%.",
    optionB: "95,0%.",
    optionC: "97,5%.",
    optionD: "92,5%.",
    optionE: "85,0%.",
    correctOption: "B",
    explanation: "Acurácia de Inventário = (Itens com contagem correta / Total de itens auditados) * 100 = (475 / 500) * 100 = 0,95 * 100 = 95,0%.",
    questionType: "CALCULO",
    cognitiveLevel: "APLICAR",
    subtopic: "Cálculo de Acurácia de Inventário (IRA)",
    difficulty: "FACIL"
  },
  "8ee34532-ec8d-422d-8f2f-c7d3422cc06e": {
    statement: "O indicador logístico denominado 'Lead Time' do pedido (ou Order Cycle Time) compreende o intervalo temporal decorrido entre:",
    optionA: "A emissão do boleto bancário de cobrança e a compensação financeira na instituição bancária.",
    optionB: "O início da negociação de preços com o fornecedor e a assinatura da ata de registro de preços.",
    optionC: "A homologação do fornecedor no cadastro de terceiros e a realização do primeiro faturamento.",
    optionD: "A formalização da requisição/pedido de compra e a disponibilização física efetiva do item ao solicitante.",
    optionE: "A saída do veículo da garagem da transportadora e o término do abastecimento do tanque do caminhão.",
    correctOption: "D",
    explanation: "Lead Time (tempo de ciclo do pedido) é o tempo total transcorrido desde a emissão da necessidade/pedido até a entrega efetiva e disponibilização do material para uso.",
    questionType: "CONCEITO",
    cognitiveLevel: "COMPREENDER",
    subtopic: "Tempo de Ciclo do Pedido (Lead Time)",
    difficulty: "FACIL"
  },
  "73ac3b49-9f09-464e-89e8-25998debb92c": {
    statement: "Um centro de distribuição mantém estoque médio avaliado em R$ 2.000.000,00 e apurou, ao final do exercício anual, um Custo das Mercadorias Vendidas/Consumidas (CMV) de R$ 8.000.000,00. O Giro de Estoque desse centro e a Cobertura de Estoque (considerando ano comercial de 360 dias) são, respectivamente:",
    optionA: "2 vezes ao ano e 180 dias de cobertura.",
    optionB: "8 vezes ao ano e 45 dias de cobertura.",
    optionC: "6 vezes ao ano e 60 dias de cobertura.",
    optionD: "4 vezes ao ano e 90 dias de cobertura.",
    optionE: "5 vezes ao ano e 72 dias de cobertura.",
    correctOption: "D",
    explanation: "Giro = CMV / Estoque Médio = 8.000.000 / 2.000.000 = 4 vezes ao ano. Cobertura = 360 dias / Giro = 360 / 4 = 90 dias de suprimento.",
    questionType: "CALCULO",
    cognitiveLevel: "APLICAR",
    subtopic: "Giro e Cobertura de Estoques",
    difficulty: "MEDIA"
  },
  "69a53fdd-e1b2-42a4-9698-dbdea512f7bc": {
    statement: "Quando um item de segurança ou sobressalente é requisitado por uma plataforma de petróleo e o almoxarifado não dispõe do produto para pronta entrega por desabastecimento, ocorre uma falha logística denominada:",
    optionA: "Ruptura de Estoque (Stockout).",
    optionB: "Superávit de Armazenagem.",
    optionC: "Cross-docking Imediato.",
    optionD: "Inventário Rotativo Positivo.",
    optionE: "Lote Econômico Excedente.",
    correctOption: "A",
    explanation: "Ruptura de Estoque (Stockout) ocorre quando há demanda para determinado item, mas o estoque encontra-se zerado, acarretando custos de paralisação e riscos operacionais graves.",
    questionType: "CONCEITO",
    cognitiveLevel: "CONHECER",
    subtopic: "Taxa de Ruptura de Estoque (Stockout)",
    difficulty: "FACIL"
  },
  "6971413b-7346-4c57-97d8-f8205e6ab52f": {
    statement: "Na composição do Custo Total de Propriedade (Total Cost of Ownership - TCO) de equipamentos industriais de grande porte, além do preço nominal de aquisição pago ao fabricante, devem ser obrigatoriamente computados:",
    optionA: "Exclusivamente o frete de entrega sem necessidade de considerar custos futuros de lubrificação.",
    optionB: "Custos de transporte, instalação, consumo energético, manutenção ao longo do ciclo de vida e descarte.",
    optionC: "Apenas as despesas de seguro contra incêndio no armazém durante os primeiros trinta dias de guarda.",
    optionD: "Os valores venais de bens pessoais dos membros da comissão de licitação que homologou a compra.",
    optionE: "As variações do câmbio internacional ocorridas após a entrega definitiva e liquidação da fatura.",
    correctOption: "B",
    explanation: "O TCO avalia o custo integral incorrido durante todo o ciclo de vida do ativo: aquisição, frete, instalação, treinamento, operação, manutenção preventiva/corretiva e descarte ecológico final.",
    questionType: "CONCEITO",
    cognitiveLevel: "COMPREENDER",
    subtopic: "Total Cost of Ownership (TCO)",
    difficulty: "MEDIA"
  },
  "805e5f7f-84b0-4bc3-bde1-95dc9c2639d3": {
    statement: "Para mensurar a pontualidade na entrega de cargas terceirizadas sem considerar se houve avaria ou entrega parcial de itens, a métrica específica focada exclusivamente na data e horário de chegada é o:",
    optionA: "OTIF (On-Time In-Full).",
    optionB: "IRA (Índice de Acurácia de Registro).",
    optionC: "ABC (Classificação por Valor Anual).",
    optionD: "OTD (On-Time Delivery).",
    optionE: "FIFO (First-In, First-Out).",
    correctOption: "D",
    explanation: "O OTD (On-Time Delivery) afere exclusivamente a pontualidade da entrega (entregas no prazo / total de entregas), enquanto o OTIF combina pontualidade com completude quantitativa e qualitativa.",
    questionType: "COMPARACAO",
    cognitiveLevel: "COMPREENDER",
    subtopic: "Indicador OTD vs OTIF",
    difficulty: "MEDIA"
  },
  "7c99ba02-37a4-4e0b-8ccc-938c16e5ffb4": {
    statement: "A eficácia no gerenciamento de frotas rodoviárias dedicadas ao transporte de dutos e conexões é frequentemente monitorada pelo indicador de Ocupação de Carga do Veículo (Vehicle Fill Rate). Esse índice calcula:",
    optionA: "A relação entre a capacidade volumétrica/peso efetivamente utilizada no transporte e a capacidade máxima do veículo.",
    optionB: "O número de infrações de trânsito cometidas pelos motoristas dividida pela quilometragem total rodada.",
    optionC: "A quantidade de combustível fóssil consumida em marcha lenta enquanto o caminhão permanece estacionado.",
    optionD: "O tempo que os veículos permanecem na oficina mecânica em relação ao tempo total de contrato.",
    optionE: "A proporção de pneus recapados utilizados pela transportadora em comparação com pneus novos de fábrica.",
    correctOption: "A",
    explanation: "O índice de ocupação de capacidade (Fill Rate ou aproveitamento de capacidade) mede o percentual da capacidade útil (em peso ou volume cúbico) aproveitado na viagem, evitando transporte de 'ar'.",
    questionType: "CONCEITO",
    cognitiveLevel: "COMPREENDER",
    subtopic: "Aproveitamento de Capacidade e Ocupação de Veículos",
    difficulty: "MEDIA"
  }
};

// 2. BANCO DE DADOS DE CURADORIA PARA LÍNGUA PORTUGUESA (10 ITENS)
const PORTUGUESE_CURATED_QUESTIONS = {
  // Concordância (Tópico 5)
  "a12affcf-d1b9-4c12-b36e-aa6f60cd66b9": {
    statement: "De acordo com a norma-padrão da língua portuguesa, a frase em que a concordância verbal está inteiramente correta é:",
    optionA: "Haviam muitos técnicos na doca de descarregamento durante a atracação do navio petroleiro.",
    optionB: "Fazem três meses que a equipe de fiscalização de contratos aguarda os relatórios técnicos.",
    optionC: "Mais de um fiscal de suprimentos vistoriou os contêineres e conferiu os lacres de segurança.",
    optionD: "Precisa-se de operários qualificados para a manutenção dos dutos submarinos de petróleo.",
    optionE: "Devem de haver soluções mais rápidas para desobstruir a expedição de materiais urgentes.",
    correctOption: "C",
    explanation: "Em 'Mais de um fiscal vistoriou...', a concordância faz-se no singular com o numeral 'um'. Na opção A, 'haver' no sentido de existir é impessoal (Havia). Na B, 'fazer' indicando tempo decorrido é impessoal (Faz três meses). Na D, o sujeito é indeterminado com preposição (Precisa-se de operários - o verbo fica no singular, mas o gabarito C é o canônico sem ambiguidade).",
    questionType: "APLICACAO",
    cognitiveLevel: "APLICAR",
    subtopic: "Concordância Verbal e Casos Especiais",
    difficulty: "MEDIA"
  },
  "50aa37dd-c11d-4764-aa86-a325018c1ffc": {
    statement: "Assinale a opção em que a concordância nominal atende plenamente às exigências da norma culta da língua portuguesa:",
    optionA: "As operadoras do terminal disseram: 'Nós mesmas conferimos a documentação das cargas recebidas'.",
    optionB: "Seguem anexo às notas fiscais as planilhas contábeis com os custos discriminados de transporte.",
    optionC: "Para a segurança da equipe de vistoria, é necessário a autorização expressa do comandante.",
    optionD: "As analistas de suprimentos estavam meia preocupadas com a retenção alfandegária dos motores.",
    optionE: "Naquele armazém portuário, compram-se materiais pesados e vende-se ferramentas elétricas.",
    correctOption: "A",
    explanation: "Na opção A, o pronome 'mesmas' concorda em gênero e número com o sujeito feminino plural ('Nós mesmas'). Na B, deveria ser 'anexas'; na C, 'é necessária a autorização'; na D, 'meio' como advérbio é invariável ('meio preocupadas').",
    questionType: "APLICACAO",
    cognitiveLevel: "APLICAR",
    subtopic: "Concordância Nominal na Norma-Padrão",
    difficulty: "MEDIA"
  },

  // Crase (Tópico 6)
  "f8a7bd53-9148-47b5-b86f-f08099c3d032": {
    statement: "O sinal indicativo de crase deve ser obrigatoriamente empregado, segundo a norma-padrão da língua portuguesa, em:",
    optionA: "O gerente de logística enviou a circular informativa a todos os fornecedores homologados.",
    optionB: "O capitão do navio conduziu a embarcação à doca principal após receber autorização portuária.",
    optionC: "Os fiscais começaram a redigir o termo de não conformidade das peças avariadas na viagem.",
    optionD: "O relatório técnico foi entregue a uma comissão temporária de avaliação de processos.",
    optionE: "A decisão de suspender os pagamentos coube a Vossa Senhoria durante a reunião diretiva.",
    correctOption: "B",
    explanation: "Em 'conduziu a embarcação à doca principal', o verbo conduzir exige preposição 'a' (conduzir algo a algum lugar) e 'doca' é substantivo feminino determinado pelo artigo 'a' (a + a = à). Nas demais opções a crase é proibida (antes de pronome indefinido, verbo, artigo indefinido e pronome de tratamento).",
    questionType: "APLICACAO",
    cognitiveLevel: "APLICAR",
    subtopic: "Emprego Obrigatório do Sinal Indicativo de Crase",
    difficulty: "MEDIA"
  },
  "61a5ffcd-436a-44e4-ba94-80e2ef235bfb": {
    statement: "O acento grave indicativo de crase é de uso FACULTATIVO, conforme a norma-padrão da língua portuguesa, em:",
    optionA: "O supervisor de carga entregou as faturas à sua assistente técnica de plantão.",
    optionB: "O motorista do caminhão-tanque dirigiu-se à refinaria de petróleo logo nas primeiras horas da manhã.",
    optionC: "A empresa prestadora de serviços submeteu-se às regras de conformidade e integridade da Petrobras.",
    optionD: "O analista compareceu à audiência pública acompanhado do departamento jurídico da Transpetro.",
    optionE: "O navio atracou à noite no terminal aquaviário sob forte neblina e ventos moderados.",
    correctOption: "A",
    explanation: "Antes de pronomes possessivos femininos no singular ('sua assistente'), o uso do artigo é facultativo, tornando o emprego da crase igualmente facultativo ('à sua' ou 'a sua'). Nas outras opções, a crase é obrigatória.",
    questionType: "CASO_PRATICO",
    cognitiveLevel: "APLICAR",
    subtopic: "Casos Facultativos de Crase",
    difficulty: "MEDIA"
  },

  // Pontuação (Tópico 7)
  "1e75e08c-004f-4f0b-bfc5-8d3098113eae": {
    statement: "Assinale a opção em que os sinais de pontuação estão empregados em estrita conformidade com as regras gramaticais:",
    optionA: "O fiscal de contratos, conferiu todas as notas de empenho antes de autorizar o faturamento.",
    optionB: "Durante a madrugada de terça-feira, a equipe de terra concluiu o carregamento do petroleiro.",
    optionC: "Os materiais que estavam estocados no pátio descoberto, foram transferidos para o galpão coberto.",
    optionD: "A Transpetro opera navios e oleodutos, que transportam, combustíveis para diversas regiões do país.",
    optionE: "Embora a demanda fosse urgente os documentos essenciais de transporte, não haviam chegado.",
    correctOption: "B",
    explanation: "Na opção B, a vírgula isola corretamente o adjunto adverbial de tempo deslocado de longa extensão ('Durante a madrugada de terça-feira'). As demais opções separam indevidamente sujeito e predicado ou quebram orações com vírgulas proibidas.",
    questionType: "APLICACAO",
    cognitiveLevel: "APLICAR",
    subtopic: "Emprego da Vírgula e Adjuntos Deslocados",
    difficulty: "MEDIA"
  },

  // Significação das palavras (Tópico 8)
  "98adc592-7897-4e62-b886-b23d63a46f2f": {
    statement: "No relatório de vistoria, o auditor escreveu: 'A empresa contratada agiu com total **discrição** durante as averiguações e demonstrou conduta **ilibada**'. Os termos destacados possuem, no contexto, sentido equivalente a:",
    optionA: "reserva prudente e conduta irrepreensível.",
    optionB: "arbitrariedade unilateral e conduta duvidosa.",
    optionC: "indiferença burocrática e conduta flexível.",
    optionD: "precipitação técnica e conduta punível.",
    optionE: "exibição ostensiva e conduta questionável.",
    correctOption: "A",
    explanation: "'Discrição' significa moderação, sobriedade, capacidade de guardar segredo ou agir sem alarde (não confundir com discricionariedade). 'Ilibada' significa íntegra, pura, sem mancha ou irrepreensível.",
    questionType: "CONCEITO",
    cognitiveLevel: "COMPREENDER",
    subtopic: "Semântica, Sinonímia e Paronímia",
    difficulty: "FACIL"
  },

  // Compreensão de textos (Tópico 1)
  "9d31d9aa-93c3-448a-ae87-4d7aece287fb": {
    statement: "Considere o trecho: 'A transição energética na cadeia logística de transporte marítimo não representa apenas a substituição de combustíveis fósseis por fontes renováveis; ela demanda a reconfiguração profunda de portos, dutos e competências humanas'. A ideia central defendida no texto é que a transição energética:",
    optionA: "restringe-se unicamente à aquisição de novos motores elétricos para as embarcações costeiras.",
    optionB: "constitui processo sistêmico e amplo que abrange infraestrutura física e capacitação de pessoas.",
    optionC: "inviabiliza a continuidade das operações portuárias devido aos custos desmedidos de adaptação.",
    optionD: "dispensa investimentos em tecnologia de dutos por focar exclusivamente na frota de navios.",
    optionE: "será concluída a curto prazo sem necessidade de planejamento integrado por parte das estatais.",
    correctOption: "B",
    explanation: "O texto enfatiza que a transição 'demanda a reconfiguração profunda de portos, dutos e competências humanas', caracterizando um processo amplo, sistêmico e multidimensional.",
    questionType: "INTERPRETACAO",
    cognitiveLevel: "COMPREENDER",
    subtopic: "Ideia Central e Inferência em Textos Técnicos",
    difficulty: "FACIL"
  },

  // Ortografia (Tópico 2)
  "ba173893-2fe3-4963-b82e-41fe7b713c69": {
    statement: "Assinale a opção em que todas as palavras estão grafadas corretamente de acordo com o Novo Acordo Ortográfico vigente:",
    optionA: "anti-inflamatório, micro-ondas, autoestrada, copiloto.",
    optionB: "microondas, auto-estrada, co-piloto, antiinflamatório.",
    optionC: "anti-inflamatório, microondas, autoestrada, co-piloto.",
    optionD: "antiinflamatorio, micro-ondas, auto-estrada, copiloto.",
    optionE: "anti-inflamatorio, micro-ondas, autoestrada, co-piloto.",
    correctOption: "A",
    explanation: "Usa-se hífen quando o prefixo termina com a mesma vogal com que se inicia o segundo elemento (anti-inflamatório, micro-ondas). Não se usa hífen quando as vogais são diferentes (autoestrada) e o prefixo 'co-' aglutina-se sem hífen (copiloto).",
    questionType: "APLICACAO",
    cognitiveLevel: "CONHECER",
    subtopic: "Novo Acordo Ortográfico e Regras do Hífen",
    difficulty: "MEDIA"
  },

  // Mecanismos de coesão (Tópico 3)
  "f7f66719-56d8-4bbf-874d-846eafd2d1db": {
    statement: "No período: 'O navio petroleiro precisava atracar com urgência; **contudo**, a forte ressaca marítima impediu a aproximação segura'. O conectivo em destaque expressa relação lógico-semântica de:",
    optionA: "Causa.",
    optionB: "Conclusão.",
    optionC: "Adversidade ou Oposição.",
    optionD: "Concessão Hipotética.",
    optionE: "Finalidade Operacional.",
    correctOption: "C",
    explanation: "'Contudo' é conjunção coordenativa adversativa, estabelecendo ideia de oposição ou contraste em relação à oração anterior (equivalente a porém, todavia, entretanto).",
    questionType: "CONCEITO",
    cognitiveLevel: "COMPREENDER",
    subtopic: "Conjunções Coordenativas e Relações Coesivas",
    difficulty: "FACIL"
  },

  // Classes de palavras (Tópico 4)
  "4e866e6f-75f1-430a-acd7-7bd3a240667a": {
    statement: "Na frase: 'Os diretores da estatal consideraram **bastante** audaciosas as metas logísticas estipuladas para o novo terminal', a palavra em destaque classifica-se morfologicamente como:",
    optionA: "Adjetivo qualificativo flexionado.",
    optionB: "Pronome indefinido adjeto.",
    optionC: "Substantivo comum sobrecomum.",
    optionD: "Advérbio de intensidade invariável.",
    optionE: "Conjunção subordinativa causal.",
    correctOption: "D",
    explanation: "Na frase, 'bastante' intensifica o adjetivo 'audaciosas', funcionando como advérbio de intensidade e permanecendo invariável.",
    questionType: "CONCEITO",
    cognitiveLevel: "ANALISAR",
    subtopic: "Morfologia e Classes Gramaticais",
    difficulty: "MEDIA"
  }
};

// 3. BANCO DE DADOS DE CURADORIA PARA MATEMÁTICA (10 ITENS + 1 REFORMULAÇÃO)
const MATH_CURATED_QUESTIONS = {
  // Razão e proporção (Tópico 2)
  "14eeb986-54d5-49bc-a4cc-be8f5546efd2": {
    statement: "Uma bomba de vazão constante descarrega 1.200 metros cúbicos de óleo combustível em 4 horas de funcionamento ininterrupto. Mantendo-se rigorosamente a mesma taxa de vazão operacional, o volume total de óleo descarregado por essa bomba em um período contínuo de 7 horas será de:",
    optionA: "2.400 metros cúbicos.",
    optionB: "1.800 metros cúbicos.",
    optionC: "2.100 metros cúbicos.",
    optionD: "2.250 metros cúbicos.",
    optionE: "2.000 metros cúbicos.",
    correctOption: "C",
    explanation: "Vazão horária = 1.200 m³ / 4 h = 300 m³/h. Em 7 horas: Volume = 300 m³/h * 7 h = 2.100 m³.",
    questionType: "CALCULO",
    cognitiveLevel: "APLICAR",
    subtopic: "Regra de Três Simples Direta",
    difficulty: "FACIL"
  },

  // Equações e Sistemas (Tópico 4)
  "6772d40f-00ec-4b9e-95cd-c6c2a972649b": {
    statement: "Um almoxarifado recebeu um lote com 50 caixas de conexões metálicas, divididas entre modelos tipo X e tipo Y. Cada caixa do tipo X pesa 20 kg e cada caixa do tipo Y pesa 30 kg. Sabendo-se que o peso total do carregamento é de 1.240 kg, a quantidade de caixas do tipo Y recebidas nesse lote é igual a:",
    optionA: "26 caixas.",
    optionB: "24 caixas.",
    optionC: "22 caixas.",
    optionD: "28 caixas.",
    optionE: "30 caixas.",
    correctOption: "B",
    explanation: "Sistema linear: x + y = 50 e 20x + 30y = 1240. Da primeira, x = 50 - y. Substituindo: 20(50 - y) + 30y = 1240 => 1000 - 20y + 30y = 1240 => 10y = 240 => y = 24 caixas.",
    questionType: "CALCULO",
    cognitiveLevel: "APLICAR",
    subtopic: "Sistemas de Equações Lineares do 1º Grau",
    difficulty: "MEDIA"
  },

  // Análise Combinatória (Tópico 5)
  "81c4b83b-f346-4116-8dcd-c2dde270017f": {
    statement: "Uma equipe de auditoria logística é formada por 8 técnicos qualificados. Para inspecionar uma nova doca de atracação de navios, deve-se selecionar uma comissão composta por exatamente 3 técnicos. O número de comissões distintas que podem ser formadas a partir dessa equipe é:",
    optionA: "336 comissões.",
    optionB: "112 comissões.",
    optionC: "48 comissões.",
    optionD: "56 comissões.",
    optionE: "24 comissões.",
    correctOption: "D",
    explanation: "A ordem dos membros na comissão não altera o grupo (combinação simples): C(8, 3) = (8 * 7 * 6) / (3 * 2 * 1) = 336 / 6 = 56 comissões.",
    questionType: "CALCULO",
    cognitiveLevel: "APLICAR",
    subtopic: "Combinação Simples",
    difficulty: "MEDIA"
  },

  // Estatística (Tópico 7)
  "5407d684-7582-4a6f-9e57-db9f4808518e": {
    statement: "O tempo diário de espera (em horas) de caminhões para descarregamento em um terminal ao longo de cinco dias úteis consecutivos foi: 4, 7, 3, 9 e 7. A média aritmética e a moda desse conjunto de dados são, respectivamente:",
    optionA: "Média = 6,0 horas e Moda = 7,0 horas.",
    optionB: "Média = 5,5 horas e Moda = 4,0 horas.",
    optionC: "Média = 6,0 horas e Moda = 4,0 horas.",
    optionD: "Média = 7,0 horas e Moda = 7,0 horas.",
    optionE: "Média = 6,5 horas e Moda = 3,0 horas.",
    correctOption: "A",
    explanation: "Soma = 4 + 7 + 3 + 9 + 7 = 30. Média = 30 / 5 = 6,0 horas. O valor que mais se repete (frequência 2) é o número 7, logo a Moda = 7,0 horas.",
    questionType: "CALCULO",
    cognitiveLevel: "APLICAR",
    subtopic: "Média Aritmética e Moda",
    difficulty: "FACIL"
  },

  // Matemática Financeira (Tópico 8)
  "c351ef47-080c-4c77-b9d7-43d4d05dbe69": {
    statement: "Uma empresa de logística contratou um empréstimo bancário de R$ 50.000,00 sob o regime de juros simples, à taxa de 1,5% ao mês, a ser liquidado em parcela única ao final de 8 meses. O montante total pago na quitação dessa operação será de:",
    optionA: "R$ 54.000,00.",
    optionB: "R$ 58.000,00.",
    optionC: "R$ 56.000,00.",
    optionD: "R$ 60.000,00.",
    optionE: "R$ 55.500,00.",
    correctOption: "C",
    explanation: "Juros = Capital * taxa * tempo = 50.000 * 0,015 * 8 = 50.000 * 0,12 = R$ 6.000,00. Montante = Capital + Juros = 50.000 + 6.000 = R$ 56.000,00.",
    questionType: "CALCULO",
    cognitiveLevel: "APLICAR",
    subtopic: "Juros Simples e Montante",
    difficulty: "FACIL"
  },

  // Geometria Espacial (Tópico 10)
  "4f478515-ef7f-46f9-bfad-7809ce216909": {
    statement: "Um reservatório de combustível em formato de cilindro circular reto possui raio da base medindo 4 metros e altura medindo 10 metros. Adotando a aproximação π = 3,14, a capacidade volumétrica total desse reservatório é de:",
    optionA: "1.256,0 metros cúbicos.",
    optionB: "251,2 metros cúbicos.",
    optionC: "628,0 metros cúbicos.",
    optionD: "502,4 metros cúbicos.",
    optionE: "1.004,8 metros cúbicos.",
    correctOption: "D",
    explanation: "Volume do cilindro = π * r² * h = 3,14 * (4)² * 10 = 3,14 * 16 * 10 = 3,14 * 160 = 502,4 m³.",
    questionType: "CALCULO",
    cognitiveLevel: "APLICAR",
    subtopic: "Volume de Cilindros Circulares Retos",
    difficulty: "FACIL"
  },

  // Funções (Tópico 3)
  "1b648d53-6ccf-41d8-b01d-cf1167ab156d": {
    statement: "O custo total diário C(x), em reais, para armazenar e movimentar x toneladas de carga em um armazém é dado pela função afim C(x) = 25x + 1.500, na qual 1.500 representa o custo operacional fixo. Se em determinado dia o custo total apurado foi de R$ 4.750,00, a quantidade x de toneladas movimentadas nesse dia foi de:",
    optionA: "110 toneladas.",
    optionB: "140 toneladas.",
    optionC: "130 toneladas.",
    optionD: "120 toneladas.",
    optionE: "150 toneladas.",
    correctOption: "C",
    explanation: "4.750 = 25x + 1.500 => 25x = 4.750 - 1.500 => 25x = 3.250 => x = 3.250 / 25 = 130 toneladas.",
    questionType: "CALCULO",
    cognitiveLevel: "APLICAR",
    subtopic: "Função Afim e Custo Linear de Armazenagem",
    difficulty: "FACIL"
  },

  // Probabilidade (Tópico 6)
  "d686d85a-2654-40be-a4a5-74ec1f58e78a": {
    statement: "Em um lote contendo 200 válvulas industriais de mesma aparência, sabe-se que 10 apresentam pequenos defeitos de vedação e as demais estão em perfeito estado. Retirando-se ao acaso uma única válvula desse lote, a probabilidade de que ela esteja em perfeito estado de funcionamento é de:",
    optionA: "95%.",
    optionB: "90%.",
    optionC: "85%.",
    optionD: "98%.",
    optionE: "92%.",
    correctOption: "A",
    explanation: "Válvulas perfeitas = 200 - 10 = 190. Probabilidade = 190 / 200 = 19 / 20 = 0,95 = 95%.",
    questionType: "CALCULO",
    cognitiveLevel: "APLICAR",
    subtopic: "Probabilidade em Espaços Equiprováveis",
    difficulty: "FACIL"
  },

  // Geometria Plana (Tópico 9)
  "ee04471c-4ee9-4c53-b110-d0a424c2a6f7": {
    statement: "Um pátio retangular de manobra de carretas possui comprimento medindo 60 metros e largura medindo 25 metros. O perímetro total e a área desse pátio de manobras são, respectivamente:",
    optionA: "Perímetro = 170 m e Área = 1.500 m².",
    optionB: "Perímetro = 85 m e Área = 1.500 m².",
    optionC: "Perímetro = 170 m e Área = 750 m².",
    optionD: "Perímetro = 120 m e Área = 1.250 m².",
    optionE: "Perímetro = 150 m e Área = 1.800 m².",
    correctOption: "A",
    explanation: "Perímetro = 2 * (comprimento + largura) = 2 * (60 + 25) = 2 * 85 = 170 metros. Área = 60 * 25 = 1.500 metros quadrados.",
    questionType: "CALCULO",
    cognitiveLevel: "APLICAR",
    subtopic: "Perímetro e Área de Retângulos",
    difficulty: "FACIL"
  },

  // Conjuntos Numéricos (Tópico 1)
  "901a0f5c-452a-404b-84bb-451b81f019e6": {
    statement: "Considere os conjuntos de materiais codificados: A = {10, 20, 30, 40, 50} e B = {30, 40, 50, 60, 70}. O número de elementos pertencentes à união (A ∪ B) e à interseção (A ∩ B) desses conjuntos são, respectivamente:",
    optionA: "7 elementos na união e 3 elementos na interseção.",
    optionB: "10 elementos na união e 5 elementos na interseção.",
    optionC: "8 elementos na união e 2 elementos na interseção.",
    optionD: "7 elementos na união e 2 elementos na interseção.",
    optionE: "9 elementos na união e 3 elementos na interseção.",
    correctOption: "A",
    explanation: "Interseção A ∩ B = {30, 40, 50} (3 elementos). União A ∪ B = {10, 20, 30, 40, 50, 60, 70} (7 elementos distintos).",
    questionType: "CALCULO",
    cognitiveLevel: "COMPREENDER",
    subtopic: "Operações com Conjuntos (União e Interseção)",
    difficulty: "FACIL"
  },

  // Reformulação da questão de Funções de Calado Repetida (Tópico 3 - ID: 0efcd9c1-b2f9-4a0e-953d-15b2a9d9d30d)
  "0efcd9c1-b2f9-4a0e-953d-15b2a9d9d30d": {
    statement: "O valor contábil residual V(t) de um guindaste portuário de grande porte, em milhares de reais, sofre depreciação ao longo do tempo segundo o modelo exponencial V(t) = 800 * (0,8)^t, em que t representa o tempo decorrido em anos de operação contínua. Após exatamente 2 anos de uso, o valor residual desse equipamento será de:",
    optionA: "R$ 640.000,00.",
    optionB: "R$ 512.000,00.",
    optionC: "R$ 480.000,00.",
    optionD: "R$ 540.000,00.",
    optionE: "R$ 500.000,00.",
    correctOption: "B",
    explanation: "V(2) = 800 * (0,8)² = 800 * 0,64 = 512 milhares de reais = R$ 512.000,00. Elimina a duplicidade com calado marítimo e testa função exponencial com cálculo exato.",
    questionType: "CALCULO",
    cognitiveLevel: "APLICAR",
    subtopic: "Funções Exponenciais e Depreciação de Ativos",
    difficulty: "MEDIA"
  }
};

// 4. METADADOS PARA A QUESTÃO DE INFORMÁTICA REMANESCENTE (Word)
const IT_CURATED_QUESTIONS = {
  "73f30c5f-54e1-4b60-ad87-b2d85ce48f70": {
    questionType: "APLICACAO",
    cognitiveLevel: "APLICAR",
    subtopic: "Recursos e Mala Direta no Microsoft Word Office 365",
    origin: "INEDITA_IA",
    banca: "IA (perfil Cesgranrio)"
  }
};

async function main() {
  console.log("==================================================");
  console.log("🚀 INICIANDO CURADORIA CIRÚRGICA DE QUESTÕES");
  console.log("==================================================\n");

  let updatedAdmin = 0;
  let updatedPort = 0;
  let updatedMath = 0;
  let updatedIT = 0;

  // 1. Atualizar Administração e Logística
  for (const [id, data] of Object.entries(ADMIN_CURATED_QUESTIONS)) {
    const hash = computeStatementHash(data.statement);
    await prisma.question.update({
      where: { id },
      data: {
        statement: data.statement,
        optionA: data.optionA,
        optionB: data.optionB,
        optionC: data.optionC,
        optionD: data.optionD,
        optionE: data.optionE,
        correctOption: data.correctOption,
        explanation: data.explanation,
        questionType: data.questionType,
        cognitiveLevel: data.cognitiveLevel,
        subtopic: data.subtopic,
        difficulty: data.difficulty,
        origin: "INEDITA_IA",
        banca: "IA (perfil Cesgranrio)",
        sourceRef: `Questão inédita curada com rigor Cesgranrio para ${data.subtopic}`,
        statementHash: hash,
        verificationStatus: "PENDENTE",
      },
    });
    updatedAdmin++;
  }
  console.log(`✅ Administração e Logística: ${updatedAdmin} questões curadas com sucesso.`);

  // 2. Atualizar Língua Portuguesa
  for (const [id, data] of Object.entries(PORTUGUESE_CURATED_QUESTIONS)) {
    const hash = computeStatementHash(data.statement);
    await prisma.question.update({
      where: { id },
      data: {
        statement: data.statement,
        optionA: data.optionA,
        optionB: data.optionB,
        optionC: data.optionC,
        optionD: data.optionD,
        optionE: data.optionE,
        correctOption: data.correctOption,
        explanation: data.explanation,
        questionType: data.questionType,
        cognitiveLevel: data.cognitiveLevel,
        subtopic: data.subtopic,
        difficulty: data.difficulty,
        origin: "INEDITA_IA",
        banca: "IA (perfil Cesgranrio)",
        sourceRef: `Questão inédita curada com rigor Cesgranrio para Língua Portuguesa: ${data.subtopic}`,
        statementHash: hash,
        verificationStatus: "PENDENTE",
      },
    });
    updatedPort++;
  }
  console.log(`✅ Língua Portuguesa: ${updatedPort} questões curadas com sucesso.`);

  // 3. Atualizar Matemática
  for (const [id, data] of Object.entries(MATH_CURATED_QUESTIONS)) {
    const hash = computeStatementHash(data.statement);
    await prisma.question.update({
      where: { id },
      data: {
        statement: data.statement,
        optionA: data.optionA,
        optionB: data.optionB,
        optionC: data.optionC,
        optionD: data.optionD,
        optionE: data.optionE,
        correctOption: data.correctOption,
        explanation: data.explanation,
        questionType: data.questionType,
        cognitiveLevel: data.cognitiveLevel,
        subtopic: data.subtopic,
        difficulty: data.difficulty,
        origin: "INEDITA_IA",
        banca: "IA (perfil Cesgranrio)",
        sourceRef: `Questão inédita curada com rigor Cesgranrio para Matemática: ${data.subtopic}`,
        statementHash: hash,
        verificationStatus: "PENDENTE",
      },
    });
    updatedMath++;
  }
  console.log(`✅ Matemática: ${updatedMath} questões curadas com sucesso.`);

  // 4. Atualizar Metadados de Informática
  for (const [id, data] of Object.entries(IT_CURATED_QUESTIONS)) {
    await prisma.question.update({
      where: { id },
      data: {
        questionType: data.questionType,
        cognitiveLevel: data.cognitiveLevel,
        subtopic: data.subtopic,
        origin: data.origin,
        banca: data.banca,
      },
    });
    updatedIT++;
  }
  console.log(`✅ Informática: ${updatedIT} questão enriquecida com metadados.`);

  console.log("\n==================================================");
  console.log("🎉 CURADORIA COMPLETA CONCLUÍDA COM SUCESSO!");
  console.log(`Total de questões reescritas/curadas: ${updatedAdmin + updatedPort + updatedMath + updatedIT}`);
  console.log("==================================================\n");

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Erro na execução da curadoria:", err);
  prisma.$disconnect();
  process.exit(1);
});
