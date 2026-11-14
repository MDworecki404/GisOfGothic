import { expect, test } from './support/test.js';

test.use({ serviceWorkers: 'block' });

const METRES_PER_DEGREE_OF_LONGITUDE = 111319.49;
const METRES_PER_DEGREE_OF_LATITUDE = 110574.3;

function createNode(name: string, eastMetres: number, northMetres: number) {
	return [
		name,
		Number((eastMetres / METRES_PER_DEGREE_OF_LONGITUDE).toFixed(6)),
		Number((northMetres / METRES_PER_DEGREE_OF_LATITUDE).toFixed(6)),
		0,
		0
	];
}

const smallNetwork = {
	version: 1,
	game: 'g2nk',
	world: 'NEWWORLD',
	nodes: [createNode('A', -100, -100), createNode('B', 100, -200), createNode('C', 300, -300)],
	edges: [
		[0, 1],
		[1, 2]
	]
};

test('trasa z linku jest wyznaczana po sieci dróg świata', async ({ page }) => {
	await page.route('**/g2nk/khorinis/waypoints.json', (route) =>
		route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify(smallNetwork)
		})
	);
	const errors: string[] = [];
	page.on('pageerror', (error) => errors.push(error.message));

	await page.goto('/g2nk/khorinis?narzedzie=measure&trasa=-100_-100_0~300_-300_0');

	await expect(page.getByRole('heading', { name: 'Pomiary' })).toBeVisible();
	await expect(page.getByRole('button', { name: /^Trasa/ })).toHaveAttribute(
		'aria-pressed',
		'true'
	);
	await expect(page.getByText('W poziomie', { exact: true })).toBeVisible({ timeout: 30_000 });
	await expect(page.getByText('Czas przejścia', { exact: true })).toBeVisible();
	expect(errors).toEqual([]);
});

test('świat bez sieci dróg mówi o tym w trybie Trasa', async ({ page }) => {
	await page.route('**/g2nk/khorinis/waypoints.json', (route) =>
		route.fulfill({ status: 404, body: '' })
	);

	await page.goto('/g2nk/khorinis?narzedzie=measure');
	await page.getByRole('button', { name: /^Trasa/ }).click();

	await expect(page.getByText('Ten świat nie ma sieci dróg z gry.')).toBeVisible({
		timeout: 30_000
	});
	await page.getByRole('button', { name: /^Odległość/ }).click();
	await expect(page.getByText(/Klikaj kolejne punkty na mapie/)).toBeVisible();
});

test('zepsuty parametr trasa jest ignorowany', async ({ page }) => {
	await page.goto('/g2nk/khorinis?narzedzie=measure&trasa=NaN_1~2');
	await expect(page.getByRole('heading', { name: 'Pomiary' })).toBeVisible();
	await expect(page.getByRole('button', { name: /^Odległość/ })).toHaveAttribute(
		'aria-pressed',
		'true'
	);
});
