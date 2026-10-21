import { describe, expect, it } from 'vitest';
import { DurationFormatter } from './duration-formatter.js';
import { TravelTimeCalculator } from './travel-time-calculator.js';

describe('TravelTimeCalculator', () => {
	const estimates = new TravelTimeCalculator().estimateTravelTimes(345);

	it('liczy czas biegu z prędkości 3,45 m/s', () => {
		const run = estimates.find((estimate) => estimate.mode === 'run');
		expect(run?.realSeconds).toBeCloseTo(100, 5);
	});

	it('cztery sekundy rzeczywiste to minuta w grze', () => {
		const run = estimates.find((estimate) => estimate.mode === 'run');
		expect(run?.gameMinutes).toBeCloseTo(25, 5);
	});

	it('marsz z bronią jest szybszy niż bez niej, a skradanie najwolniejsze', () => {
		const secondsOf = (mode: string) => estimates.find((e) => e.mode === mode)?.realSeconds ?? 0;
		expect(secondsOf('walkWithWeapon')).toBeLessThan(secondsOf('walk'));
		expect(secondsOf('sneak')).toBeGreaterThan(secondsOf('walk'));
	});

	it('zerowa odległość daje zerowy czas', () => {
		const zero = new TravelTimeCalculator().estimateTravelTimes(0);
		expect(zero.every((estimate) => estimate.realSeconds === 0)).toBe(true);
	});
});

describe('DurationFormatter', () => {
	const formatter = new DurationFormatter();

	it('zapisuje czas rzeczywisty w sekundach i minutach', () => {
		expect(formatter.formatRealTime(45)).toBe('45 s');
		expect(formatter.formatRealTime(200)).toBe('3 min 20 s');
		expect(formatter.formatRealTime(240)).toBe('4 min');
	});

	it('czas rzeczywisty powyżej godziny zapisuje w godzinach', () => {
		expect(formatter.formatRealTime(3900)).toBe('1 h 5 min');
	});

	it('zapisuje czas gry w minutach i godzinach', () => {
		expect(formatter.formatGameTime(25)).toBe('25 min');
		expect(formatter.formatGameTime(100)).toBe('1 h 40 min');
		expect(formatter.formatGameTime(120)).toBe('2 h');
	});
});
