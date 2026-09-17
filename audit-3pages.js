const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const viewports = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'desktop', width: 1440, height: 900 }
];

const topicId = '75b56da9-933d-4875-ab81-68e763f14f4f';

const pagesToTest = [
  { name: 'desempenho', url: 'http://localhost:3000/desempenho' },
  { name: 'configuracoes', url: 'http://localhost:3000/configuracoes' },
  { name: 'aula', url: `http://localhost:3000/aula/${topicId}` }
];

async function checkHorizontalOverflow(page) {
  return await page.evaluate(() => {
    const docWidth = document.documentElement.clientWidth;
    const bodyWidth = document.body.clientWidth;
    const scrollWidth = document.documentElement.scrollWidth;
    const elementsWithOverflow = [];

    const all = document.querySelectorAll('*');
    for (const el of all) {
      const rect = el.getBoundingClientRect();
      if (rect.right > window.innerWidth + 1 && !el.closest('.overflow-x-auto')) { // 1px tolerance
        elementsWithOverflow.push({
          tagName: el.tagName,
          id: el.id,
          className: el.className ? String(el.className).substring(0, 80) : '',
          right: Math.round(rect.right),
          windowWidth: window.innerWidth,
          overflow: Math.round(rect.right - window.innerWidth)
        });
      }
    }

    return {
      docWidth,
      bodyWidth,
      scrollWidth,
      hasPageOverflow: scrollWidth > window.innerWidth,
      elementsWithOverflow: elementsWithOverflow.slice(0, 10)
    };
  });
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const outDir = path.join(__dirname, 'audit-results-3pages');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const results = {
    timestamp: new Date().toISOString(),
    runs: []
  };

  for (const vp of viewports) {
    console.log(`\n================ Testing Viewport: ${vp.name} (${vp.width}x${vp.height}) ================`);
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      userAgent: vp.name === 'mobile' 
        ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'
        : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    for (const p of pagesToTest) {
      console.log(`[${vp.name}] Auditing ${p.name} at ${p.url}...`);
      const page = await context.newPage();
      const consoleLogs = [];
      const pageErrors = [];
      const networkErrors = [];

      page.on('console', msg => {
        const type = msg.type();
        const text = msg.text();
        if (type === 'error' || type === 'warning') {
          consoleLogs.push({ type, text });
        }
      });

      page.on('pageerror', err => {
        pageErrors.push(err.toString());
      });

      page.on('response', response => {
        if (response.status() >= 400) {
          networkErrors.push({
            url: response.url(),
            status: response.status(),
            statusText: response.statusText()
          });
        }
      });

      await page.goto(p.url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(1000);

      const screenshotPath = path.join(outDir, `${p.name}-${vp.name}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });

      const overflow = await checkHorizontalOverflow(page);

      const pageRun = {
        name: p.name,
        viewport: vp.name,
        url: p.url,
        overflow,
        consoleLogs,
        pageErrors,
        networkErrors,
        interactions: []
      };

      if (p.name === 'configuracoes') {
        console.log(`[${vp.name}] Testing Configuracoes inputs and buttons...`);
        const targetInput = page.locator('input[type="number"]').first();
        if (await targetInput.isVisible()) {
          await targetInput.fill('50');
          pageRun.interactions.push('Filled targetScore with 50');
        }

        const saveBtn = page.locator('button:has-text("Salvar")');
        if (await saveBtn.isVisible()) {
          await saveBtn.click();
          await page.waitForTimeout(1000);
          pageRun.interactions.push('Clicked Salvar Alterações');
        }

        const backupBtn = page.locator('button:has-text("Exportar Backup")');
        if (await backupBtn.isVisible()) {
          const [ download ] = await Promise.all([
            page.waitForEvent('download', { timeout: 5000 }).catch(() => null),
            backupBtn.click()
          ]);
          if (download) {
            pageRun.interactions.push(`Exported backup file: ${download.suggestedFilename()}`);
          } else {
            pageRun.interactions.push('Clicked backup button');
          }
          await page.waitForTimeout(1000);
        }
        await page.screenshot({ path: path.join(outDir, `configuracoes-${vp.name}-after-save.png`) });
      }

      if (p.name === 'aula') {
        console.log(`[${vp.name}] Testing Aula tabs, options and feedback...`);
        const optionC = page.locator('button:has-text("Combustível")').first();
        if (await optionC.isVisible()) {
          await optionC.click();
          pageRun.interactions.push('Selected Option C');
          await page.waitForTimeout(300);
        }

        const conferirBtn = page.locator('button:has-text("Conferir Resposta")').first();
        if (await conferirBtn.isVisible()) {
          await conferirBtn.click();
          pageRun.interactions.push('Clicked Conferir Resposta');
          await page.waitForTimeout(500);
        }

        const entendiBtn = page.locator('button:has-text("Entendi!")');
        if (await entendiBtn.isVisible()) {
          await entendiBtn.click();
          pageRun.interactions.push('Clicked Entendi! feedback button');
          await page.waitForTimeout(1000);
        }
        await page.screenshot({ path: path.join(outDir, `aula-${vp.name}-after-answer.png`) });
      }

      results.runs.push(pageRun);
      await page.close();
    }
    await context.close();
  }

  await browser.close();

  fs.writeFileSync(path.join(outDir, 'audit-summary.json'), JSON.stringify(results, null, 2));
  console.log('Audit completed successfully. Results written to audit-results-3pages/audit-summary.json');
})();
