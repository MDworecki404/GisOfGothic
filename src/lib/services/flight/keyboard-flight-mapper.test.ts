import { describe, expect, it } from 'vitest';
import { IDLE_FLIGHT_INPUT } from './flight-input.js';
import { KeyboardFlightMapper } from './keyboard-flight-mapper.js';

describe('KeyboardFlightMapper', () => {
	it('bez klawiszy zwraca zamiar zerowy', () => {
		expect(new KeyboardFlightMapper().readInput()).toEqual(IDLE_FLIGHT_INPUT);
	});

	it('WASD porusza, strzałki obracają, Q i E zmieniają wysokość', () => {
		const mapper = new KeyboardFlightMapper();
		for (const code of ['KeyW', 'KeyA', 'KeyE', 'ArrowRight', 'ArrowUp']) mapper.pressKey(code);
		expect(mapper.readInput()).toEqual({
			forward: 1,
			right: -1,
			rise: 1,
			turn: 1,
			tilt: 1,
			isBoosted: false
		});
		mapper.releaseAllKeys();
		mapper.pressKey('KeyS');
		mapper.pressKey('KeyD');
		mapper.pressKey('KeyQ');
		mapper.pressKey('ArrowLeft');
		mapper.pressKey('ArrowDown');
		expect(mapper.readInput()).toMatchObject({
			forward: -1,
			right: 1,
			rise: -1,
			turn: -1,
			tilt: -1
		});
	});

	it('przeciwne klawisze się znoszą, a Shift przyspiesza', () => {
		const mapper = new KeyboardFlightMapper();
		mapper.pressKey('KeyW');
		mapper.pressKey('KeyS');
		mapper.pressKey('ShiftLeft');
		expect(mapper.readInput()).toMatchObject({ forward: 0, isBoosted: true });
	});

	it('puszczony klawisz przestaje działać, a obce klawisze są ignorowane', () => {
		const mapper = new KeyboardFlightMapper();
		mapper.pressKey('KeyW');
		mapper.pressKey('KeyZ');
		mapper.releaseKey('KeyW');
		expect(mapper.readInput()).toEqual(IDLE_FLIGHT_INPUT);
		expect(mapper.isControlledKey('KeyZ')).toBe(false);
		expect(mapper.isControlledKey('KeyW')).toBe(true);
	});
});
