import {
	CENTRED_STICK,
	IDLE_FLIGHT_INPUT,
	type FlightInput,
	type StickDeflection
} from './flight-input.js';

function clampToUnit(value: number): number {
	return Math.max(-1, Math.min(1, value));
}

/**
 * Łączy zamiary z klawiatury i z ekranowych joysticków w jeden zamiar lotu, żeby oba sposoby
 * sterowania mogły działać jednocześnie. Przeciwne wychylenia się znoszą, a suma nie przekracza 1.
 */
export class FlightInputMixer {
	private keyboardInput: FlightInput = IDLE_FLIGHT_INPUT;
	private moveStick: StickDeflection = CENTRED_STICK;
	private lookStick: StickDeflection = CENTRED_STICK;
	private riseButton = 0;

	replaceKeyboardInput(input: FlightInput): void {
		this.keyboardInput = input;
	}

	replaceMoveStick(deflection: StickDeflection): void {
		this.moveStick = deflection;
	}

	replaceLookStick(deflection: StickDeflection): void {
		this.lookStick = deflection;
	}

	replaceRiseButton(direction: number): void {
		this.riseButton = clampToUnit(direction);
	}

	mix(): FlightInput {
		return {
			forward: clampToUnit(this.keyboardInput.forward + this.moveStick.y),
			right: clampToUnit(this.keyboardInput.right + this.moveStick.x),
			rise: clampToUnit(this.keyboardInput.rise + this.riseButton),
			turn: clampToUnit(this.keyboardInput.turn + this.lookStick.x),
			tilt: clampToUnit(this.keyboardInput.tilt + this.lookStick.y),
			isBoosted: this.keyboardInput.isBoosted
		};
	}
}
