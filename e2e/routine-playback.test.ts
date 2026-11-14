import { expect, test } from './support/test.js';

test.use({ serviceWorkers: 'block' });

const DEGREES_PER_METRE = 1 / 111319.49;

function createRoutinePlace(id: string, eastMetres: number, times: string[]) {
	return {
		type: 'Feature',
		geometry: { type: 'Point', coordinates: [eastMetres * DEGREES_PER_METRE, 0, 0] },
		properties: {
			id,
			npc_code: 'NPC_ALPHA',
			npc_name: 'Alfa',
			routine: 'START',
			is_default: true,
			waypoint: id,
			times,
			actions: []
		}
	};
}

const routineFile = {
	type: 'FeatureCollection',
	features: [
		createRoutinePlace('ALPHA_NIGHT', 0, ['22:00–07:00']),
		createRoutinePlace('ALPHA_DAY', 143, ['07:00–22:00'])
	]
};

const spawnFile = {
	type: 'FeatureCollection',
	features: [
		{
			type: 'Feature',
			geometry: { type: 'Point', coordinates: [0, 0, 0] },
			properties: { id: 'spawn-alpha', code: 'NPC_ALPHA', name: 'Alfa', chapter: null }
		}
	]
};

function createNode(name: string, eastMetres: number) {
	return [name, Number((eastMetres * DEGREES_PER_METRE).toFixed(6)), 0, 0, 0];
}

const roadNetwork = {
	version: 1,
	game: 'g2nk',
	world: 'NEWWORLD',
	nodes: [createNode('A', 0), createNode('B', 100), createNode('C', 200)],
	edges: [
		[0, 1],
		[1, 2]
	]
};

test('odtwarzanie doby prowadzi postacie po drogach i da się zatrzymać', async ({ page }) => {
	const errors: string[] = [];
	page.on('pageerror', (error) => errors.push(error.message));
	await page.route('**/g2nk/khorinis/character_places.geojson', (route) =>
		route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify(routineFile)
		})
	);
	await page.route('**/g2nk/khorinis/npcs.geojson', (route) =>
		route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(spawnFile) })
	);
	await page.route('**/g2nk/khorinis/waypoints.json', (route) =>
		route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify(roadNetwork)
		})
	);

	await page.goto('/g2nk/khorinis?narzedzie=time');
	await page.getByRole('button', { name: 'Odtwórz', exact: true }).click();

	await expect(page.getByText('Na drogach: 1, bez drogi: 0')).toBeVisible({ timeout: 30_000 });
	await expect(page.getByRole('button', { name: 'Zatrzymaj', exact: true })).toBeVisible();
	await page.getByRole('button', { name: 'Szybko', exact: true }).click();
	await expect(page.getByRole('button', { name: 'Szybko', exact: true })).toHaveAttribute(
		'aria-pressed',
		'true'
	);

	await page.getByRole('button', { name: 'Zatrzymaj', exact: true }).click();
	await expect(page.getByRole('button', { name: 'Odtwórz', exact: true })).toBeVisible();
	expect(errors).toEqual([]);
});

test('świat bez sieci dróg: postacie skaczą, a panel mówi, ile', async ({ page }) => {
	await page.route('**/g2nk/khorinis/character_places.geojson', (route) =>
		route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify(routineFile)
		})
	);
	await page.route('**/g2nk/khorinis/npcs.geojson', (route) =>
		route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(spawnFile) })
	);
	await page.route('**/g2nk/khorinis/waypoints.json', (route) =>
		route.fulfill({ status: 404, body: '' })
	);

	await page.goto('/g2nk/khorinis?narzedzie=time');
	await page.getByRole('button', { name: 'Odtwórz', exact: true }).click();

	await expect(page.getByText('Na drogach: 0, bez drogi: 1')).toBeVisible({ timeout: 30_000 });
});
