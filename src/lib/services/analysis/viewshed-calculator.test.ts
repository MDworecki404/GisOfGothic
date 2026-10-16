import { describe, expect, it } from 'vitest';
import type { LocalPoint } from '#lib/services/measurement/measurement-calculator.js';
import { ViewshedCalculator } from './viewshed-calculator.js';

const calculator = new ViewshedCalculator();
const origin: LocalPoint = { east: 0, north: 0, height: 100 };
const settings = { radiusMetres: 60, eyeHeightMetres: 1.7 };

function sampleTerrain(heightAtDistance: (distanceMetres: number) => number): LocalPoint[] {
	return calculator
		.buildSamplePoints(origin, settings.radiusMetres)
		.map((point) => ({ ...point, height: heightAtDistance(Math.hypot(point.east, point.north)) }));
}

describe('ViewshedCalculator', () => {
	it('buduje próbki promień po promieniu, od najbliższego pierścienia', () => {
		const points = calculator.buildSamplePoints(origin, settings.radiusMetres);
		const ringCount = calculator.countRings(settings.radiusMetres);
		expect(points).toHaveLength(calculator.azimuthCount * ringCount);
		expect(Math.hypot(points[0].east, points[0].north)).toBeCloseTo(6);
		expect(Math.hypot(points[ringCount - 1].east, points[ringCount - 1].north)).toBeCloseTo(60);
	});

	it('na płaskim terenie widać wszystko', () => {
		const result = calculator.calculate(
			origin,
			settings,
			sampleTerrain(() => 100)
		);
		expect(result.visibleAreaFraction).toBe(1);
		expect(result.cells.every((cell) => cell.isVisible)).toBe(true);
	});

	it('wzgórze zasłania teren za sobą, ale nie przed sobą', () => {
		const result = calculator.calculate(
			origin,
			settings,
			sampleTerrain((distance) => (distance > 20 && distance < 25 ? 130 : 100))
		);
		const firstAzimuthCells = result.cells.slice(0, calculator.countRings(settings.radiusMetres));
		expect(firstAzimuthCells[0].isVisible).toBe(true);
		expect(firstAzimuthCells.at(-1)?.isVisible).toBe(false);
		expect(result.visibleAreaFraction).toBeGreaterThan(0);
		expect(result.visibleAreaFraction).toBeLessThan(0.3);
	});

	it('teren wznoszący się ku obserwatorowi jest widoczny', () => {
		const result = calculator.calculate(
			origin,
			settings,
			sampleTerrain((distance) => 100 + distance * 0.5)
		);
		expect(result.visibleAreaFraction).toBe(1);
	});

	it('brak odczytu pomija komórkę i zlicza ją jako nieznaną', () => {
		const terrain: (LocalPoint | null)[] = sampleTerrain(() => 100);
		terrain[3] = null;
		const result = calculator.calculate(origin, settings, terrain);
		expect(result.unknownCellCount).toBe(1);
		expect(result.cells).toHaveLength(terrain.length - 1);
	});
});
