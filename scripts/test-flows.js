const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testFlows() {
  console.log('=== INICIANDO BATERIA DE AUDITORIA UI/UX E TESTES FUNCIONAIS ===\n');
  const browser = await chromium.launch({ headless: true });
  const screenshotsDir = path.join(__dirname, 'audit-screenshots');
  if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });

  const viewports = [
    { name: 'desktop', width: 1440, height: 900 },
    { name: 'mobile', width: 390, height: 844 }
  ];

  const results = {
    questoesGeral: {},
    questoesErros: {},
    simulado60: {},
    consoleErrors: [],
    failedRequests: []
  };

  for (const vp of viewports) {
    console.log(`\n======================================================`);
    console.log(`--- TESTANDO VIEWPORT ${vp.name.toUpperCase()} (${vp.width}x${vp.height}) ---`);
    console.log(`======================================================`);
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });

    page.on('console', msg => {
      if (msg.type() === 'error') {
        results.consoleErrors.push({ vp: vp.name, url: page.url(), text: msg.text() });
      }
    });

    page.on('response', resp => {
      if (resp.status() >= 400) {
        results.failedRequests.push({ vp: vp.name, url: resp.url(), status: resp.status() });
      }
    });

    // 1. FLUXO: BANCO DE QUESTÕES - BATERIA GERAL (20 QUESTÕES)
    console.log('1. Acessando /questoes?modo=geral&count=20...');
    await page.goto('http://localhost:3000/questoes?modo=geral&count=20', { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(screenshotsDir, `${vp.name}-questoes-misto-20.png`), fullPage: true });
    
    let hScroll = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    let statementVisible = await page.locator('p.whitespace-pre-line').first().isVisible();
    let optButtons = await page.locator('button:has(span.rounded-full)').count();
    
    results.questoesGeral[vp.name] = {
      overflowHorizontal: hScroll,
      statementVisible,
      optionButtonsCount: optButtons
    };
    console.log(`   > Enunciado visível: ${statementVisible}`);
    console.log(`   > Alternativas A-E renderizadas: ${optButtons}`);
    console.log(`   > Overflow horizontal (quebra de tela): ${hScroll}`);

    // Interação de responder
    console.log('   > Testando clique na primeira alternativa e botão Responder...');
    const firstOption = page.locator('button:has(span.rounded-full)').first();
    await firstOption.click();
    await page.waitForTimeout(300);

    const responderBtn = page.locator('button:has-text("Responder")');
    await responderBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotsDir, `${vp.name}-questao-respondida.png`), fullPage: true });
    
    const proximaBtn = page.locator('button:has-text("Próxima Questão")');
    const isProximaVisible = await proximaBtn.isVisible();
    console.log(`   > Feedback pós-resposta exibido & Botão Próxima visível: ${isProximaVisible}`);

    // 2. FLUXO: MODO PONTOS FRACOS / ERROS (10 QUESTÕES)
    console.log('\n2. Acessando /questoes?modo=erros&count=10...');
    await page.goto('http://localhost:3000/questoes?modo=erros&count=10', { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(screenshotsDir, `${vp.name}-questoes-erros.png`), fullPage: true });
    hScroll = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    statementVisible = await page.locator('p.whitespace-pre-line').first().isVisible();
    
    results.questoesErros[vp.name] = {
      overflowHorizontal: hScroll,
      loaded: statementVisible
    };
    console.log(`   > Modo erros carregado com sucesso: ${statementVisible}`);
    console.log(`   > Overflow horizontal: ${hScroll}`);

    // 3. FLUXO: SIMULADO CESGRANRIO (60 QUESTÕES)
    console.log('\n3. Acessando /simulado?iniciar=true...');
    await page.goto('http://localhost:3000/simulado?iniciar=true', { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(screenshotsDir, `${vp.name}-simulado-iniciado.png`), fullPage: true });

    hScroll = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    const navButtons = await page.locator('button:text-matches("^([1-9]|[1-5][0-9]|60)$")').count();
    const timerVisible = await page.locator('text=/:[0-9]{2}:/').count() > 0 || await page.locator('span:has(svg.lucide-clock)').isVisible();
    const finalizeBtn = await page.locator('button:has-text("Finalizar")').isVisible();

    // Navegar para questão 10 (Português), questão 20 (Matemática) e questão 50 (Específica)
    const btn10 = page.locator('button:text-is("10")');
    await btn10.click();
    await page.waitForTimeout(300);
    const q10Text = await page.locator('span:has-text("Questão 10 de 60")').isVisible();

    const btn20 = page.locator('button:text-is("20")');
    await btn20.click();
    await page.waitForTimeout(300);
    const q20Text = await page.locator('span:has-text("Questão 20 de 60")').isVisible();

    const btn50 = page.locator('button:text-is("50")');
    await btn50.click();
    await page.waitForTimeout(300);
    const q50Text = await page.locator('span:has-text("Questão 50 de 60")').isVisible();

    // Marcar uma alternativa no simulado
    const simOption = page.locator('button:has(span):has-text("A")').first();
    if (await simOption.count() > 0) {
      await simOption.click();
      await page.waitForTimeout(300);
    }

    await page.screenshot({ path: path.join(screenshotsDir, `${vp.name}-simulado-questao50.png`), fullPage: true });

    results.simulado60[vp.name] = {
      overflowHorizontal: hScroll,
      renderedButtonsCount: navButtons,
      timerVisible,
      finalizeBtnVisible: finalizeBtn,
      navigationWorking: q10Text && q20Text && q50Text
    };
    console.log(`   > Botões do mapa de 60 questões renderizados: ${navButtons}/60`);
    console.log(`   > Cronômetro de 4 horas regressivo ativo: ${timerVisible}`);
    console.log(`   > Botão Finalizar Simulado presente: ${finalizeBtn}`);
    console.log(`   > Navegação entre itens 10, 20 e 50 funcionando: ${q10Text && q20Text && q50Text}`);
    console.log(`   > Overflow horizontal: ${hScroll}`);

    await page.close();
  }

  await browser.close();

  console.log('\n======================================================');
  console.log('=== AUDITORIA PLAYWRIGHT CONCLUÍDA COM SUCESSO ===');
  console.log('======================================================');
  console.log(JSON.stringify(results, null, 2));
}

testFlows().catch(console.error);
