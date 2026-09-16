import fs from "node:fs";
import path from "node:path";
import { RAG_SOURCES, resolveRagSources, type RagSource } from "./rag-sources";

const DOCUMENTS_DIR = path.join(process.cwd(), "documents");
const MAX_DOCUMENT_CHARS = 9000;
const MAX_CONTEXT_CHARS = 30000;

let fileCache: { signature: string; files: { path: string; content: string }[] } | null = null;

function collectMarkdownFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return collectMarkdownFiles(fullPath);
    return entry.isFile() && entry.name.endsWith(".md") ? [fullPath] : [];
  });
}

function loadFiles() {
  const files = collectMarkdownFiles(DOCUMENTS_DIR);
  const signature = files.map((file) => `${file}:${fs.statSync(file).mtimeMs}`).join("|");
  if (fileCache?.signature === signature) return fileCache.files;
  fileCache = { signature, files: files.map((file) => ({ path: file, content: fs.readFileSync(file, "utf8") })) };
  return fileCache.files;
}

function normalize(text: string) {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function scoreDocument(content: string, query: string, source: RagSource) {
  const normalizedContent = normalize(content);
  const normalizedQuery = normalize(query);
  const terms = normalizedQuery.split(/[^a-z0-9]+/).filter((term) => term.length >= 4);
  const matchedTerms = terms.filter((term) => normalizedContent.includes(term));
  const termScore = terms.reduce((score, term) => score + Math.min(normalizedContent.split(term).length - 1, 5), 0);
  const aliasScore = source.aliases.reduce((score, alias) => score + (normalizedQuery.includes(normalize(alias)) ? 30 : 0), 0);

  if (aliasScore === 0) {
    if (matchedTerms.length === 0) return 0;
    if (matchedTerms.length < terms.length) return 0;
  }

  return source.priority + termScore + aliasScore;
}

function excerpt(content: string, query: string) {
  if (content.length <= MAX_DOCUMENT_CHARS) return content;
  const normalized = normalize(content);
  const terms = normalize(query).split(/[^a-z0-9]+/).filter((t) => t.length >= 4);
  const hit = terms.map((term) => normalized.indexOf(term)).find((index) => index >= 0) ?? 0;
  const start = Math.max(0, hit - 2500);
  return `${content.slice(start, start + MAX_DOCUMENT_CHARS)}\n\n[...trecho limitado para controle de contexto...]`;
}

function sourceForFile(relativePath: string) {
  return RAG_SOURCES.find((source) => source.path === relativePath);
}

export function getRagContext(
  query: string,
  options: { maxDocuments?: number; subjectName?: string; officialSource?: string | null } = {},
): string {
  const maxDocuments = options.maxDocuments ?? 4;
  const preferred = resolveRagSources(query, options.subjectName, options.officialSource);
  const preferredRank = new Map(preferred.map((source, index) => [source.path, index]));

  const ranked = loadFiles()
    .map(({ path: file, content }) => {
      const relative = path.relative(process.cwd(), file).replaceAll(path.sep, "/");
      const source = sourceForFile(relative);
      const rank = preferredRank.get(relative);
      const docScore = source
        ? scoreDocument(content, query, source)
        : scoreDocument(content, query, {
            path: relative,
            type: "reference",
            priority: 10,
            aliases: [],
          });
      const score = docScore > 0
        ? docScore + (rank === undefined ? 0 : (preferred.length - rank) * 8)
        : 0;
      return { file, relative, content, source, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxDocuments);

  if (!ranked.length) return "Nenhum documento local relevante foi encontrado para esta consulta.";

  let context = "";
  for (const item of ranked) {
    const sourceLabel = item.source
      ? `${item.source.type === "official" ? "OFICIAL" : "REFERÊNCIA"}; status=${item.source.status ?? "reference"}; prioridade=${item.source.priority}`
      : "REFERÊNCIA NÃO REGISTRADA";
    const block = `### FONTE LOCAL: ${item.relative}\n### CLASSIFICAÇÃO: ${sourceLabel}\n${excerpt(item.content, query)}\n\n---\n\n`;
    if (context.length + block.length > MAX_CONTEXT_CHARS) break;
    context += block;
  }
  return context || "Nenhum documento local relevante foi encontrado para esta consulta.";
}
