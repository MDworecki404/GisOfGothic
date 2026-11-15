import { describe, expect, it } from 'vitest';
import { parseLocationCatalog } from './location-parsers.js';

const CAMP = {
	id: 'location:OC',
	kind: 'camp',
	name: 'Stary Obóz',
	name_source: 'derived',
	code: 'OC',
	center: [0.001, -0.002, 30],
	radius_m: 120,
	polygon: null,
	waypoint: 'OC_CENTER'
};

describe('parseLocationCatalog', () => {
	it('czyta lokację z zasięgiem i najbliższym punktem dróg', () => {
		const [location] = parseLocationCatalog({ version: 1, locations: [CAMP] });
		expect(location).toMatchObject({
			id: 'location:OC',
			kind: 'camp',
			nameSource: 'derived',
			center: { lon: 0.001, lat: -0.002, h: 30 },
			radiusMetres: 120,
			waypoint: 'OC_CENTER',
			passage: null
		});
	});

	it('czyta przejście z celem w paczce i bez punktu przybycia', () => {
		const [location] = parseLocationCatalog({
			version: 1,
			locations: [
				{
					...CAMP,
					kind: 'passage',
					passage: { to_world: 'g2nk/gornicza-dolina', to_level: 'OLDWORLD.ZEN', arrival: null }
				}
			]
		});
		expect(location?.passage).toEqual({
			toWorld: 'g2nk/gornicza-dolina',
			toLevel: 'OLDWORLD.ZEN',
			arrival: null
		});
	});

	it('odrzuca nieznany rodzaj lokacji', () => {
		expect(() =>
			parseLocationCatalog({ version: 1, locations: [{ ...CAMP, kind: 'ufo' }] })
		).toThrow(/nieznany rodzaj/);
	});
});
