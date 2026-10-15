import { expect, test } from '@playwright/test';

test('strona się ładuje: mapa Cesium, panel wyszukiwania, brak błędów w konsoli', async ({
	page
}) => {
	const errors: string[] = [];
	page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
	page.on('pageerror', (e) => errors.push(e.message));

	await page.goto('/');

	await expect(page.locator('[data-testid="map"] canvas')).toBeVisible({ timeout: 30_000 });
	await expect(page.getByPlaceholder('Szukaj przedmiotu lub postaci…')).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Khorinis' })).toBeVisible();
	// pasek statusu: po wczytaniu świata pokazuje liczby z indeksu
	await expect(page.getByTestId('status-bar')).toContainText(/Przedmioty: \d+ · Postacie: \d+/, {
		timeout: 90_000
	});

	expect(errors).toEqual([]);
});
