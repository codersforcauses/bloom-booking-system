import test, { expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("http://localhost:3000/login");
});

test("Navigate to login page", async ({ page }) => {
  await expect(page).toHaveURL("http://localhost:3000/login");
  await expect(page.locator("h1")).toContainText("Login");
});

test("displays login form elements", async ({ page }) => {
  await expect(
    page.locator("label:has-text('Username / Email')"),
  ).toBeVisible();
  await expect(page.locator("label:has-text('Password')")).toBeVisible();
  await expect(page.locator('input[id="username"]')).toBeVisible();
  await expect(page.locator('input[id="password"]')).toBeVisible();
  await expect(page.locator('button[type="submit"]')).toContainText("Login");
});

test("shows validation errors for empty fields", async ({ page }) => {
  await page.locator('button[type="submit"]').click();

  await expect(page.locator('input[id="username"]')).toBeFocused();
  await expect(page.locator("text=Username / Email is required")).toBeVisible();
});

test("toggles password visibility", async ({ page }) => {
  const passwordInput = page.locator('input[id="password"]');
  await expect(passwordInput).toHaveAttribute("type", "password");

  await page.locator('[data-testid="password-toggle"]').click();
  await expect(passwordInput).toHaveAttribute("type", "text");

  await page.locator('[data-testid="password-toggle"]').click();
  await expect(passwordInput).toHaveAttribute("type", "password");
});

// Mock e2e test. Playwright intercepts and returns fake tokens
test("successful login redirects to dashboard", async ({ page }) => {
  await page.route("**/api/users/login/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        access: "test-access-token",
        refresh: "test-refresh-token",
      }),
    });
  });

  await page.locator('input[id="username"]').fill("testuser");
  await page.locator('input[id="password"]').fill("testpassword");
  await page.locator('button[type="submit"]').click();

  await expect(page).toHaveURL(/.*dashboard/);
});

// Real e2e login attempt - Requires dev server to be running
test("successful login e2e", async ({ page }) => {
  await page.locator('input[id="username"]').fill("admin");
  await page.locator('input[id="password"]').fill("Password123");
  await page.locator('button[type="submit"]').click();

  await expect(page).toHaveURL(/.*dashboard/);
});

test("shows error on failed login", async ({ page }) => {
  await page.route("**/api/users/login/**", async (route) => {
    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({
        detail: "Invalid username or password.",
      }),
    });
  });

  await page.locator('input[id="username"]').fill("invaliduser");
  await page.locator('input[id="password"]').fill("invalidpassword");
  await page.locator('button[type="submit"]').click();

  await expect(
    page.locator("text=Invalid username or password."),
  ).toBeVisible();
});

test("redirects already authenticated user to dashboard", async ({ page }) => {
  await page.locator('input[id="username"]').fill("admin");
  await page.locator('input[id="password"]').fill("Password123");
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/.*dashboard/);

  await page.goto("http://localhost:3000/login");
  await expect(page).toHaveURL(/.*dashboard/);
});
