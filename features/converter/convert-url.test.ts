// @vitest-environment node
import { expect, test } from "vitest";

import { ConversionError, convertHtml, parseHttpUrl } from "./convert-url";

test("스킴이 없는 URL은 https로 보완한다", () => {
  expect(parseHttpUrl(" example.com/a ").href).toBe("https://example.com/a");
});

test("http·https가 아닌 URL은 거부한다", () => {
  expect(() => parseHttpUrl("ftp://example.com")).toThrow(ConversionError);
});

test("HTML 본문을 Markdown으로 바꾸고 제목과 저자를 뽑는다", async () => {
  const html = `<html><head><title>My Post</title>
    <meta name="author" content="Kim"></head>
    <body><nav>menu</nav><article><h1>My Post</h1>
    <p>First paragraph with <strong>bold</strong> text that is long enough to count as content.</p>
    <p>Second paragraph that also has enough words to be the main body of the page.</p>
    </article></body></html>`;

  const page = await convertHtml(html, "https://example.com/post");

  expect(page.title).toBe("My Post");
  expect(page.author).toBe("Kim");
  expect(page.markdown).toContain("**bold**");
});
