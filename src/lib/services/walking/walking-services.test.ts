import { describe, expect, it } from 'vitest';
import { IDLE_FLIGHT_INPUT, type FlightInput } from '#lib/services/flight/flight-input.js';
import { EYE_HEIGHT_METRES, WalkingGroundResolver } from './walking-ground-resolver.js';
import { WalkingMotionCalculator, type WalkingSpeeds } from './walking-motion-calculator.js';

const speeds: WalkingSpeeds = { walkMetresPerSecond: 4, runMetresPerSecond: 8 };

function input(change: Partial<FlightInput>): FlightInput {
	return { ...IDLE_FLIGHT_INPUT, ...change };
}

describe('WalkingMotionCalculator', () => {
	const calculator = new WalkingMotionCalculator();

	it('nie rusza się bez zamiaru ruchu', () => {
		expect(calculator.calculate(IDLE_FLIGHT_INPUT, 0.016, speeds)).toEqual({
			forwardMetres: 0,
			rightMetres: 0,
			turnRadians: 0,
			tiltRadians: 0
		});
	});

	it('idzie z prędkością marszu, a z Shiftem biegnie', () => {
		const walk = calculator.calculate(input({ forward: 1 }), 0.1, speeds);
		const run = calculator.calculate(input({ forward: 1, isBoosted: true }), 0.1, speeds);
		expect(walk.forwardMetres).toBeCloseTo(0.4);
		expect(run.forwardMetres).toBeCloseTo(0.8);
	});

	it('ruch po przekątnej nie jest szybszy niż prosto', () => {
		const step = calculator.calculate(input({ forward: 1, right: 1 }), 0.1, speeds);
		expect(Math.hypot(step.forwardMetres, step.rightMetres)).toBeCloseTo(0.4);
	});

	it('ignoruje wznoszenie z trybu lotu', () => {
		const step = calculator.calculate(input({ rise: 1 }), 0.1, speeds);
		expect(step.forwardMetres).toBe(0);
		expect(step.rightMetres).toBe(0);
	});

	it('przycina bardzo długą klatkę', () => {
		const step = calculator.calculate(input({ forward: 1 }), 5, speeds);
		expect(step.forwardMetres).toBeCloseTo(0.4);
	});
});

describe('WalkingGroundResolver', () => {
	const resolver = new WalkingGroundResolver();

	it('pozwala iść po płaskim i w dół', () => {
		expect(resolver.canStepTo(100, 100, 0.1)).toBe(true);
		expect(resolver.canStepTo(100, 95, 0.1)).toBe(true);
	});

	it('pozwala wejść na łagodne wzniesienie', () => {
		expect(resolver.canStepTo(100, 100.3, 0.2)).toBe(true);
	});

	it('blokuje ścianę i dach budynku', () => {
		expect(resolver.canStepTo(100, 104, 0.1)).toBe(false);
	});

	it('blokuje krok, gdy brak wczytanych kafli', () => {
		expect(resolver.canStepTo(100, undefined, 0.1)).toBe(false);
	});

	it('podnosi i opuszcza oczy do wysokości postaci z ograniczoną prędkością', () => {
		expect(resolver.calculateVerticalChange(100 + EYE_HEIGHT_METRES, 100, 0.016)).toBe(0);
		expect(resolver.calculateVerticalChange(150, 100, 0.1)).toBeCloseTo(-1.4);
		expect(resolver.calculateVerticalChange(100, 100, 0.1)).toBeCloseTo(
			Math.min(1, EYE_HEIGHT_METRES)
		);
	});
});
