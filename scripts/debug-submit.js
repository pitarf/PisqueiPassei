const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  page.on('console', msg => console.log('PAGE LOG:', msg.type(), msg.text()));
  page.on('response', async resp => {
    if (resp.status() >= 400) {
      console.log('FAILED RESP:', resp.status(), resp.url());
      try {
        console.log('BODY:', await resp.text());
      } catch (e) {}
    }
  });

  await page.goto('http://localhost:3000/questoes?modo=geral&count=20', { waitUntil: 'networkidle' });
  const opt = page.locator('button:has(span.rounded-full)').first();
  await opt.click();
  console.log('Clicked option. Submitting...');
  const resp = page.locator('button:has-text("Responder")');
  await resp.click();
  await page.waitForTimeout(2000);
  const nextVisible = await page.locator('button:has-text("Próxima Questão")').isVisible();
  console.log('Next button visible:', nextVisible);
  await browser.close();
})();
