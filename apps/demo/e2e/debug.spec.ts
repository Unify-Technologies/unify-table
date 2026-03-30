import { test } from '@playwright/test';

test('debug page state', async ({ page }) => {
  test.setTimeout(60_000);

  // Navigate without waiting for load (COOP can hang page events)
  await page.goto('/', { waitUntil: 'commit' });
  await page.waitForTimeout(20_000);

  const title = await page.evaluate(() => document.title).catch(() => 'EVAL FAILED');
  console.log('TITLE:', title);

  const bodyLen = await page.evaluate(() => document.body.innerHTML.length).catch(() => -1);
  console.log('BODY HTML LENGTH:', bodyLen);

  const dataIndexCount = await page.evaluate(() => document.querySelectorAll('[data-index]').length).catch(() => -1);
  console.log('DATA-INDEX COUNT:', dataIndexCount);
});
