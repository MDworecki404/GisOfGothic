import { describe, expect, it } from 'vitest';
import { ColorContrastCalculator } from './color-contrast-calculator.js';

const calculator = new ColorContrastCalculator();

describe('ColorContrastCalculator', () => {
	it('czarny na białym daje 21', () => {
		expect(calculator.calculateContrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
	});

	it('ten sam kolor daje 1', () => {
		expect(calculator.calculateContrastRatio('#a3b4ff', '#a3b4ff')).toBeCloseTo(1, 5);
	});

	it('kolejność argumentów nie zmienia wyniku', () => {
		expect(calculator.calculateContrastRatio('#e1dac8', '#1e282b')).toBeCloseTo(
			calculator.calculateContrastRatio('#1e282b', '#e1dac8'),
			10
		);
	});

	it('odrzuca zapis inny niż #rrggbb', () => {
		expect(() => calculator.calculateContrastRatio('czerwony', '#ffffff')).toThrow(/#rrggbb/);
	});
});
