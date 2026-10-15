import { describe, expect, it } from 'vitest';
import { MeasurementCalculator } from './measurement-calculator.js';

const calculator = new MeasurementCalculator();

describe('MeasurementCalculator', () => {
	it('sumuje odległość łamanej w poziomie i w przestrzeni', () => {
		const summary = calculator.summarizePath([
			{ east: 0, north: 0, height: 10 },
			{ east: 30, north: 40, height: 10 },
			{ east: 30, north: 40, height: 22 }
		]);
		expect(summary.horizontalMetres).toBe(50);
		expect(summary.straightMetres).toBe(62);
		expect(summary.heightDifferenceMetres).toBe(12);
	});

	it('rozkłada odcinek na równe kroki razem z końcami', () => {
		const samples = calculator.interpolateAlongPath(
			[
				{ east: 0, north: 0, height: 0 },
				{ east: 10, north: 0, height: 0 }
			],
			2.5
		);
		expect(samples.map((sample) => sample.east)).toEqual([0, 2.5, 5, 7.5, 10]);
	});

	it('liczy profil: długość po terenie, podejścia i zejścia', () => {
		const profile = calculator.summarizeProfile([
			{ east: 0, north: 0, height: 0 },
			{ east: 3, north: 0, height: 4 },
			{ east: 6, north: 0, height: 0 }
		]);
		expect(profile).toMatchObject({
			terrainMetres: 10,
			ascentMetres: 4,
			descentMetres: 4,
			minimumHeight: 0,
			maximumHeight: 4
		});
		expect(profile?.samples.at(-1)).toEqual({ distanceMetres: 6, height: 0 });
	});

	it('usuwa wąską przeszkodę (drzewo), a zostawia zbocze', () => {
		const heights = [10, 10, 10, 25, 10, 10, 11, 12, 13, 14];
		const smoothed = calculator.removeNarrowObstacles(
			heights.map((height, index) => ({ east: index * 2, north: 0, height })),
			5
		);
		expect(smoothed.map((point) => point.height)).toEqual([10, 10, 10, 10, 10, 11, 11, 12, 13, 13]);
	});

	it('nie tworzy profilu z jednego punktu', () => {
		expect(calculator.summarizeProfile([{ east: 0, north: 0, height: 0 }])).toBeNull();
	});
});
