const { chromium } = require('@playwright/test');

async function runInteractiveLiveDemo() {
  console.log('🚀 Abrindo janela visível do navegador para acompanhamento ao vivo...');
  
  // headless: false abre a janela real na sua tela
  // slowMo: 1200 desacelera cada ação em 1.2s para você enxergar tudo com clareza
  const browser = await chromium.launch({
    headless: false,
    slowMo: 1200,
  });

  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
  });

  const page = await context.newPage();

  console.log('📍 1. Acessando a Visão Geral (Dashboard)...');
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Scroll suave pelo dashboard para ver as métricas
  await page.evaluate(() => window.scrollBy({ top: 400, behavior: 'smooth' }));
  await page.waitForTimeout(1500);

  console.log('📍 2. Navegando para o Edital Verticalizado...');
  const editalLink = page.locator('aside a[href="/edital"]');
  if (await editalLink.isVisible()) {
    await editalLink.click();
  } else {
    await page.goto('http://localhost:3000/edital');
  }
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // Clicando em um filtro do edital
  console.log('👉 Filtrando por Conhecimentos Específicos...');
  const filtroEspecificos = page.locator('button:has-text("Específicos")');
  if (await filtroEspecificos.isVisible()) {
    await filtroEspecificos.click();
    await page.waitForTimeout(2000);
  }

  console.log('📍 3. Navegando para o Banco de Questões...');
  const questoesLink = page.locator('aside a[href="/questoes"]');
  if (await questoesLink.isVisible()) {
    await questoesLink.click();
  } else {
    await page.goto('http://localhost:3000/questoes');
  }
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2500);

  console.log('📍 4. Navegando para o Simulado Cesgranrio...');
  const simuladoLink = page.locator('aside a[href="/simulado"]');
  if (await simuladoLink.isVisible()) {
    await simuladoLink.click();
  } else {
    await page.goto('http://localhost:3000/simulado');
  }
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2500);

  console.log('📍 5. Navegando para os Flashcards SRS...');
  const flashcardsLink = page.locator('aside a[href="/flashcards"]');
  if (await flashcardsLink.isVisible()) {
    await flashcardsLink.click();
  } else {
    await page.goto('http://localhost:3000/flashcards');
  }
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2500);

  console.log('📍 6. Navegando para o Professor IA...');
  const professorLink = page.locator('aside a[href="/professor"]');
  if (await professorLink.isVisible()) {
    await professorLink.click();
  } else {
    await page.goto('http://localhost:3000/professor');
  }
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // Interagindo com o chat do professor: digitando no campo
  console.log('👉 Digitando uma pergunta de teste para o Professor IA...');
  const chatInput = page.locator('input[placeholder*="Pergun"]');
  if (await chatInput.isVisible()) {
    await chatInput.fill('Quais são as prioridades do edital da Transpetro?');
    await page.waitForTimeout(2500);
  }

  console.log('📍 7. Navegando para a Central de Desempenho...');
  const desempenhoLink = page.locator('aside a[href="/desempenho"]');
  if (await desempenhoLink.isVisible()) {
    await desempenhoLink.click();
  } else {
    await page.goto('http://localhost:3000/desempenho');
  }
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2500);

  console.log('📍 8. Navegando para Configurações...');
  const configLink = page.locator('aside a[href="/configuracoes"]');
  if (await configLink.isVisible()) {
    await configLink.click();
  } else {
    await page.goto('http://localhost:3000/configuracoes');
  }
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  console.log('✅ Demonstração visual concluída com sucesso!');
  await page.waitForTimeout(2000);
  await browser.close();
}

runInteractiveLiveDemo().catch(err => {
  console.error('Erro na navegação ao vivo:', err);
  process.exit(1);
});
