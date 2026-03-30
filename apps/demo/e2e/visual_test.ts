import { chromium } from '@playwright/test';

const BASE = 'http://localhost:5189';

async function main() {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto(BASE);
  await page.waitForTimeout(4000);

  // Click cell in row 5, P&L area
  console.log('1. Click cell...');
  await page.locator('[data-index="5"]').click({ position: { x: 300, y: 10 } });
  await page.waitForTimeout(500);

  // Check selection
  const selCount = await page.evaluate(() => {
    let count = 0;
    document.querySelectorAll('[data-index] > div').forEach(c => {
      const s = (c as HTMLElement).style;
      if (s.outline?.includes('3b82f6') || s.backgroundColor?.includes('59, 130, 246')) count++;
    });
    return count;
  });
  console.log(`   Selected cells with visual: ${selCount}`);

  await page.screenshot({ path: 'e2e/screenshots/01_cell.png' });

  // Shift+click to make range
  console.log('2. Shift+click range...');
  await page.locator('[data-index="8"]').click({ position: { x: 500, y: 10 }, modifiers: ['Shift'] });
  await page.waitForTimeout(500);

  const rangeCount = await page.evaluate(() => {
    let count = 0;
    document.querySelectorAll('[data-index] > div').forEach(c => {
      const bg = (c as HTMLElement).style.backgroundColor;
      if (bg?.includes('59, 130, 246')) count++;
    });
    return count;
  });
  console.log(`   Range cells with tint: ${rangeCount}`);

  await page.screenshot({ path: 'e2e/screenshots/02_range.png' });

  console.log('Done! Open 20s...');
  await page.waitForTimeout(20000);
  await browser.close();
}

main().catch(console.error);
