import { describe, expect, it } from 'vitest';
import { CachingPolicy } from './caching-policy.js';

const policy = new CachingPolicy('https://gisofgothic.app');

function strategyFor(path: string, mode = 'cors', method = 'GET') {
	const url = path.startsWith('http') ? path : `https://gisofgothic.app${path}`;
	return policy.chooseStrategy({ url, method, mode });
}

describe('CachingPolicy', () => {
	it('strony: najpierw sieć, bez niej zapisana powłoka', () => {
		expect(strategyFor('/g2nk/khorinis?wpis=item:ITPL_PERM_HERB', 'navigate')).toBe(
			'network-first-page'
		);
	});

	it('pliki z hashem i zasoby Cesium: najpierw pamięć', () => {
		expect(strategyFor('/_app/immutable/chunks/Dd8qAkJd.js')).toBe('cache-first');
		expect(strategyFor('/cesiumStatic/Workers/createVerticesFromHeightmap.js')).toBe('cache-first');
	});

	it('dane świata: z pamięci i odświeżenie w tle', () => {
		expect(strategyFor('/data/g2nk/khorinis/search_index.json')).toBe('stale-while-revalidate');
		expect(strategyFor('/manifest.webmanifest')).toBe('stale-while-revalidate');
	});

	it('obce adresy, sprawdzanie wersji i inne metody idą prosto do sieci', () => {
		expect(strategyFor('https://assets.ion.cesium.com/us-east-1/6033666/tileset.json')).toBe(
			'network-only'
		);
		expect(
			strategyFor(
				'https://gis-of-gothic-model-gate.marek-dworecki01.workers.dev/g2nk/khorinis/items/a.bin'
			)
		).toBe('network-only');
		expect(strategyFor('/_app/version.json')).toBe('network-only');
		expect(strategyFor('/data/g2nk/khorinis/metadata.json', 'cors', 'POST')).toBe('network-only');
	});
});

describe('CachingPolicy.canStore', () => {
	it('zapisuje poprawne pliki i strony', () => {
		expect(policy.canStore({ mode: 'cors' }, { ok: true, contentType: 'text/javascript' })).toBe(
			true
		);
		expect(
			policy.canStore({ mode: 'navigate' }, { ok: true, contentType: 'text/html; charset=utf-8' })
		).toBe(true);
	});

	it('nie zapisuje HTML-a podanego zamiast brakującego pliku', () => {
		expect(
			policy.canStore({ mode: 'cors' }, { ok: true, contentType: 'text/html; charset=utf-8' })
		).toBe(false);
	});

	it('nie zapisuje błędów', () => {
		expect(policy.canStore({ mode: 'cors' }, { ok: false, contentType: 'text/javascript' })).toBe(
			false
		);
	});
});
