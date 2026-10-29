import type { ConvertedPage } from "./convert-url";

export const PROMPT_PRESETS = [
  { id: "summarize", label: "요약해줘", text: "다음 글을 요약해줘." },
  { id: "translate", label: "한국어로 번역해줘", text: "다음 글을 한국어로 번역해줘." },
  { id: "explain", label: "쉽게 설명해줘", text: "다음 글을 쉽게 설명해줘." },
] as const;

export type LlmTarget = "chatgpt" | "claude";

// Long query strings get rejected by the LLM sites, so past this length
// the document goes through the clipboard instead of the URL.
export const MAX_URL_QUERY_LENGTH = 6000;

export function toMarkdownDocument(page: ConvertedPage): string {
  const header = [`# ${page.title}`];
  const meta = [page.author && `저자: ${page.author}`, `출처: ${page.url}`]
    .filter(Boolean)
    .join("  \n");
  return `${header.join("\n")}\n\n${meta}\n\n${page.markdown}\n`;
}

export function buildLlmMessage(document: string, prompt: string): string {
  const trimmed = prompt.trim();
  return trimmed ? `${trimmed}\n\n---\n\n${document}` : document;
}

export function buildLlmUrl(target: LlmTarget, query: string): string {
  const base =
    target === "chatgpt" ? "https://chatgpt.com/" : "https://claude.ai/new";
  return query ? `${base}?q=${encodeURIComponent(query)}` : base;
}

export function toFileName(title: string): string {
  const safe = title
    .replace(/[\\/:*?"<>|]+/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 80);
  return `${safe || "page"}.md`;
}
