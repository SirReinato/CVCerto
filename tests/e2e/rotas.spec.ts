import { test, expect } from "@playwright/test";

test.describe("Rotas principais do CVCerto", () => {
  test("deve renderizar a tela de login em /login sem erros", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("#root")).toBeVisible();
    await expect(page.locator("form")).toBeVisible();
  });

  test("deve redirecionar rota privada / para /login quando não autenticado", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator("form")).toBeVisible();
  });
});
