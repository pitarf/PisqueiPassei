import fs from "node:fs";
import path from "node:path";

const DOCUMENTS_DIR = path.join(process.cwd(), "documents");
const MAX_DOCUMENT_CHARS = 18000;

function collectMarkdownFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return collectMarkdownFiles(fullPath);
    return entry.isFile() && entry.name.endsWith(".md") ? [fullPath] : [];
  });
}

function normalize(text: string) {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function scoreDocument(content: string, query: string) {
  const normalizedContent = normalize(content);
  const terms = normalize(query).split(/[^a-z0-9]+/).filter((term) => term.length >= 4);
  return terms.reduce((score, term) => score + Math.min(normalizedContent.split(term).length - 1, 8), 0);
}

function excerpt(content: string, query: string) {
  if (content.length <= MAX_DOCUMENT_CHARS) return content;
  const normalized = normalize(content);
  const terms = normalize(query).split(/[^a-z0-9]+/).filter((t) => t.length >= 4);
  const hit = terms.map((term) => normalized.indexOf(term)).find((index) => index >= 0) ?? 0;
  const start = Math.max(0, hit - 5000);
  return `${content.slice(start, start + MAX_DOCUMENT_CHARS)}\n\n[...trecho limitado para controle de contexto...]`;
}

export function getRagContext(query: string, maxDocuments = 4): string {
  const files = collectMarkdownFiles(DOCUMENTS_DIR)
    .map((file) => {
      const content = fs.readFileSync(file, "utf8");
      return { file, content, score: scoreDocument(content, query) };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxDocuments);

  if (!files.length) return "Nenhum documento local relevante foi encontrado para esta consulta.";

  return files.map(({ file, content }) => {
    const relative = path.relative(process.cwd(), file).replaceAll(path.sep, "/");
    return `### FONTE LOCAL: ${relative}\n${excerpt(content, query)}`;
  }).join("\n\n---\n\n");
}
