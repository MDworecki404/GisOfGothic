import { BOOK_URL, expect, test } from './support/test.js';

test('adres z narzedzie=search otwiera Księgę, a sam adres nie', async ({ page }) => {
	await page.goto('/g2nk/khorinis');
	await expect(page.getByRole('button', { name: 'Szukaj przedmiotu lub postaci' })).toBeVisible();
	await expect(page.getByRole('searchbox')).toHaveCount(0);

	await page.goto(BOOK_URL);
	await expect(page.getByRole('searchbox')).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Wyszukiwarka' })).toBeAttached();
});

test('Ctrl K otwiera Księgę z fokusem w polu wyszukiwania', async ({ page }) => {
	await page.goto('/g2nk/khorinis');
	await expect(page.getByRole('button', { name: 'Szukaj przedmiotu lub postaci' })).toBeVisible();
	await page.keyboard.press('Control+k');
	await expect(page.getByRole('searchbox')).toBeFocused();
});

test('przycisk w nagłówku otwiera Księgę', async ({ page }) => {
	await page.goto('/g2nk/khorinis');
	await page.getByRole('button', { name: 'Szukaj przedmiotu lub postaci' }).click();
	await expect(page.getByRole('searchbox')).toBeVisible();
});

test('pisanie w Księdze zawęża listę do wpisu', async ({ page }) => {
	await page.goto(BOOK_URL);
	await page.getByRole('searchbox').fill('szczaw krolewski');
	await expect(page.getByRole('button', { name: /Szczaw królewski/ })).toBeVisible();
});

test('Esc zamyka Księgę', async ({ page }) => {
	await page.goto(BOOK_URL);
	await expect(page.getByRole('searchbox')).toBeVisible();
	await page.keyboard.press('Escape');
	await expect(page.getByRole('searchbox')).toHaveCount(0);
});

test('kliknięcie nakładki zamyka Księgę', async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 720 });
	await page.goto(BOOK_URL);
	await expect(page.getByRole('searchbox')).toBeVisible();
	await page.mouse.click(5, 360);
	await expect(page.getByRole('searchbox')).toHaveCount(0);
});

test('Księga na telefonie ma jedną kolumnę i przycisk Wróć do wyników po wyborze wpisu', async ({
	page
}) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto(BOOK_URL);
	await page.getByRole('searchbox').fill('szczaw krolewski');
	await page.getByRole('button', { name: /Szczaw królewski/ }).click();
	await expect(page.getByRole('button', { name: 'Wróć do wyników' })).toBeVisible();
	await expect(page.getByRole('searchbox')).toBeHidden();
	const hasHorizontalScroll = await page.evaluate(
		() => document.documentElement.scrollWidth > document.documentElement.clientWidth
	);
	expect(hasHorizontalScroll).toBe(false);
	await page.getByRole('button', { name: 'Wróć do wyników' }).click();
	await expect(page.getByRole('searchbox')).toBeVisible();
});
