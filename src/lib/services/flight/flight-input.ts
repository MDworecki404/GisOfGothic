/**
 * Zamiar sterowania kamerą w locie. Każda oś mieści się w przedziale od -1 do 1:
 * `forward` – do przodu, `right` – w prawo, `rise` – w górę, `turn` – obrót w prawo,
 * `tilt` – podniesienie spojrzenia.
 */
export interface FlightInput {
	forward: number;
	right: number;
	rise: number;
	turn: number;
	tilt: number;
	isBoosted: boolean;
}

export const IDLE_FLIGHT_INPUT: FlightInput = {
	forward: 0,
	right: 0,
	rise: 0,
	turn: 0,
	tilt: 0,
	isBoosted: false
};

export function isFlightInputIdle(input: FlightInput): boolean {
	return (
		input.forward === 0 &&
		input.right === 0 &&
		input.rise === 0 &&
		input.turn === 0 &&
		input.tilt === 0
	);
}

/** Wychylenie drążka: `x` w prawo, `y` w górę, obie wartości od -1 do 1. */
export interface StickDeflection {
	x: number;
	y: number;
}

export const CENTRED_STICK: StickDeflection = { x: 0, y: 0 };
