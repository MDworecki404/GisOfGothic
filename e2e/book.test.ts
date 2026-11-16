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

const SELECTED_ENTRY_CARD = 'Wybrany wpis';

async function selectHerbInBook(page: import('@playwright/test').Page): Promise<void> {
	await page.goto(BOOK_URL);
	await page.getByRole('searchbox').fill('szczaw krolewski');
	await page.getByRole('button', { name: /Szczaw królewski/ }).click();
	await expect(page.getByRole('region', { name: 'Karta wpisu' })).toBeVisible();
}

test('po zamknięciu Księgi wybrany wpis zostaje na karcie przy mapie', async ({ page }) => {
	await selectHerbInBook(page);
	await page.keyboard.press('Escape');
	const card = page.getByRole('complementary', { name: SELECTED_ENTRY_CARD });
	await expect(card).toContainText('Szczaw królewski');
	await expect(page).toHaveURL(/wpis=item%3AITPL_PERM_HERB/);
});

test('„Pokaż na mapie” zamyka Księgę i zostawia kartę wpisu', async ({ page }) => {
	await selectHerbInBook(page);
	await page.getByRole('button', { name: 'Pokaż na mapie' }).click();
	await expect(page.getByRole('searchbox')).toHaveCount(0);
	await expect(page.getByRole('complementary', { name: SELECTED_ENTRY_CARD })).toBeVisible();
});

test('przycisk „Otwórz w Księdze” wraca do karty wpisu w Księdze', async ({ page }) => {
	await selectHerbInBook(page);
	await page.keyboard.press('Escape');
	await page.getByRole('button', { name: 'Otwórz w Księdze' }).click();
	await expect(page.getByRole('searchbox')).toBeVisible();
	await expect(
		page
			.getByRole('region', { name: 'Karta wpisu' })
			.getByRole('heading', { name: 'Szczaw królewski' })
	).toBeVisible();
});

test('zamknięcie karty usuwa wpis z adresu', async ({ page }) => {
	await selectHerbInBook(page);
	await page.keyboard.press('Escape');
	await page.getByRole('button', { name: 'Zamknij kartę wpisu' }).click();
	await expect(page.getByRole('complementary', { name: SELECTED_ENTRY_CARD })).toHaveCount(0);
	await expect(page).not.toHaveURL(/wpis=/);
});

test('adres z samym wpisem pokazuje kartę przy mapie, a nie Księgę', async ({ page }) => {
	await page.goto('/g2nk/khorinis?wpis=item:ITPL_PERM_HERB');
	await expect(page.getByRole('complementary', { name: SELECTED_ENTRY_CARD })).toContainText(
		'Szczaw królewski',
		{ timeout: 30_000 }
	);
	await expect(page.getByRole('searchbox')).toHaveCount(0);
});

test('karta wpisu nie nakłada się na kontrolki mapy', async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 720 });
	await page.goto('/g2nk/khorinis?wpis=item:ITPL_PERM_HERB');
	const card = page.getByRole('complementary', { name: SELECTED_ENTRY_CARD });
	await expect(card).toBeVisible({ timeout: 30_000 });
	const cardBox = await card.boundingBox();
	const compassBox = await page.getByRole('button', { name: 'Obróć mapę na północ' }).boundingBox();
	if (!cardBox || !compassBox) throw new Error('Brak karty albo kompasu');
	const overlaps =
		cardBox.x < compassBox.x + compassBox.width &&
		compassBox.x < cardBox.x + cardBox.width &&
		cardBox.y < compassBox.y + compassBox.height &&
		compassBox.y < cardBox.y + cardBox.height;
	expect(overlaps).toBe(false);
});

test('na telefonie karta wpisu nie zasłania przycisków kontrolek mapy', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/g2nk/khorinis?wpis=item:ITPL_PERM_HERB');
	const card = page.getByRole('complementary', { name: SELECTED_ENTRY_CARD });
	await expect(card).toBeVisible({ timeout: 30_000 });
	const cardBox = await card.boundingBox();
	if (!cardBox) throw new Error('Brak karty');
	const controlNames = ['Obróć mapę na północ', 'Przybliż', 'Oddal', 'Pokaż cały świat', 'Widok'];
	for (const name of controlNames) {
		const box = await page.getByRole('button', { name, exact: true }).boundingBox();
		if (!box) throw new Error(`Brak przycisku ${name}`);
		expect(box.y + box.height, name).toBeLessThanOrEqual(cardBox.y + 1);
	}
});

test('podgląd 3D w karcie wpisu ma pasek sterowania z polskimi podpisami', async ({ page }) => {
	await page.goto(BOOK_URL);
	await page.getByRole('searchbox').fill('szczaw krolewski');
	await page.getByRole('button', { name: /Szczaw królewski/ }).click();

	const toolbar = page.getByRole('toolbar', { name: 'Sterowanie podglądem 3D' });
	await expect(toolbar).toBeVisible();
	for (const name of [
		'Przechyl model w górę',
		'Przechyl model w dół',
		'Przybliż model',
		'Oddal model',
		'Przywróć domyślny widok'
	]) {
		await expect(toolbar.getByRole('button', { name })).toBeVisible();
	}

	const autoRotation = toolbar.getByRole('button', { name: 'Obracaj model automatycznie' });
	await expect(autoRotation).toHaveAttribute('aria-pressed', 'false');
	await autoRotation.click();
	await expect(autoRotation).toHaveAttribute('aria-pressed', 'true');
	await autoRotation.click();
	await expect(autoRotation).toHaveAttribute('aria-pressed', 'false');

	await toolbar.getByRole('button', { name: 'Pokaż na pełnym ekranie' }).click();
	const closeFullscreen = toolbar.getByRole('button', { name: 'Zamknij pełny ekran' });
	await expect(closeFullscreen).toBeVisible();
	await closeFullscreen.click();
	await expect(toolbar.getByRole('button', { name: 'Pokaż na pełnym ekranie' })).toBeVisible();
});
