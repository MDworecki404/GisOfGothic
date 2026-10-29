import { describe, expect, it } from 'vitest';
import { SlicePlaneCalculator } from './slice-plane-calculator.js';

describe('SlicePlaneCalculator', () => {
	const calculator = new SlicePlaneCalculator();

	it('odległość płaszczyzny to wysokość cięcia względem początku układu', () => {
		expect(calculator.calculatePlaneDistance(120, 100)).toBe(20);
		expect(calculator.calculatePlaneDistance(100, 100)).toBe(0);
		expect(calculator.calculatePlaneDistance(-5, 10)).toBe(-15);
	});

	it('normalna skierowana w dół zostawia część poniżej płaszczyzny', () => {
		expect(calculator.planeNormal).toEqual({ x: 0, y: 0, z: -1 });
	});
});
