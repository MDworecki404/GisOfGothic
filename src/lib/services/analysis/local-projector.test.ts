import { describe, expect, it } from 'vitest';
import { LocalProjector } from './local-projector.js';

describe('LocalProjector', () => {
	const projector = new LocalProjector({ lon: 12, lat: 48, h: 100 });

	it('kotwica leży w początku układu', () => {
		const origin = projector.projectToLocalPoint(12, 48, 100);
		expect(origin.east).toBeCloseTo(0, 6);
		expect(origin.north).toBeCloseTo(0, 6);
		expect(origin.height).toBeCloseTo(0, 6);
	});

	it('punkt na północ od kotwicy ma dodatnie N i zerowe E', () => {
		const point = projector.projectToLocalPoint(12, 48.001, 100);
		expect(point.north).toBeGreaterThan(110);
		expect(point.north).toBeLessThan(112);
		expect(Math.abs(point.east)).toBeLessThan(0.01);
	});

	it('punkt na wschód od kotwicy ma dodatnie E, a stopień szerokości 48° ma ok. 74 km', () => {
		const point = projector.projectToLocalPoint(12.001, 48, 100);
		expect(point.east).toBeGreaterThan(74);
		expect(point.east).toBeLessThan(75);
		expect(Math.abs(point.north)).toBeLessThan(0.01);
	});

	it('wysokość nad elipsoidą przechodzi na oś Góra', () => {
		const point = projector.projectToLocalPoint(12, 48, 150);
		expect(point.height).toBeCloseTo(50, 5);
		expect(point.east).toBeCloseTo(0, 5);
		expect(point.north).toBeCloseTo(0, 5);
	});
});
