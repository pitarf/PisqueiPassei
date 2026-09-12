export type RagSourceType = "official" | "reference";

export type RagSource = {
  path: string;
  type: RagSourceType;
  priority: number;
  aliases: string[];
  status?: "validated" | "pointer";
};

/**
 * Prioridade editorial do RAG. A fonte do edital define o que cai;
 * fontes normativas oficiais sustentam detalhes jurídicos. Referências
 * marcadas como pointer não devem ser tratadas como transcrição integral.
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
    priority: 80,
    aliases: ["lei 13303", "lei 13.303", "estatais", "empresa pública", "empresa publica", "sociedade de economia mista", "licitações e contratos de estatais", "licitacoes e contratos de estatais"],
    status: "pointer",
  },
  {
    path: "documents/legislacao/decreto-2745-1998.md",
    type: "official",
    priority: 80,
    aliases: ["decreto 2745", "decreto 2.745", "regulamento do procedimento licitatório simplificado", "regulamento do procedimento licitatorio simplificado", "petrobras", "transpetro"],
    status: "pointer",
  },
];

const SUBJECT_ALIASES: Record<string, string[]> = {
  "Português": ["português", "portugues", "interpretação", "interpretacao", "gramática", "gramatica", "texto"],
  "Matemática": ["matemática", "matematica", "porcentagem", "razão", "razao", "proporção", "proporcao", "estatística", "estatistica", "probabilidade"],
  "Noções de Administração e Logística": ["administração", "administracao", "qualidade", "processos", "cliente", "kpi", "indicadores"],
  "Logística e Cadeia de Suprimentos": ["logística", "logistica", "supply chain", "compras", "estoques", "almoxarifado", "negociação", "negociacao", "fornecedores", "transporte", "cargas", "contratos", "sustentabilidade", "logística 4.0", "logistica 4.0"],
  "Legislação": ["legislação", "legislacao", "lei", "decreto", "licitação", "licitacao", "contratação", "contratacao", "lgpd", "estatais"],
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
