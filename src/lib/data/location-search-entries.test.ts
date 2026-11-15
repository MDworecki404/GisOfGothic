import { describe, expect, it } from 'vitest';
import { parseLocationCatalog } from './location-parsers.js';
import { buildSearchEntryFromLocation } from './location-search-entries.js';

describe('buildSearchEntryFromLocation', () => {
	it('tworzy wpis wyszukiwarki z jednym miejscem w środku lokacji', () => {
		const [location] = parseLocationCatalog({
			version: 1,
			locations: [
				{
					id: 'location:KHORINIS',
					kind: 'town',
					name: 'Khorinis',
					name_source: 'derived',
					code: 'KHORINIS',
					center: [0.0003, -0.00006, 8],
					radius_m: 157,
					waypoint: null
				}
			]
		});
		if (!location) throw new Error('brak lokacji');
		const entry = buildSearchEntryFromLocation(location);
		expect(entry).toMatchObject({
			id: 'location:KHORINIS',
			type: 'location',
			name: 'Khorinis',
			category: 'Miasto lub osada',
			places: [{ kind: 'location', lon: 0.0003, lat: -0.00006, h: 8 }]
		});
	});
});
