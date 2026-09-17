const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(process.cwd(), 'screenshots');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const ROUTES = [
  { name: '01-dashboard', url: 'http://localhost:3000/' },
  { name: '02-edital', url: 'http://localhost:3000/edital' },
  { name: '03-questoes', url: 'http://localhost:3000/questoes' },
  { name: '04-simulado', url: 'http://localhost:3000/simulado' },
  { name: '05-flashcards', url: 'http://localhost:3000/flashcards' },
  { name: '06-desempenho', url: 'http://localhost:3000/desempenho' },
  { name: '07-professor', url: 'http://localhost:3000/professor' },
  { name: '08-configuracoes', url: 'http://localhost:3000/configuracoes' },
];

async function runAudit() {
  console.log('🌐 Iniciando navegador Chromium via Playwright...');
  const browser = await chromium.launch({ headless: true });

  const auditLog = {
    timestamp: new Date().toISOString(),
    pages: []
  };

  // 1. Auditoria Mobile (iPhone 13 / 14: 390x844)
  console.log('\n📱 --- AUDITORIA VISUAL MOBILE (390x844) ---');
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  });

  const mobilePage = await mobileContext.newPage();
  const consoleErrors = [];
  mobilePage.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(`[Mobile Console Error] ${msg.text()}`);
  });
  mobilePage.on('pageerror', err => consoleErrors.push(`[Mobile Uncaught Error] ${err.message}`));

  for (const route of ROUTES) {
    try {
      console.log(`📸 Capturando Mobile: ${route.name} (${route.url})`);
      const response = await mobilePage.goto(route.url, { waitUntil: 'networkidle', timeout: 15000 });
      const status = response ? response.status() : 'Sem resposta';
      const screenshotPath = path.join(OUTPUT_DIR, `${route.name}-mobile.png`);
      await mobilePage.screenshot({ path: screenshotPath, fullPage: false });

      auditLog.pages.push({
        device: 'mobile',
        route: route.name,
        url: route.url,
        status,
        screenshot: screenshotPath
      });
    } catch (e) {
      console.error(`❌ Erro ao capturar ${route.name} mobile:`, e.message);
    }
  }
  await mobileContext.close();

  // 2. Auditoria Desktop (1440x900)
  console.log('\n💻 --- AUDITORIA VISUAL DESKTOP (1440x900) ---');
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1
  });
  const desktopPage = await desktopContext.newPage();
  desktopPage.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(`[Desktop Console Error] ${msg.text()}`);
  });
  desktopPage.on('pageerror', err => consoleErrors.push(`[Desktop Uncaught Error] ${err.message}`));

  for (const route of ROUTES) {
    try {
      console.log(`📸 Capturando Desktop: ${route.name} (${route.url})`);
      const response = await desktopPage.goto(route.url, { waitUntil: 'networkidle', timeout: 15000 });
      const status = response ? response.status() : 'Sem resposta';
      const screenshotPath = path.join(OUTPUT_DIR, `${route.name}-desktop.png`);
      await desktopPage.screenshot({ path: screenshotPath, fullPage: false });

      auditLog.pages.push({
        device: 'desktop',
        route: route.name,
        url: route.url,
        status,
        screenshot: screenshotPath
      });
    } catch (e) {
      console.error(`❌ Erro ao capturar ${route.name} desktop:`, e.message);
    }
  }
  await desktopContext.close();
  await browser.close();

  console.log('\n📊 RESUMO DOS ERROS DE CONSOLE/FRONTEND DETECTADOS:');
  if (consoleErrors.length === 0) {
    console.log('✅ ZERO erros de console capturados nas rotas auditadas!');
  } else {
    consoleErrors.forEach(err => console.log('⚠️ ', err));
  }
  console.log(`\n🎉 Auditoria concluída! Screenshots salvos em: ${OUTPUT_DIR}`);
}

runAudit().catch(err => {
  console.error('Falha geral no Playwright:', err);
  process.exit(1);
});
