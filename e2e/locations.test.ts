import { BOOK_URL, expect, test } from './support/test.js';

test.use({ serviceWorkers: 'block' });

const LOCATIONS_STUB = {
	version: 1,
	game: 'g2nk',
	world: 'NEWWORLD',
	locations: [
		{
			id: 'location:passage:TEST',
			kind: 'passage',
			name: 'Przejście do: Górnicza Dolina',
			name_source: 'derived',
			code: 'TEST',
			center: [0.0027, -0.0041, 50],
			radius_m: 6,
			polygon: null,
			waypoint: null,
			passage: {
				to_world: 'g2nk/gornicza-dolina',
				to_level: 'OLDWORLD.ZEN',
				arrival: [0.0006, 0.0037, 65]
			}
		},
		{
			id: 'location:KHORINIS',
			kind: 'town',
			name: 'Khorinis',
			name_source: 'derived',
			code: 'KHORINIS',
			center: [0.0003, -0.00006, 8],
			radius_m: 157,
			polygon: null,
			waypoint: null
		}
	]
};

test.beforeEach(async ({ page }) => {
	await page.route('**/g2nk/khorinis/locations.json', (route) =>
		route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify(LOCATIONS_STUB)
		})
	);
});

test('lokacje są wpisami Księgi z filtrem rodzaju', async ({ page }) => {
	await page.goto(BOOK_URL);
	await page.getByRole('button', { name: 'Lokacje', exact: true }).click();
	await expect(page.getByRole('button', { name: /^Khorinis Miasto lub osada/ })).toBeVisible();
	await expect(page.getByRole('button', { name: /Przejście do: Górnicza Dolina/ })).toBeVisible();
});

test('przejście z karty wpisu otwiera świat docelowy z widokiem na punkt przybycia', async ({
	page
}) => {
	await page.goto(BOOK_URL);
	await page.getByRole('button', { name: 'Lokacje', exact: true }).click();
	await page.getByRole('button', { name: /Przejście do: Górnicza Dolina/ }).click();
	await page.getByRole('button', { name: 'Przejdź do tego świata' }).click();
	await expect(page).toHaveURL(/\/g2nk\/gornicza-dolina\?.*widok=/);
});

test('lokacja bez przejścia nie ma przycisku przejścia', async ({ page }) => {
	await page.goto(BOOK_URL);
	await page.getByRole('button', { name: 'Lokacje', exact: true }).click();
	await page.getByRole('button', { name: /^Khorinis/ }).click();
	await expect(page.getByRole('button', { name: 'Pokaż na mapie' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Przejdź do tego świata' })).toHaveCount(0);
});
