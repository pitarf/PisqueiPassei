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

  test("3. Simulado Cesgranrio - Regras e Condições Oficiais", async ({ page }) => {
    await page.goto("/simulado");
    await expect(page).toHaveURL(/.*\/simulado/);
    await expect(page.locator("body")).toContainText("Simulado", { timeout: 15000 });
    await expect(page.locator("body")).toContainText("60 questões", { timeout: 15000 });
    await expect(page.locator("body")).toContainText("4 horas", { timeout: 15000 });
    await expect(page.locator("text=INICIAR SIMULADO").first()).toBeVisible({ timeout: 15000 });
  });

  test("4. Simulado Interativo - Carregamento das 60 questões e navegação", async ({ page }) => {
    await page.goto("/simulado?iniciar=true");
    await expect(page.locator("body")).toBeVisible();
    // Verifica se carregou as 60 questões ou o aviso transparente de déficit
    const hasExam = await page.locator("text=Simulado Cesgranrio • 60 Questões").isVisible();
    const hasDeficitNotice = await page.locator("text=Estoque insuficiente").isVisible();
    expect(hasExam || hasDeficitNotice).toBeTruthy();

    if (hasExam) {
      // Valida visualização da primeira questão e numeração de 1 a 60
      await expect(page.locator("text=Questão 1 de 60")).toBeVisible({ timeout: 10000 });
      await expect(page.locator("button:has-text('Próxima')")).toBeVisible();
      await expect(page.locator("button:has-text('Entregar Prova')")).toBeVisible();
    }
  });

  test("5. Banco Histórico - Provas catalogadas e padrões estatísticos", async ({ page }) => {
    await page.goto("/questoes/historico");
    await expect(page).toHaveURL(/.*\/questoes\/historico/);
    await expect(page.locator("h1")).toContainText("Provas e padrões históricos", { timeout: 15000 });
    await expect(page.locator("body")).toContainText("Provas catalogadas", { timeout: 15000 });
  });

  test("6. Professor IA - Interface de mentoria e chat", async ({ page }) => {
    await page.goto("/professor");
    await expect(page).toHaveURL(/.*\/professor/);
    await expect(page.locator("body")).toContainText("Professor IA", { timeout: 15000 });
    await expect(page.locator("input, textarea").first()).toBeVisible({ timeout: 15000 });
  });

  test("7. Flashcards SRS e Revisão Espaçada", async ({ page }) => {
    await page.goto("/flashcards");
    await expect(page).toHaveURL(/.*\/flashcards/);
    await expect(page.locator("body")).toBeVisible();
  });

  test("8. Painel de Desempenho e Progresso", async ({ page }) => {
    await page.goto("/desempenho");
    await expect(page).toHaveURL(/.*\/desempenho/);
    await expect(page.locator("body")).toContainText("progresso", { timeout: 15000, ignoreCase: true });
  });

  test("9. Configurações da Plataforma e Metas de Estudo", async ({ page }) => {
    await page.goto("/configuracoes");
    await expect(page).toHaveURL(/.*\/configuracoes/);
    await expect(page.locator("body")).toContainText("Metas", { timeout: 15000 });
  });
});
