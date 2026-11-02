import { Cartesian3, Matrix4 } from 'cesium';
import { describe, expect, it } from 'vitest';
import { NATIVE_PLACEMENT, WorldPlacementCalculator } from './world-placement-calculator.js';

const calculator = new WorldPlacementCalculator();
const pivot = { centerEast: 100, centerNorth: 200 };

function transformPoint(matrix: Matrix4, east: number, north: number, up = 0): Cartesian3 {
	return Matrix4.multiplyByPoint(matrix, new Cartesian3(east, north, up), new Cartesian3());
}

describe('WorldPlacementCalculator', () => {
	it('pozycja natywna nie zmienia świata', () => {
		const matrix = calculator.buildModelMatrix(Matrix4.IDENTITY, pivot, NATIVE_PLACEMENT);
		const point = transformPoint(matrix, 150, 260, 5);
		expect([point.x, point.y, point.z]).toEqual([150, 260, 5]);
	});

	it('przesunięcie dodaje się do wschodu, północy i wysokości', () => {
		const matrix = calculator.buildModelMatrix(Matrix4.IDENTITY, pivot, {
			east: 10,
			north: -20,
			up: 3,
			headingDegrees: 0
		});
		const point = transformPoint(matrix, 150, 260, 5);
		expect([point.x, point.y, point.z]).toEqual([160, 240, 8]);
	});

	it('obrót kręci świat wokół środka obrysu zgodnie z ruchem wskazówek zegara', () => {
		const matrix = calculator.buildModelMatrix(Matrix4.IDENTITY, pivot, {
			...NATIVE_PLACEMENT,
			headingDegrees: 90
		});
		const centre = transformPoint(matrix, 100, 200);
		expect(centre.x).toBeCloseTo(100);
		expect(centre.y).toBeCloseTo(200);
		const eastOfCentre = transformPoint(matrix, 110, 200);
		expect(eastOfCentre.x).toBeCloseTo(100);
		expect(eastOfCentre.y).toBeCloseTo(190);
	});

	it('obrót i przesunięcie składają się: najpierw obrót w miejscu, potem ruch', () => {
		const matrix = calculator.buildModelMatrix(Matrix4.IDENTITY, pivot, {
			east: 50,
			north: 0,
			up: 0,
			headingDegrees: 180
		});
		const point = transformPoint(matrix, 110, 200);
		expect(point.x).toBeCloseTo(140);
		expect(point.y).toBeCloseTo(200);
	});

	it('macierz kotwicy jest nakładana na końcu', () => {
		const anchorToEcef = Matrix4.fromTranslation(new Cartesian3(1000, 0, 0));
		const matrix = calculator.buildModelMatrix(anchorToEcef, pivot, NATIVE_PLACEMENT);
		expect(transformPoint(matrix, 0, 0).x).toBeCloseTo(1000);
	});
});
