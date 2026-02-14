import test, { expect } from "@playwright/test";

test("Navigate to login page", async ({ page }) => {
  await page.goto("http://localhost:3000/login");
  await expect(page).toHaveURL("http://localhost:3000/login");
  await expect(page.locator("h1")).toContainText("Login");
});
