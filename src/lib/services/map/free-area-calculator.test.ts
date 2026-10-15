import { describe, expect, it } from 'vitest';
import { FreeAreaCalculator } from './free-area-calculator.js';

const calculator = new FreeAreaCalculator();
const desktop = { widthPixels: 1440, heightPixels: 860 };
const phone = { widthPixels: 390, heightPixels: 844 };

describe('FreeAreaCalculator', () => {
	it('bez paneli nic nie przesuwa i nie oddala', () => {
		const insets = { leftPixels: 0, bottomPixels: 0 };
		expect(calculator.calculateShiftToFreeAreaCentre(insets, desktop)).toEqual({
			rightPixels: 0,
			upPixels: 0
		});
		expect(calculator.calculateRangeScale(insets, desktop)).toBe(1);
	});

	it('panel z lewej przesuwa cel w prawo o połowę szerokości panelu', () => {
		const shift = calculator.calculateShiftToFreeAreaCentre(
			{ leftPixels: 442, bottomPixels: 0 },
			desktop
		);
		expect(shift).toEqual({ rightPixels: 221, upPixels: 0 });
	});

	it('arkusz od dołu przesuwa cel w górę o połowę wysokości arkusza', () => {
		const shift = calculator.calculateShiftToFreeAreaCentre(
			{ leftPixels: 0, bottomPixels: 500 },
			phone
		);
		expect(shift).toEqual({ rightPixels: 0, upPixels: 250 });
	});

	it('oddala kamerę proporcjonalnie do zasłoniętej części', () => {
		expect(
			calculator.calculateRangeScale({ leftPixels: 720, bottomPixels: 0 }, desktop)
		).toBeCloseTo(2);
		expect(calculator.calculateRangeScale({ leftPixels: 0, bottomPixels: 422 }, phone)).toBeCloseTo(
			844 / 422
		);
	});

	it('nie dopuszcza, żeby wolny obszar skurczył się poniżej 30% płótna', () => {
		const insets = { leftPixels: 5000, bottomPixels: 5000 };
		expect(calculator.calculateRangeScale(insets, desktop)).toBeCloseTo(1 / 0.3);
		const shift = calculator.calculateShiftToFreeAreaCentre(insets, desktop);
		expect(shift.rightPixels).toBeCloseTo((1440 * 0.7) / 2);
		expect(shift.upPixels).toBeCloseTo((860 * 0.7) / 2);
	});

	it('ujemne marginesy traktuje jak zero', () => {
		expect(calculator.calculateRangeScale({ leftPixels: -50, bottomPixels: -10 }, desktop)).toBe(1);
	});
});
