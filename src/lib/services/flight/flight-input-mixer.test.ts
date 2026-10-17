import { describe, expect, it } from 'vitest';
import { FlightInputMixer } from './flight-input-mixer.js';
import { IDLE_FLIGHT_INPUT } from './flight-input.js';

describe('FlightInputMixer', () => {
	it('bez źródeł zwraca zamiar zerowy', () => {
		expect(new FlightInputMixer().mix()).toEqual(IDLE_FLIGHT_INPUT);
	});

	it('łączy joysticki i przycisk wysokości', () => {
		const mixer = new FlightInputMixer();
		mixer.replaceMoveStick({ x: 0.5, y: 0.25 });
		mixer.replaceLookStick({ x: -0.5, y: 0.75 });
		mixer.replaceRiseButton(-1);
		expect(mixer.mix()).toEqual({
			forward: 0.25,
			right: 0.5,
			rise: -1,
			turn: -0.5,
			tilt: 0.75,
			isBoosted: false
		});
	});

	it('sumuje klawiaturę z joystickiem, ale nie przekracza 1', () => {
		const mixer = new FlightInputMixer();
		mixer.replaceKeyboardInput({ ...IDLE_FLIGHT_INPUT, forward: 1, isBoosted: true });
		mixer.replaceMoveStick({ x: 0, y: 0.8 });
		expect(mixer.mix()).toMatchObject({ forward: 1, isBoosted: true });
		mixer.replaceMoveStick({ x: 0, y: -1 });
		expect(mixer.mix().forward).toBe(0);
	});
});
