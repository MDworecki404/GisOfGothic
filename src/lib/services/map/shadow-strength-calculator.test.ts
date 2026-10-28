import { describe, expect, it } from 'vitest';
import { ShadowStrengthCalculator } from './shadow-strength-calculator.js';

describe('ShadowStrengthCalculator', () => {
	const calculator = new ShadowStrengthCalculator();

	it('nocą (słońce pod horyzontem) nie pokazuje cieni', () => {
		expect(calculator.areShadowsVisible(-0.75)).toBe(false);
		expect(calculator.areShadowsVisible(0)).toBe(false);
	});

	it('w dzień pokazuje cienie', () => {
		expect(calculator.areShadowsVisible(0.5)).toBe(true);
	});

	it('w pełnym słońcu ma stałą, ciemną wartość', () => {
		expect(calculator.calculateDarkness(1)).toBeCloseTo(0.45);
		expect(calculator.calculateDarkness(0.35)).toBeCloseTo(0.45);
	});

	it('przy horyzoncie cień znika, a między nimi narasta płynnie', () => {
		expect(calculator.calculateDarkness(0.05)).toBeCloseTo(1);
		const dusk = calculator.calculateDarkness(0.2);
		expect(dusk).toBeGreaterThan(0.45);
		expect(dusk).toBeLessThan(1);
	});
});
