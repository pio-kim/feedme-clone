import { expect, test } from "@playwright/test";

test("홈 화면이 열리고 URL 입력창이 보인다", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle("FeedMe");
  await expect(page.getByRole("textbox", { name: "웹 페이지 URL" })).toBeVisible();
});
