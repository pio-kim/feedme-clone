import { expect, test } from "vitest";

import {
  buildLlmMessage,
  buildLlmUrl,
  toFileName,
  toMarkdownDocument,
} from "./llm-handoff";

const page = {
  url: "https://example.com/post",
  title: "Hello World",
  author: "Kim",
  site: "Example",
  markdown: "Body text",
};

test("Markdown 문서 앞에 제목·저자·출처 헤더를 붙인다", () => {
  expect(toMarkdownDocument(page)).toBe(
    "# Hello World\n\n저자: Kim  \n출처: https://example.com/post\n\nBody text\n"
  );
});

test("프롬프트가 있으면 문서 앞에 붙이고, 없으면 문서만 보낸다", () => {
  expect(buildLlmMessage("DOC", "요약해줘")).toBe("요약해줘\n\n---\n\nDOC");
  expect(buildLlmMessage("DOC", "  ")).toBe("DOC");
});

test("ChatGPT와 Claude 링크에 메시지를 q 파라미터로 넣는다", () => {
  expect(buildLlmUrl("chatgpt", "a b")).toBe("https://chatgpt.com/?q=a%20b");
  expect(buildLlmUrl("claude", "a b")).toBe("https://claude.ai/new?q=a%20b");
  expect(buildLlmUrl("claude", "")).toBe("https://claude.ai/new");
});

test("파일 이름에서 쓸 수 없는 문자를 빼고 .md를 붙인다", () => {
  expect(toFileName('A/B: "C"  D')).toBe("AB-C-D.md");
  expect(toFileName("")).toBe("page.md");
});
