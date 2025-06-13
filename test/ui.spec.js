import { test, expect } from '@playwright/test';
import path from 'path';

const fileUrl = 'file://' + path.resolve('index.html');

test.beforeEach(async ({ page }) => {
  await page.goto(fileUrl);
});

test('dragging a shirt updates the center image', async ({ page }) => {
  const target = page.locator('img[data-shirt-name="metal T-shirt"]');
  const center = page.locator('#centerImage');
  await target.dragTo(center);
  await expect(center).toHaveAttribute('src', /metal-tshirt-model\.png$/);
});

test('submitting a suggestion stores it in localStorage', async ({ page }) => {
  await page.click('#suggest-link');
  await page.fill('#suggest-input', 'blue shirt');
  await page.click('#suggest-submit');
  const stored = await page.evaluate(() => localStorage.getItem('shirtSuggestions'));
  expect(stored).not.toBeNull();
  const items = JSON.parse(stored);
  expect(items[items.length - 1].text).toBe('blue shirt');
});

test('keyboard dragging moves shirt onto model', async ({ page }) => {
  const jersey = page.locator('img[data-shirt-name="MN Wild jersey"]');
  const center = page.locator('#centerImage');
  await jersey.focus();
  await page.keyboard.press('Space');
  for (let i = 0; i < 40; i++) await page.keyboard.press('ArrowLeft');
  for (let i = 0; i < 10; i++) await page.keyboard.press('ArrowUp');
  await page.keyboard.press('Enter');
  await expect(center).toHaveAttribute('src', /mn-wild-jersey-model\.png$/);
});

test('clear suggestions button removes stored suggestions and messages', async ({ page }) => {
  await page.evaluate(() => {
    localStorage.setItem('shirtSuggestions', JSON.stringify([{ text: 'test', time: Date.now() }]));
  });
  await page.reload();
  const msgSelector = '.suggest-marquee';
  await expect(page.locator(msgSelector)).toHaveCount(1);
  await page.click('#clear-suggestions');
  const stored = await page.evaluate(() => localStorage.getItem('shirtSuggestions'));
  expect(stored).toBeNull();
  await expect(page.locator(msgSelector)).toHaveCount(0);
});
