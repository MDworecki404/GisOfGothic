import { describe, expect, it } from 'vitest';
import { ScaleBarCalculator } from './scale-bar-calculator.js';

const calculator = new ScaleBarCalculator(120);

describe('ScaleBarCalculator', () => {
	it('dobiera okrągłą długość mieszczącą się w szerokości', () => {
		expect(calculator.calculate(2.5)).toEqual({ widthPixels: 80, label: '200 m' });
		expect(calculator.calculate(1)).toEqual({ widthPixels: 100, label: '100 m' });
	});

	it('przechodzi na kilometry i centymetry', () => {
		expect(calculator.calculate(20)?.label).toBe('2 km');
		expect(calculator.calculate(0.004)?.label).toBe('20 cm');
	});

	it('nie rysuje skali bez poprawnego pomiaru', () => {
		expect(calculator.calculate(0)).toBeNull();
		expect(calculator.calculate(Number.NaN)).toBeNull();
	});
});
