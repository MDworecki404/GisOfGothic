import { describe, expect, it } from 'vitest';
import { StickDeflectionCalculator } from './stick-deflection-calculator.js';

const calculator = new StickDeflectionCalculator();

describe('StickDeflectionCalculator', () => {
	it('w strefie martwej nie wychyla', () => {
		expect(calculator.calculate(3, -3, 50)).toEqual({ x: 0, y: 0 });
	});

	it('wychylenie w górę ekranu daje dodatnie y, a w prawo dodatnie x', () => {
		const up = calculator.calculate(0, -50, 50);
		expect(up.x).toBeCloseTo(0);
		expect(up.y).toBeCloseTo(1);
		expect(calculator.calculate(50, 0, 50).x).toBeCloseTo(1);
	});

	it('nie przekracza długości 1, gdy palec wyjedzie poza gałkę', () => {
		const far = calculator.calculate(300, -400, 50);
		expect(Math.hypot(far.x, far.y)).toBeCloseTo(1);
	});

	it('przy nieprawidłowym promieniu nie wychyla', () => {
		expect(calculator.calculate(10, 10, 0)).toEqual({ x: 0, y: 0 });
	});
});
