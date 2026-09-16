export type RagSourceType = "official" | "reference";

export type RagSource = {
  path: string;
  type: RagSourceType;
  priority: number;
  aliases: string[];
  status?: "validated" | "pointer";
};

/**
 * Prioridade editorial do RAG. A fonte do edital define o escopo;
 * fontes normativas oficiais sustentam detalhes jurídicos. Referências
 * pedagógicas organizam o estudo, mas não substituem fontes oficiais.
 */
export const RAG_SOURCES: RagSource[] = [
  {
    path: "documents/edital/retificacao-edital-2026.3.md",
    type: "official",
    priority: 100,
    aliases: ["retificação", "retificacao", "cronograma", "data da prova", "inscrição", "inscricao"],
    status: "validated",
  },
  {
    path: "documents/edital/edital-2026.3.md",
    type: "official",
    priority: 95,
    aliases: ["edital", "português", "portugues", "matemática", "matematica", "administração", "administracao", "logística", "logistica", "legislação", "legislacao", "contabilidade", "informática", "informatica"],
    status: "validated",
  },
  {
    path: "documents/edital/enfase-18.md",
    type: "official",
    priority: 92,
    aliases: ["ênfase 18", "enfase 18", "suprimento de bens e serviços", "suprimento de bens e servicos", "suprimento", "bens e serviços", "bens e servicos", "polos de trabalho", "atribuições", "atribuicoes"],
    status: "validated",
  },
  {
    path: "documents/estudo/mapa-conteudo.md",
    type: "reference",
    priority: 72,
    aliases: ["mapa de conteúdo", "mapa de conteudo", "programa oficial", "49 tópicos", "49 topicos", "conteúdo programático", "conteudo programatico"],
    status: "validated",
  },
  {
    path: "documents/estudo/portugues.md",
    type: "reference",
    priority: 68,
    aliases: ["português", "portugues", "compreensão de textos", "coesão", "coesao", "ortografia", "crase", "pontuação", "pontuacao", "significação das palavras", "significacao das palavras"],
    status: "validated",
  },
  {
    path: "documents/estudo/matematica.md",
    type: "reference",
    priority: 68,
    aliases: ["matemática", "matematica", "conjuntos numéricos", "conjuntos numericos", "funções", "funcoes", "equações", "equacoes", "probabilidade", "estatística", "estatistica", "juros", "geometria"],
    status: "validated",
  },
  {
    path: "documents/estudo/administracao-logistica.md",
    type: "reference",
    priority: 68,
    aliases: ["administração e logística", "administracao e logistica", "planejamento estratégico", "planejamento estrategico", "qualidade", "gestão por processos", "gestao por processos", "atendimento ao cliente", "kpis"],
    status: "validated",
  },
  {
    path: "documents/estudo/cadeia-suprimentos.md",
    type: "reference",
    priority: 68,
    aliases: ["cadeia de suprimentos", "supply chain", "compras", "estoques", "almoxarifados", "negociação", "negociacao", "fornecedores", "transportes", "cargas", "sustentabilidade", "logística 4.0", "logistica 4.0"],
    status: "validated",
  },
  {
    path: "documents/estudo/contabilidade-informatica.md",
    type: "reference",
    priority: 68,
    aliases: ["contabilidade e informática", "contabilidade e informatica", "receita", "despesa", "custos", "nota fiscal", "excel", "word", "powerpoint", "office 365"],
    status: "validated",
  },
  {
    path: "documents/estudo/legislacao-matriz.md",
    type: "reference",
    priority: 70,
    aliases: ["matriz de legislação", "matriz de legislacao", "decreto 2745", "lei 13303", "lei 123", "lei 14133", "rlct", "lgpd"],
    status: "validated",
  },
  {
    path: "documents/legislacao/lei-123-2006.md",
    type: "official",
    priority: 90,
    aliases: ["lei 123", "lei complementar 123", "lc 123", "arts 42", "arts 43", "arts 44", "arts 45", "arts 46", "arts 47", "arts 48", "arts 49", "microempresa", "empresa de pequeno porte", "preferência", "preferencia"],
    status: "validated",
  },
  {
    path: "documents/legislacao/lei-14133-2021.md",
    type: "official",
    priority: 80,
    aliases: ["lei 14133", "lei 14.133", "nova lei de licitações", "nova lei de licitacoes", "licitação", "licitacao", "contratação pública", "contratacao publica"],
    status: "pointer",
  },
  {
    path: "documents/legislacao/lei-13303-2016.md",
    type: "official",
    priority: 85,
    aliases: ["lei 13303", "lei 13.303", "estatais", "empresa pública", "empresa publica", "sociedade de economia mista", "licitações e contratos de estatais", "licitacoes e contratos de estatais"],
    status: "validated",
  },
  {
    path: "documents/legislacao/decreto-2745-1998.md",
    type: "official",
    priority: 85,
    aliases: ["decreto 2745", "decreto 2.745", "regulamento do procedimento licitatório simplificado", "regulamento do procedimento licitatorio simplificado", "petrobras", "transpetro"],
    status: "validated",
  },
  {
    path: "documents/legislacao/regulamento-licitacoes-contratos-transpetro.md",
    type: "official",
    priority: 84,
    aliases: ["regulamento de licitações e contratos da transpetro", "regulamento de licitacoes e contratos da transpetro", "rlct", "di-0tp-00027-b", "revisão 3", "revisao 3"],
    status: "pointer",
  },
  {
    path: "documents/legislacao/lgpd-13709-2018.md",
    type: "official",
    priority: 84,
    aliases: ["lgpd", "lei 13709", "lei 13.709", "proteção de dados", "protecao de dados", "dados pessoais", "contratações públicas", "contratacoes publicas"],
    status: "pointer",
  },
];

const SUBJECT_ALIASES: Record<string, string[]> = {
  "Português": ["português", "portugues", "compreensão", "compreensao", "ortografia", "coesão", "coesao", "crase", "pontuação", "pontuacao", "significação", "significacao"],
  "Matemática": ["matemática", "matematica", "conjuntos", "razão", "razao", "proporção", "proporcao", "funções", "funcoes", "equações", "equacoes", "combinatória", "combinatoria", "probabilidade", "estatística", "estatistica", "juros", "geometria"],
  "Noções de Administração e Logística": ["administração", "administracao", "planejamento", "qualidade", "processos", "cliente", "kpi", "indicadores"],
  "Logística e Cadeia de Suprimentos": ["logística", "logistica", "supply chain", "compras", "estoques", "almoxarifado", "negociação", "negociacao", "fornecedores", "transporte", "cargas", "contratos", "sustentabilidade", "logística 4.0", "logistica 4.0"],
  "Legislação": ["legislação", "legislacao", "lei", "decreto", "licitação", "licitacao", "contratação", "contratacao", "lgpd", "estatais", "rlct"],
  "Noções de Contabilidade e Informática": ["contabilidade", "receita", "despesa", "custos", "resultado", "nota fiscal", "tributário", "tributario", "excel", "word", "powerpoint", "office 365", "informática", "informatica"],
};

export function resolveRagSources(query: string, subjectName?: string, officialSource?: string | null): RagSource[] {
  const text = `${subjectName ?? ""} ${query} ${officialSource ?? ""}`.toLocaleLowerCase("pt-BR");
  const ranked = RAG_SOURCES.map((source) => {
    let score = source.priority;
    if (officialSource && text.includes(source.path.split("/").pop()?.replace(".md", "") ?? "")) score += 40;
    score += source.aliases.reduce((sum, alias) => sum + (text.includes(alias.toLocaleLowerCase("pt-BR")) ? 12 : 0), 0);
    if (subjectName) {
      const aliases = SUBJECT_ALIASES[subjectName] ?? [];
      score += aliases.reduce((sum, alias) => sum + (text.includes(alias) ? 4 : 0), 0);
    }
    return { source, score };
  });

  return ranked.sort((a, b) => b.score - a.score).map(({ source }) => source);
}
