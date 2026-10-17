import { describe, expect, it } from 'vitest';
import { IDLE_FLIGHT_INPUT, type FlightInput } from './flight-input.js';
import { FlightMotionCalculator } from './flight-motion-calculator.js';

const calculator = new FlightMotionCalculator();
const forward: FlightInput = { ...IDLE_FLIGHT_INPUT, forward: 1 };

describe('FlightMotionCalculator', () => {
	it('bez zamiaru nie robi kroku', () => {
		expect(calculator.calculate(IDLE_FLIGHT_INPUT, 0.016, 500).forwardMetres).toBe(0);
	});

	it('prędkość rośnie z odległością od powierzchni', () => {
		const near = calculator.calculate(forward, 0.1, 50).forwardMetres;
		const far = calculator.calculate(forward, 0.1, 500).forwardMetres;
		expect(far).toBeGreaterThan(near);
	});

	it('ma dolną i górną granicę prędkości', () => {
		expect(calculator.calculate(forward, 1, 0).forwardMetres).toBeCloseTo(0.4);
		expect(calculator.calculate(forward, 0.1, 1e9).forwardMetres).toBeCloseTo(80);
	});

	it('Shift przyspiesza trzykrotnie', () => {
		const normal = calculator.calculate(forward, 0.05, 100).forwardMetres;
		const boosted = calculator.calculate({ ...forward, isBoosted: true }, 0.05, 100).forwardMetres;
		expect(boosted).toBeCloseTo(normal * 3);
	});

	it('ruch po przekątnej nie jest szybszy niż prosty', () => {
		const diagonal = calculator.calculate({ ...forward, right: 1 }, 0.05, 100);
		expect(Math.hypot(diagonal.forwardMetres, diagonal.rightMetres)).toBeCloseTo(
			calculator.calculate(forward, 0.05, 100).forwardMetres
		);
	});

	it('obcina zbyt długą klatkę, żeby kamera nie skakała po zawieszeniu karty', () => {
		expect(calculator.calculate(forward, 5, 100).forwardMetres).toBeCloseTo(
			calculator.calculate(forward, 0.1, 100).forwardMetres
		);
	});

	it('obrót i pochylenie zależą od czasu klatki', () => {
		const step = calculator.calculate({ ...IDLE_FLIGHT_INPUT, turn: 1, tilt: -1 }, 0.1, 100);
		expect(step.turnRadians).toBeGreaterThan(0);
		expect(step.tiltRadians).toBeLessThan(0);
	});
});
