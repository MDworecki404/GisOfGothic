import { test as base, expect } from '@playwright/test';

const GATE_TILESET_PATTERN = /\/ion\/\d+\/tileset\.json/;

/**
 * Pusty tileset 3D Tiles z obwiednią całego świata. Testy e2e sprawdzają aplikację, nie sieć: prawdziwe
 * kafle z Cesium ion mają długi „ogon” czasu odpowiedzi (od 1 s do ponad minuty), przez co testy czekające
 * na ich wczytanie przekraczały limity losowo. Zapytania o tileset nadal wychodzą ze strony, więc testy
 * mogą sprawdzać, że bramka została zapytana.
 */
const EMPTY_WORLD_TILESET = {
	asset: { version: '1.0' },
	geometricError: 1000,
	root: { boundingVolume: { sphere: [0, 0, 0, 6000] }, geometricError: 0, refine: 'ADD' }
};

export const test = base.extend<{ stubbedTilesetGate: void }>({
	stubbedTilesetGate: [
		async ({ page }, use) => {
			await page.route(GATE_TILESET_PATTERN, (route) =>
				route.fulfill({
					status: 200,
					contentType: 'application/json',
					headers: { 'access-control-allow-origin': '*' },
					body: JSON.stringify(EMPTY_WORLD_TILESET)
				})
			);
			await use();
		},
		{ auto: true }
	]
});

export { expect };
