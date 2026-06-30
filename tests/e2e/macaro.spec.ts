import { expect, test as base } from "@playwright/test";

type ConsoleFixture = {
  consoleErrors: string[];
};

const IGNORED_CONSOLE_PATTERNS = [
  // Triggered when a test navigates while next-auth's session refresh is in-flight.
  // Not a real app bug — the next-auth client just logs the aborted fetch.
  /\[next-auth\]\[error\]\[CLIENT_FETCH_ERROR\]/,
];

const test = base.extend<ConsoleFixture>({
  consoleErrors: async ({ page }, run) => {
    const errors: string[] = [];

    page.on("console", (message) => {
      if (message.type() !== "error") return;
      const text = message.text();
      if (IGNORED_CONSOLE_PATTERNS.some((pattern) => pattern.test(text))) return;
      errors.push(text);
    });

    page.on("pageerror", (error) => {
      errors.push(error.message);
    });

    await run(errors);
    expect(errors).toEqual([]);
  },
});

const publicPaths = ["/products", "/contact", "/quote", "/auth/signin"];

async function expectNo404(pageUrl: string, status?: number | null) {
  expect(status, `${pageUrl} should not return 404`).not.toBe(404);
  expect(status, `${pageUrl} should not return server error`).toBeLessThan(500);
}

test("home page opens without JavaScript console errors", async ({ page, consoleErrors }) => {
  void consoleErrors;
  const response = await page.goto("/");

  await expectNo404("/", response?.status());
  await expect(page.getByRole("heading", { name: "Burgundy Foods", exact: true })).toBeVisible();
  await expect(page.locator("body")).not.toContainText("404");
});

test("primary navigation links work", async ({ page, consoleErrors }) => {
  void consoleErrors;
  await page.goto("/");
  await page.getByRole("button", { name: "Switch language" }).click();
  const header = page.locator("header");

  await header.getByRole("link", { name: "Products", exact: true }).click();
  await expect(page).toHaveURL(/\/products$/);
  await expect(page.getByRole("heading", { name: /Burgundy Foods Pasta Collection/i })).toBeVisible();

  await header.getByRole("link", { name: "Contact", exact: true }).click();
  await expect(page).toHaveURL(/\/contact$/);
  await expect(page.getByRole("heading", { name: /Burgundy Foods requests/i })).toBeVisible();

  await header.getByRole("link", { name: "Request quote", exact: true }).click();
  await expect(page).toHaveURL(/\/quote$/);
  await expect(page.getByRole("heading", { name: /Burgundy Foods quantities/i })).toBeVisible();
});

test("language switch works without hydration or console errors", async ({ page, consoleErrors }) => {
  void consoleErrors;
  await page.goto("/");
  const header = page.locator("header");

  await page.getByRole("button", { name: "Switch language" }).click();
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await expect(header.getByRole("link", { name: "Products", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Switch language" })).toContainText("AR");

  await page.getByRole("button", { name: "Switch language" }).click();
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(header.locator('a[href="/products"]')).toBeVisible();
});

test("dark and light mode toggle works", async ({ page, consoleErrors }) => {
  void consoleErrors;
  await page.goto("/");
  const html = page.locator("html");
  const themeButton = page.getByRole("button", { name: "Toggle color theme" });

  await expect(html).not.toHaveClass(/dark/);
  await themeButton.click();
  await expect(html).toHaveClass(/dark/);
  await themeButton.click();
  await expect(html).not.toHaveClass(/dark/);
});

test("public pages and dashboard route are not 404", async ({ page, consoleErrors }) => {
  void consoleErrors;

  for (const path of publicPaths) {
    const response = await page.goto(path);
    await expectNo404(path, response?.status());
    await expect(page.locator("body")).not.toContainText("404");
  }

  const dashboardResponse = await page.goto("/dashboard");
  await expectNo404("/dashboard", dashboardResponse?.status());
  await expect(page).toHaveURL(/\/auth\/signin/);
});

test("product quote link opens quote form without submitting data", async ({ page, consoleErrors }) => {
  void consoleErrors;
  await page.goto("/products");

  const productQuoteLink = page.locator('a[href^="/quote?product="]').first();
  await expect(productQuoteLink).toBeVisible();
  await productQuoteLink.click();

  await expect(page).toHaveURL(/\/quote\?product=/);
  await expect(page.locator('button[type="submit"]')).toBeVisible();
});

test("sign in opens dashboard with seeded admin credentials", async ({ page, consoleErrors }) => {
  void consoleErrors;
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@burgundy-foods.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  test.skip(!adminPassword, "SEED_ADMIN_PASSWORD env var not set — skipping sign-in test");

  await page.goto("/auth/signin");

  await page.locator('input[type="email"]').fill(adminEmail);
  await page.locator('input[type="password"]').fill(adminPassword as string);
  await page.locator('button[type="submit"]').click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: /إدارة Burgundy Foods/ })).toBeVisible();
});
