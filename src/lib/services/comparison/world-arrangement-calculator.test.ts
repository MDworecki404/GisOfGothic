import { describe, expect, it } from 'vitest';
import type { WorldExtent } from '#lib/services/map/world-extent-reader.js';
import { WorldArrangementCalculator } from './world-arrangement-calculator.js';

const calculator = new WorldArrangementCalculator();
const reference: WorldExtent = {
	centerEast: 1000,
	centerNorth: 500,
	centerUp: 20,
	widthMetres: 1600,
	depthMetres: 1700
};
const large: WorldExtent = {
	centerEast: 10,
	centerNorth: -20,
	centerUp: 5,
	widthMetres: 4900,
	depthMetres: 5000
};

describe('WorldArrangementCalculator', () => {
	it('współśrodkowo: środek świata trafia na środek otwartego', () => {
		const [placement] = calculator.arrange('concentric', reference, [large]);
		expect(large.centerEast + placement.east).toBe(reference.centerEast);
		expect(large.centerNorth + placement.north).toBe(reference.centerNorth);
		expect(large.centerUp + placement.up).toBe(reference.centerUp);
	});

	it('od narożnika: południowo-zachodnie krawędzie obu światów się pokrywają', () => {
		const [placement] = calculator.arrange('southwest-corner', reference, [large]);
		const westEdge = large.centerEast + placement.east - large.widthMetres / 2;
		const southEdge = large.centerNorth + placement.north - large.depthMetres / 2;
		expect(westEdge).toBe(reference.centerEast - reference.widthMetres / 2);
		expect(southEdge).toBe(reference.centerNorth - reference.depthMetres / 2);
	});

	it('w rzędzie: światy leżą na wschód od otwartego, nie nachodzą na siebie i mają wspólną krawędź południową', () => {
		const second: WorldExtent = { ...large, widthMetres: 800, depthMetres: 900 };
		const [first, next] = calculator.arrange('row', reference, [large, second]);
		const firstWest = large.centerEast + first.east - large.widthMetres / 2;
		const firstEast = firstWest + large.widthMetres;
		const nextWest = second.centerEast + next.east - second.widthMetres / 2;
		expect(firstWest).toBeGreaterThan(reference.centerEast + reference.widthMetres / 2);
		expect(nextWest).toBeGreaterThan(firstEast);
		const firstSouth = large.centerNorth + first.north - large.depthMetres / 2;
		const nextSouth = second.centerNorth + next.north - second.depthMetres / 2;
		expect(nextSouth).toBeCloseTo(firstSouth);
	});
});
