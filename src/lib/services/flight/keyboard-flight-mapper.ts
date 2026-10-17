import { IDLE_FLIGHT_INPUT, type FlightInput } from './flight-input.js';

interface AxisKeys {
	positive: readonly string[];
	negative: readonly string[];
}

const FORWARD_KEYS: AxisKeys = { positive: ['KeyW'], negative: ['KeyS'] };
const RIGHT_KEYS: AxisKeys = { positive: ['KeyD'], negative: ['KeyA'] };
const RISE_KEYS: AxisKeys = { positive: ['KeyE'], negative: ['KeyQ'] };
const TURN_KEYS: AxisKeys = { positive: ['ArrowRight'], negative: ['ArrowLeft'] };
const TILT_KEYS: AxisKeys = { positive: ['ArrowUp'], negative: ['ArrowDown'] };
const BOOST_KEYS: readonly string[] = ['ShiftLeft', 'ShiftRight'];

const CONTROLLED_KEYS: ReadonlySet<string> = new Set(
	[FORWARD_KEYS, RIGHT_KEYS, RISE_KEYS, TURN_KEYS, TILT_KEYS]
		.flatMap((keys) => [...keys.positive, ...keys.negative])
		.concat(BOOST_KEYS)
);

/**
 * Zamienia trzymane klawisze na zamiar lotu: WASD – ruch, strzałki – obrót i pochylenie
 * spojrzenia, Q/E – w dół i w górę, Shift – przyspieszenie. Klawisze są rozpoznawane po
 * fizycznym położeniu (`code`), więc działają przy dowolnym układzie klawiatury.
 */
export class KeyboardFlightMapper {
	private readonly heldKeys = new Set<string>();

	isControlledKey(code: string): boolean {
		return CONTROLLED_KEYS.has(code);
	}

	pressKey(code: string): void {
		if (CONTROLLED_KEYS.has(code)) this.heldKeys.add(code);
	}

	releaseKey(code: string): void {
		this.heldKeys.delete(code);
	}

	releaseAllKeys(): void {
		this.heldKeys.clear();
	}

	readInput(): FlightInput {
		if (this.heldKeys.size === 0) return IDLE_FLIGHT_INPUT;
		return {
			forward: this.readAxis(FORWARD_KEYS),
			right: this.readAxis(RIGHT_KEYS),
			rise: this.readAxis(RISE_KEYS),
			turn: this.readAxis(TURN_KEYS),
			tilt: this.readAxis(TILT_KEYS),
			isBoosted: BOOST_KEYS.some((code) => this.heldKeys.has(code))
		};
	}

	private readAxis(keys: AxisKeys): number {
		const positive = keys.positive.some((code) => this.heldKeys.has(code)) ? 1 : 0;
		const negative = keys.negative.some((code) => this.heldKeys.has(code)) ? 1 : 0;
		return positive - negative;
	}
}
