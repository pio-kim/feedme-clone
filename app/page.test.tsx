import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import Home from "@/app/page";

test("홈 화면은 제목과 URL 입력, 변환 버튼을 보여준다", () => {
  render(<Home />);

  expect(
    screen.getByRole("heading", { level: 1, name: /Markdown/ })
  ).toBeInTheDocument();
  expect(screen.getByRole("textbox", { name: "웹 페이지 URL" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "변환하기" })).toBeDisabled();
});
