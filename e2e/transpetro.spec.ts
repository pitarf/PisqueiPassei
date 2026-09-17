import { test, expect } from "@playwright/test";

test.describe("Jornada Completa do Concurseiro - TRANSPETRO STUDY", () => {
  test("1. Navega do Início ao Edital Verticalizado e consulta disciplinas", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
    const editalLink = page.locator("a[href='/edital']:visible").first();
    await expect(editalLink).toBeVisible({ timeout: 15000 });

    // Clica no link do Edital
    await editalLink.click();
    await expect(page).toHaveURL(/.*\/edital/);

    // Valida que as matérias e tópicos carregaram
    await expect(page.locator("text=Língua Portuguesa").first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator("text=Matemática").first()).toBeVisible({ timeout: 15000 });
  });

  test("2. Banco de Questões - Interface e Seleção de Baterias", async ({ page }) => {
    await page.goto("/questoes");
    await expect(page).toHaveURL(/.*\/questoes/);
    await expect(page.locator("h1, h2, h3").first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator("body")).toContainText("Questões", { timeout: 15000 });
  });

  test("3. Simulado Cesgranrio - Regras e Visualização das 60 questões", async ({ page }) => {
    await page.goto("/simulado");
    await expect(page).toHaveURL(/.*\/simulado/);
    await expect(page.locator("body")).toContainText("Simulado", { timeout: 15000 });
  });

  test("4. Flashcards SRS e Revisão Espaçada", async ({ page }) => {
    await page.goto("/flashcards");
    await expect(page).toHaveURL(/.*\/flashcards/);
    await expect(page.locator("body")).toBeVisible();
  });

  test("5. Painel de Desempenho e Progresso", async ({ page }) => {
    await page.goto("/desempenho");
    await expect(page).toHaveURL(/.*\/desempenho/);
    await expect(page.locator("body")).toContainText("progresso", { timeout: 15000, ignoreCase: true });
  });

  test("6. Configurações da Plataforma e Metas de Estudo", async ({ page }) => {
    await page.goto("/configuracoes");
    await expect(page).toHaveURL(/.*\/configuracoes/);
    await expect(page.locator("body")).toContainText("Metas", { timeout: 15000 });
  });
});
