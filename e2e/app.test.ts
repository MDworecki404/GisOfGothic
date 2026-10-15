import { expect, test } from '@playwright/test';

test('strona się ładuje: mapa Cesium, panel wyszukiwania, brak błędów w konsoli', async ({
	page
}) => {
	const errors: string[] = [];
	page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
	page.on('pageerror', (e) => errors.push(e.message));

	await page.goto('/');
	await expect(page).toHaveURL(/\/g2nk\/khorinis$/);
	await expect(page).toHaveTitle('Khorinis — GIS of Gothic');

	await expect(page.locator('[data-testid="map"] canvas')).toBeVisible({ timeout: 30_000 });
	await expect(page.getByPlaceholder('Szukaj przedmiotu lub postaci…')).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Khorinis' })).toBeVisible();
	await expect(page.getByTestId('status-bar')).toContainText(/Przedmioty: \d+ · Postacie: \d+/, {
		timeout: 90_000
	});

	expect(errors).toEqual([]);
});

test('nieznany świat pokazuje stronę błędu z linkiem do Khorinis', async ({ page }) => {
	await page.goto('/g3/myrtana');
	await expect(page.getByText('Nie ma takiego świata.')).toBeVisible();
	await page.getByRole('link', { name: 'Otwórz Khorinis' }).click();
	await expect(page).toHaveURL(/\/g2nk\/khorinis$/);
});
