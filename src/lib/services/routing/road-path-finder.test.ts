import { describe, expect, it } from 'vitest';
import { RoadPathFinder, type GeodeticProjection } from './road-path-finder.js';
import type { RouteOutcome } from './route-planner.js';

const FROM = { lon: 1, lat: 2, h: 3 };
const TO = { lon: 4, lat: 5, h: 6 };

const IDENTITY_PROJECTION: GeodeticProjection = {
	projectToLocalPoint: (lon, lat, height) => ({ east: lon, north: lat, height }),
	unprojectToGeodetic: (point) => ({ lon: point.east, lat: point.north, h: point.height })
};

function createFinder(outcome: RouteOutcome): RoadPathFinder {
	return new RoadPathFinder({ planRoute: () => outcome }, IDENTITY_PROJECTION);
}

describe('RoadPathFinder', () => {
	it('zwraca drogę po sieci przeliczoną na współrzędne geodezyjne', () => {
		const finder = createFinder({
			status: 'found',
			path: [
				{ east: 1, north: 2, height: 3 },
				{ east: 2, north: 3, height: 4 },
				{ east: 4, north: 5, height: 6 }
			],
			networkMetres: 10,
			startApproachMetres: 0,
			endApproachMetres: 0
		});
		expect(finder.findPath(FROM, TO)).toEqual([FROM, { lon: 2, lat: 3, h: 4 }, TO]);
	});

	it('zwraca linię prostą, gdy nie ma drogi', () => {
		expect(createFinder({ status: 'no-path' }).findPath(FROM, TO)).toEqual([FROM, TO]);
		expect(createFinder({ status: 'too-far-from-network' }).findPath(FROM, TO)).toEqual([FROM, TO]);
	});
});
