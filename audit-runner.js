const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const viewports = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'desktop', width: 1440, height: 900 }
];

const results = {
  timestamp: new Date().toISOString(),
  pages: []
};

async function checkHorizontalOverflow(page) {
  return await page.evaluate(() => {
    const docWidth = document.documentElement.clientWidth;
    const bodyWidth = document.body.clientWidth;
    const scrollWidth = document.documentElement.scrollWidth;
    const elementsWithOverflow = [];

    const all = document.querySelectorAll('*');
    for (const el of all) {
      const rect = el.getBoundingClientRect();
      if (rect.right > window.innerWidth + 1) { // 1px tolerance
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
  const outDir = path.join(__dirname, 'audit-results');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  for (const vp of viewports) {
    console.log(`\n================ Testing Viewport: ${vp.name} (${vp.width}x${vp.height}) ================`);
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      userAgent: vp.name === 'mobile' 
        ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'
        : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

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

    // --- 1. DASHBOARD ---
    console.log(`[${vp.name}] Navigating to Dashboard (http://localhost:3000/)...`);
    const dashReport = { page: 'Dashboard', viewport: vp.name, interactions: [] };
    
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1000);

    const dashInitialPic = path.join(outDir, `dashboard-${vp.name}-initial.png`);
    await page.screenshot({ path: dashInitialPic, fullPage: true });

    dashReport.overflow = await checkHorizontalOverflow(page);

    try {
      const btnEstudar = page.locator('text=/CONTINUAR ESTUDANDO/i').first();
      const count = await btnEstudar.count();
      if (count > 0) {
        const isVisible = await btnEstudar.isVisible();
        const href = await btnEstudar.getAttribute('href').catch(() => null);
        console.log(`[${vp.name}] Found 'CONTINUAR ESTUDANDO' button, visible: ${isVisible}, href: ${href}`);
        dashReport.interactions.push({
          element: 'CONTINUAR ESTUDANDO button',
          visible: isVisible,
          href
        });
      }
    } catch (e) {
      dashReport.interactions.push({ error: e.message });
    }

    dashReport.consoleLogs = [...consoleLogs];
    dashReport.pageErrors = [...pageErrors];
    dashReport.networkErrors = [...networkErrors];
    results.pages.push(dashReport);

    consoleLogs.length = 0;
    pageErrors.length = 0;
    networkErrors.length = 0;

    // --- 2. EDITAL VERTICALIZADO ---
    console.log(`[${vp.name}] Navigating to Edital Verticalizado (http://localhost:3000/edital)...`);
    const editalReport = { page: 'Edital', viewport: vp.name, interactions: [] };

    await page.goto('http://localhost:3000/edital', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1000);

    const editalInitialPic = path.join(outDir, `edital-${vp.name}-initial.png`);
    await page.screenshot({ path: editalInitialPic, fullPage: true });

    editalReport.overflow = await checkHorizontalOverflow(page);

    try {
      // 1. Check tabs
      const tabs = await page.$$eval('[role="tab"]', els => 
        els.map(e => ({ text: e.innerText.trim(), ariaSelected: e.getAttribute('aria-selected') }))
      );
      console.log(`[${vp.name}] Tabs found:`, JSON.stringify(tabs));
      editalReport.interactions.push({ tabsFound: tabs });

      // 2. Click a filter tab (e.g. Específicas)
      const tabEspec = page.locator('button:has-text("Específicas")').first();
      if (await tabEspec.isVisible()) {
        await tabEspec.click();
        await page.waitForTimeout(300);
        console.log(`[${vp.name}] Clicked 'Específicas' tab filter.`);
        editalReport.interactions.push({ action: 'filter_tab_clicked', tab: 'Específicas' });
      }

      // Return to all
      const tabTodos = page.locator('button:has-text("Todas as Matérias")').first();
      if (await tabTodos.isVisible()) {
        await tabTodos.click();
        await page.waitForTimeout(300);
      }

      // 3. Test accordion toggle (e.g. click first subject header to collapse / expand)
      const firstSubjectHeader = page.locator('button[aria-expanded]').first();
      if (await firstSubjectHeader.isVisible()) {
        const title = await firstSubjectHeader.innerText();
        console.log(`[${vp.name}] Toggling first subject accordion...`);
        // Toggle close
        await firstSubjectHeader.click();
        await page.waitForTimeout(400);
        // Toggle reopen
        await firstSubjectHeader.click();
        await page.waitForTimeout(400);
        editalReport.interactions.push({ action: 'accordion_toggle', title: title.substring(0, 40), success: true });
      }

      // 4. Test Search input
      const searchInput = page.locator('input[placeholder*="Buscar"]').first();
      if (await searchInput.isVisible()) {
        await searchInput.fill('Direito');
        await page.waitForTimeout(400);
        const searchPic = path.join(outDir, `edital-${vp.name}-search.png`);
        await page.screenshot({ path: searchPic, fullPage: false });
        await searchInput.fill('');
        await page.waitForTimeout(400);
        editalReport.interactions.push({ action: 'search_filter_tested', query: 'Direito' });
      }

      editalReport.overflowAfterInteractions = await checkHorizontalOverflow(page);

      const editalInteractivePic = path.join(outDir, `edital-${vp.name}-interactive.png`);
      await page.screenshot({ path: editalInteractivePic, fullPage: true });

    } catch (e) {
      editalReport.interactions.push({ error: e.message });
    }

    editalReport.consoleLogs = [...consoleLogs];
    editalReport.pageErrors = [...pageErrors];
    editalReport.networkErrors = [...networkErrors];
    results.pages.push(editalReport);

    await context.close();
  }

  await browser.close();

  fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(results, null, 2));
  console.log('\nAudit re-run completed! Report saved to audit-results/report.json');
})();
