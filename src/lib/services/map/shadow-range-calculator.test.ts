import { describe, expect, it } from 'vitest';
import { ShadowRangeCalculator } from './shadow-range-calculator.js';

describe('ShadowRangeCalculator', () => {
	const calculator = new ShadowRangeCalculator();

	it('bez znanej odległości zostawia domyślny zasięg Cesium', () => {
		expect(calculator.calculateRangeMetres(null)).toBe(5000);
		expect(calculator.calculateRangeMetres(Number.NaN)).toBe(5000);
	});

	it('z bliska skraca zasięg, żeby cienie były ostre', () => {
		expect(calculator.calculateRangeMetres(20)).toBe(400);
	});

	it('w środkowych odległościach to trzykrotność odległości widoku', () => {
		expect(calculator.calculateRangeMetres(1000)).toBe(3000);
	});

	it('z dużej wysokości wydłuża zasięg, ale nie ponad 15 km', () => {
		expect(calculator.calculateRangeMetres(4000)).toBe(12000);
		expect(calculator.calculateRangeMetres(40000)).toBe(15000);
	});
});
