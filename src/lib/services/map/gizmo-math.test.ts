import { Cartesian3 } from 'cesium';
import { describe, expect, it } from 'vitest';
import {
	findClosestParameterOnLine,
	measureClockwiseAngleDegrees,
	wrapToShortestTurnDegrees
} from './gizmo-math.js';

describe('findClosestParameterOnLine', () => {
	const axisPoint = new Cartesian3(10, 0, 0);
	const axisDirection = new Cartesian3(1, 0, 0);

	it('promień prostopadły do osi trafia w jej punkt', () => {
		const parameter = findClosestParameterOnLine(
			new Cartesian3(25, 0, 100),
			new Cartesian3(0, 0, -1),
			axisPoint,
			axisDirection
		);
		expect(parameter).toBeCloseTo(15);
	});

	it('promień ukośny, który mija oś, daje punkt największego zbliżenia', () => {
		const parameter = findClosestParameterOnLine(
			new Cartesian3(0, 50, 50),
			Cartesian3.normalize(new Cartesian3(0, -1, -1), new Cartesian3()),
			axisPoint,
			axisDirection
		);
		expect(parameter).toBeCloseTo(-10);
	});

	it('promień równoległy do osi nie wyznacza parametru', () => {
		expect(
			findClosestParameterOnLine(
				new Cartesian3(0, 5, 0),
				new Cartesian3(1, 0, 0),
				axisPoint,
				axisDirection
			)
		).toBeNull();
	});
});

describe('kąty obrotu', () => {
	it('kąt od północy rośnie zgodnie z ruchem wskazówek zegara', () => {
		expect(measureClockwiseAngleDegrees(0, 1)).toBeCloseTo(0);
		expect(measureClockwiseAngleDegrees(1, 0)).toBeCloseTo(90);
		expect(measureClockwiseAngleDegrees(0, -1)).toBeCloseTo(180);
		expect(measureClockwiseAngleDegrees(-1, 0)).toBeCloseTo(-90);
	});

	it('różnicę kątów sprowadza do najkrótszego obrotu', () => {
		expect(wrapToShortestTurnDegrees(350)).toBe(-10);
		expect(wrapToShortestTurnDegrees(-190)).toBe(170);
		expect(wrapToShortestTurnDegrees(180)).toBe(180);
		expect(wrapToShortestTurnDegrees(-180)).toBe(180);
		expect(wrapToShortestTurnDegrees(45)).toBe(45);
	});
});
