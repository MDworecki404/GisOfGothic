import { describe, expect, it } from 'vitest';
import { NearestPlacesFinder } from './nearest-places-finder.js';

const finder = new NearestPlacesFinder();
const origin = { east: 0, north: 0, height: 0 };

describe('NearestPlacesFinder', () => {
	it('zwraca najbliższe miejsca od najbliższego, z odległością w poziomie i po prostej', () => {
		const matches = finder.findNearest(
			origin,
			[
				{ east: 100, north: 0, height: 0 },
				{ east: 30, north: 0, height: 40 },
				{ east: 0, north: 20, height: 0 }
			],
			2
		);
		expect(matches.map((match) => match.straightMetres)).toEqual([20, 50]);
		expect(matches[1].horizontalMetres).toBe(30);
		expect(matches[1].candidate).toEqual({ east: 30, north: 0, height: 40 });
	});

	it('zwraca wszystkich, gdy kandydatów jest mniej niż żądano', () => {
		expect(finder.findNearest(origin, [{ east: 1, north: 1, height: 1 }], 5)).toHaveLength(1);
	});

	it('nie zmienia kolejności listy wejściowej', () => {
		const candidates = [
			{ east: 9, north: 0, height: 0 },
			{ east: 1, north: 0, height: 0 }
		];
		finder.findNearest(origin, candidates, 2);
		expect(candidates[0].east).toBe(9);
	});
});
