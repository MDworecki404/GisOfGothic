import { describe, expect, it } from 'vitest';
import { BufferAnalyzer, type BufferCandidate } from './buffer-analyzer.js';

const analyzer = new BufferAnalyzer();
const origin = { east: 0, north: 0, height: 5 };

function candidate(
	groupId: string,
	label: string,
	east: number,
	quantity = 1,
	north = 0
): BufferCandidate {
	return { groupId, label, quantity, east, north, height: 0 };
}

describe('BufferAnalyzer', () => {
	it('liczy tylko obiekty w promieniu, w poziomie, a granica należy do koła', () => {
		const groups = analyzer.groupWithinRadius(
			origin,
			50,
			[
				candidate('items', 'Ziele', 50),
				candidate('items', 'Ziele', 50.1),
				candidate('items', 'Ziele', 30, 1, 40)
			],
			['items']
		);
		expect(groups[0].total).toBe(2);
	});

	it('sumuje ilości o tej samej etykiecie i układa od najliczniejszej', () => {
		const [group] = analyzer.groupWithinRadius(
			origin,
			100,
			[
				candidate('items', 'Złoto', 10, 3),
				candidate('items', 'Ziele', 20),
				candidate('items', 'Złoto', 30, 4),
				candidate('items', 'Chleb', 40)
			],
			['items']
		);
		expect(group.lines).toEqual([
			{ label: 'Złoto', quantity: 7 },
			{ label: 'Chleb', quantity: 1 },
			{ label: 'Ziele', quantity: 1 }
		]);
		expect(group.total).toBe(9);
	});

	it('zwraca grupy w zadanej kolejności, także puste, i pomija nieznane grupy', () => {
		const groups = analyzer.groupWithinRadius(
			origin,
			10,
			[candidate('npcs', 'Harad', 1), candidate('inne', 'x', 1)],
			['items', 'containers', 'npcs']
		);
		expect(groups.map((group) => [group.groupId, group.total])).toEqual([
			['items', 0],
			['containers', 0],
			['npcs', 1]
		]);
	});

	it('buduje zamknięty pierścień o zadanym promieniu', () => {
		const ring = analyzer.buildRing(origin, 20);
		expect(ring.at(0)?.east).toBeCloseTo(20);
		expect(ring.at(-1)?.east).toBeCloseTo(20);
		expect(ring.every((point) => Math.hypot(point.east, point.north) - 20 < 1e-9)).toBe(true);
		expect(ring.every((point) => point.height === 5)).toBe(true);
	});
});
