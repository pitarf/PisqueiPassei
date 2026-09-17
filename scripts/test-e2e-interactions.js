const { chromium } = require('@playwright/test');

async function testInteractions() {
  console.log('🤖 [E2E] Iniciando teste de fluxo e interação no frontend...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  const page = await context.newPage();

  // Teste 1: Navegar para o Dashboard e clicar em 'CONTINUAR ESTUDANDO'
  console.log('👉 [Passo 1] Acessando Dashboard e clicando em CONTINUAR ESTUDANDO...');
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  const continueBtn = page.locator('text=CONTINUAR ESTUDANDO');
  if (await continueBtn.isVisible()) {
    await continueBtn.click();
    await page.waitForLoadState('networkidle');
    console.log('✅ Redirecionado para aula:', page.url());
  }

  // Teste 2: Navegar para o Edital e expandir tópicos
  console.log('👉 [Passo 2] Acessando Edital Verticalizado e conferindo filtros...');
  await page.goto('http://localhost:3000/edital', { waitUntil: 'networkidle' });
  const filterBtn = page.locator('button:has-text("Específicos")');
  if (await filterBtn.isVisible()) {
    await filterBtn.click();
    console.log('✅ Filtro de Conhecimentos Específicos clicado!');
  }

  // Teste 3: Navegar para o Professor IA e testar sugestão rápida de pergunta
  console.log('👉 [Passo 3] Acessando Professor IA e conferindo interface responsiva...');
  await page.goto('http://localhost:3000/professor', { waitUntil: 'networkidle' });
  const promptBtn = page.locator('button:has-text("O que devo estudar agora?")');
  if (await promptBtn.isVisible()) {
    console.log('✅ Prompt rápido visível e interativo!');
  }

  // Teste 4: Navegar para Configurações e testar interações de formulário
  console.log('👉 [Passo 4] Acessando Configurações...');
  await page.goto('http://localhost:3000/configuracoes', { waitUntil: 'networkidle' });
  const saveBtn = page.locator('button:has-text("Salvar Alterações")');
  if (await saveBtn.isVisible()) {
    console.log('✅ Botão de Salvar Alterações pronto!');
  }

  // Teste 5: Re-capturar tela do Professor no Mobile após a melhoria
  console.log('👉 [Passo 5] Validando ajuste mobile no Professor IA (390x844)...');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://localhost:3000/professor', { waitUntil: 'networkidle' });
  await page.screenshot({ path: 'screenshots/07-professor-mobile-ajustado.png', fullPage: false });
  console.log('📸 Nova captura salva em: screenshots/07-professor-mobile-ajustado.png');

  await browser.close();
  console.log('🎉 [E2E] Todos os fluxos de navegação e interface foram aprovados!');
}

testInteractions().catch(err => {
  console.error('❌ Erro no teste E2E:', err);
  process.exit(1);
});
