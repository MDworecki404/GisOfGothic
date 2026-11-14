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

describe('LocalProjector: odwrotne rzutowanie', () => {
	const anchors = [
		{ lon: 0, lat: 0, h: 0 },
		{ lon: 19.9, lat: 50.06, h: 200 }
	];
	const offsets = [
		{ lon: 0.001, lat: 0.002, h: 12 },
		{ lon: -0.03, lat: 0.04, h: -35 },
		{ lon: 0.045, lat: -0.02, h: 120 }
	];

	it.each(anchors)('odwrotne rzutowanie wraca do lon/lat/h dla kotwicy %o', (anchor) => {
		const projector = new LocalProjector(anchor);
		for (const offset of offsets) {
			const lon = anchor.lon + offset.lon;
			const lat = anchor.lat + offset.lat;
			const h = anchor.h + offset.h;
			const geodetic = projector.unprojectToGeodetic(projector.projectToLocalPoint(lon, lat, h));
			expect(geodetic.lon).toBeCloseTo(lon, 7);
			expect(geodetic.lat).toBeCloseTo(lat, 7);
			expect(geodetic.h).toBeCloseTo(h, 2);
		}
	});

	it('punkt kotwicy to zero metrów i odwrotnie', () => {
		const anchor = { lon: 12, lat: 48, h: 100 };
		const projector = new LocalProjector(anchor);
		const geodetic = projector.unprojectToGeodetic({ east: 0, north: 0, height: 0 });
		expect(geodetic.lon).toBeCloseTo(12, 9);
		expect(geodetic.lat).toBeCloseTo(48, 9);
		expect(geodetic.h).toBeCloseTo(100, 4);
	});
});
