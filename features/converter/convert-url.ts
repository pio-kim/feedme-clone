import { Defuddle } from "defuddle/node";

export type ConvertedPage = {
  url: string;
  title: string;
  author: string;
  site: string;
  markdown: string;
};

export class ConversionError extends Error {}

export function parseHttpUrl(input: string): URL {
  const trimmed = input.trim();
  const withScheme = /^[a-z][a-z\d+.-]*:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    throw new ConversionError("올바른 URL 형식이 아닙니다.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new ConversionError("http 또는 https URL만 변환할 수 있습니다.");
  }
  return url;
}

export async function convertHtml(
  html: string,
  url: string
): Promise<ConvertedPage> {
  const result = await Defuddle(html, url, { markdown: true });
  const markdown = result.content.trim();
  if (!markdown) {
    throw new ConversionError("페이지에서 본문을 찾지 못했습니다.");
  }
  return {
    url,
    title: result.title || url,
    author: result.author,
    site: result.site,
    markdown,
  };
}

export async function convertUrl(input: string): Promise<ConvertedPage> {
  const url = parseHttpUrl(input);

  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; FeedMe/1.0; +https://defuddle.md)",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new ConversionError("페이지를 불러오지 못했습니다.");
  }
  if (!response.ok) {
    throw new ConversionError(
      `페이지를 불러오지 못했습니다. (HTTP ${response.status})`
    );
  }

  const html = await response.text();
  return convertHtml(html, response.url || url.href);
}
