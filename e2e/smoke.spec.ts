import { expect, test } from '@playwright/test';

test('abre a aplicação sem falha e exibe HH:MM', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto('/');
  await expect(page.locator('#display')).toHaveText('00:00');
  expect(errors).toEqual([]);
});
