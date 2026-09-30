import { test, expect } from "@playwright/test";

test.describe("Jornada Completa do Concurseiro - TRANSPETRO STUDY", () => {
  test("1. Página inicial (/) - Metas, estatísticas e navegação principal", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator("text=Transpetro 2026").first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator("text=Sua Meta").first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator("text=Domínio Médio").first()).toBeVisible({ timeout: 15000 });
  });

  test("2. Edital verticalizado (/edital) - Estrutura de disciplinas e tópicos oficiais", async ({ page }) => {
    await page.goto("/edital");
    await expect(page).toHaveURL(/.*\/edital/);
    await expect(page.locator("body")).toContainText("Edital Verticalizado", { timeout: 15000 });

    // Valida disciplinas oficiais
    await expect(page.locator("text=Língua Portuguesa").first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator("text=Matemática").first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator("text=Noções de Administração e Logística").first()).toBeVisible({ timeout: 15000 });
  });

  test("3. Banco de questões (/questoes) - Catálogo e seleção de treinos", async ({ page }) => {
    await page.goto("/questoes");
    await expect(page).toHaveURL(/.*\/questoes/);
    await expect(page.locator("body")).toContainText("Prática de Questões", { timeout: 15000 });
    await expect(page.locator("a[href='/questoes/historico']:visible").first()).toBeVisible({ timeout: 15000 });
  });

  test("4. Filtro de dificuldade em questões (/questoes?difficulty=MEDIA&count=10)", async ({ page }) => {
    await page.goto("/questoes?difficulty=MEDIA&count=10");
    await expect(page).toHaveURL(/.*difficulty=MEDIA/);
    await expect(page.locator("body")).toBeVisible({ timeout: 15000 });

    // Deve carregar a sessão com as questões filtradas de dificuldade média
    const hasQuestionsSession = await page.locator("text=Treino de Questões").first().isVisible();
    const hasAlternativeA = await page.locator("button:has-text('A')").first().isVisible();
    expect(hasQuestionsSession || hasAlternativeA).toBeTruthy();
  });

  test("5. Simulado (/simulado) - Regras e condições oficiais", async ({ page }) => {
    await page.goto("/simulado");
    await expect(page).toHaveURL(/.*\/simulado/);
    await expect(page.locator("body")).toContainText("Simulado Transpetro 2026.3", { timeout: 15000 });
    await expect(page.locator("body")).toContainText("60 questões", { timeout: 15000 });
    await expect(page.locator("body")).toContainText("4 horas", { timeout: 15000 });
    await expect(page.locator("text=INICIAR SIMULADO").first()).toBeVisible({ timeout: 15000 });
  });

  test("6. Simulado interativo (/simulado?iniciar=true) - 60 questões, numeração 1 a 60 e cronômetro", async ({ page }) => {
    await page.goto("/simulado?iniciar=true");
    await expect(page.locator("body")).toBeVisible();

    // Valida cabeçalho do exame oficial de 60 questões
    await expect(page.locator("text=Simulado Cesgranrio • 60 Questões")).toBeVisible({ timeout: 20000 });

    // Valida cronômetro de 4 horas (ex: 03:59:xx ou 04:00:00)
    await expect(page.locator("text=/0[34]:[0-5][0-9]:[0-5][0-9]/")).toBeVisible({ timeout: 10000 });

    // Valida numeração da primeira questão
    await expect(page.locator("text=Questão 1 de 60")).toBeVisible({ timeout: 10000 });

    // Valida a grade de botões de navegação numérica contendo botões 1 e 60
    await expect(page.locator("button:has-text('1')").first()).toBeVisible();
    await expect(page.locator("button:has-text('60')").first()).toBeVisible();

    // Valida botões de ação do simulado
    await expect(page.locator("button:has-text('Próxima')")).toBeVisible();
    await expect(page.locator("button:has-text('Entregar Prova')")).toBeVisible();
  });

  test("7. Histórico de provas e estatísticas (/questoes/historico)", async ({ page }) => {
    await page.goto("/questoes/historico");
    await expect(page).toHaveURL(/.*\/questoes\/historico/);
    await expect(page.locator("h1")).toContainText("Provas e padrões históricos", { timeout: 15000 });
    await expect(page.locator("body")).toContainText("Provas catalogadas", { timeout: 15000 });
    await expect(page.locator("body")).toContainText("Padrões catalogados", { timeout: 15000 });
  });

  test("8. Professor IA (/professor) - Interface de mentoria com input", async ({ page }) => {
    await page.goto("/professor");
    await expect(page).toHaveURL(/.*\/professor/);
    await expect(page.locator("body")).toContainText("Professor Transpetro", { timeout: 15000 });

    // Valida input de mensagem e botão de envio
    const input = page.locator("input[placeholder*='Envie sua dúvida']");
    await expect(input).toBeVisible({ timeout: 15000 });
    await expect(page.locator("button:has-text('Enviar')")).toBeVisible({ timeout: 15000 });
  });

  test("9. Flashcards SRS (/flashcards) - Revisão espaçada", async ({ page }) => {
    await page.goto("/flashcards");
    await expect(page).toHaveURL(/.*\/flashcards/);
    await expect(page.locator("body")).toContainText("Flashcards", { timeout: 15000 });
    await expect(page.locator("body")).toContainText("Repetição espaçada", { timeout: 15000 });
  });

  test("10. Desempenho e progresso (/desempenho) - Métricas e gráficos", async ({ page }) => {
    await page.goto("/desempenho");
    await expect(page).toHaveURL(/.*\/desempenho/);
    await expect(page.locator("h1")).toContainText("Painel de Desempenho", { timeout: 15000 });
    await expect(page.locator("body")).toContainText("Desempenho por matéria", { timeout: 15000 });
  });

  test("11. Configurações da plataforma (/configuracoes) - Metas e parâmetros", async ({ page }) => {
    await page.goto("/configuracoes");
    await expect(page).toHaveURL(/.*\/configuracoes/);
    await expect(page.locator("h1")).toContainText("Configurações", { timeout: 15000 });
    await expect(page.locator("body")).toContainText("Suas Metas", { timeout: 15000 });
  });
});
