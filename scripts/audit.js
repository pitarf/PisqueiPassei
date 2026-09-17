const { chromium } = require('playwright');
const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();

async function runAudit() {
  console.log('Iniciando auditoria Playwright...');
  const browser = await chromium.launch({ headless: true });
  const report = {
    consoleErrors: [],
    failedRequests: [],
    desktop: {},
    mobile: {}
  };

  const screenshotsDir = path.join(__dirname, 'audit-screenshots');
  if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });

  // Viewport Desktop
  console.log('1. Auditando Desktop (1440x900)...');
  const desktopPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  desktopPage.on('console', msg => {
    if (msg.type() === 'error') report.consoleErrors.push({ vp: 'desktop', url: desktopPage.url(), text: msg.text() });
  });
  desktopPage.on('response', resp => {
    if (resp.status() >= 400) report.failedRequests.push({ vp: 'desktop', url: resp.url(), status: resp.status() });
  });

  // Desktop /questoes
  await desktopPage.goto('http://localhost:3000/questoes', { waitUntil: 'networkidle' });
  await desktopPage.screenshot({ path: path.join(screenshotsDir, 'desktop-questoes.png'), fullPage: true });
  report.desktop.questoesOverflow = await desktopPage.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);

  // Desktop /simulado
  await desktopPage.goto('http://localhost:3000/simulado', { waitUntil: 'networkidle' });
  await desktopPage.screenshot({ path: path.join(screenshotsDir, 'desktop-simulado.png'), fullPage: true });
  report.desktop.simuladoOverflow = await desktopPage.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);

  // Viewport Mobile
  console.log('2. Auditando Mobile (390x844 - iPhone 14)...');
  const mobilePage = await browser.newPage({ viewport: { width: 390, height: 844 } });
  mobilePage.on('console', msg => {
    if (msg.type() === 'error') report.consoleErrors.push({ vp: 'mobile', url: mobilePage.url(), text: msg.text() });
  });
  mobilePage.on('response', resp => {
    if (resp.status() >= 400) report.failedRequests.push({ vp: 'mobile', url: resp.url(), status: resp.status() });
  });

  // Mobile /questoes
  await mobilePage.goto('http://localhost:3000/questoes', { waitUntil: 'networkidle' });
  await mobilePage.screenshot({ path: path.join(screenshotsDir, 'mobile-questoes.png'), fullPage: true });
  report.mobile.questoesOverflow = await mobilePage.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);

  // Mobile /simulado
  await mobilePage.goto('http://localhost:3000/simulado', { waitUntil: 'networkidle' });
  await mobilePage.screenshot({ path: path.join(screenshotsDir, 'mobile-simulado.png'), fullPage: true });
  report.mobile.simuladoOverflow = await mobilePage.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);

  await desktopPage.close();
  await mobilePage.close();
  await browser.close();

  console.log('RELATORIO ETAPA 1:');
  console.log(JSON.stringify(report, null, 2));
}

runAudit().catch(console.error).finally(() => prisma.$disconnect());
