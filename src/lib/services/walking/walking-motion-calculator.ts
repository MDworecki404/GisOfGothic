import { isFlightInputIdle, type FlightInput } from '#lib/services/flight/flight-input.js';

export interface WalkingSpeeds {
	walkMetresPerSecond: number;
	runMetresPerSecond: number;
}

export interface WalkingStep {
	forwardMetres: number;
	rightMetres: number;
	turnRadians: number;
	tiltRadians: number;
}

export const DEFAULT_WALKING_SPEEDS: WalkingSpeeds = {
	walkMetresPerSecond: 3.5,
	runMetresPerSecond: 6.5
};

const MAXIMUM_FRAME_SECONDS = 0.1;
const TURN_RADIANS_PER_SECOND = (90 * Math.PI) / 180;
const TILT_RADIANS_PER_SECOND = (60 * Math.PI) / 180;

const NO_STEP: WalkingStep = { forwardMetres: 0, rightMetres: 0, turnRadians: 0, tiltRadians: 0 };

/**
 * Przelicza zamiar ruchu na przesunięcie pieszego w jednej klatce. Prędkość marszu i biegu pochodzi
 * z danych świata (animacje bohatera), a przyspieszenie (Shift) oznacza bieg. Wznoszenie z lotu jest
 * pomijane, bo pieszy chodzi po ziemi. Ruch po przekątnej nie jest szybszy niż w jedną stronę.
 */
export class WalkingMotionCalculator {
	calculate(input: FlightInput, frameSeconds: number, speeds: WalkingSpeeds): WalkingStep {
		if (isFlightInputIdle(input) || !(frameSeconds > 0)) return NO_STEP;
		const seconds = Math.min(frameSeconds, MAXIMUM_FRAME_SECONDS);
		const speed = input.isBoosted ? speeds.runMetresPerSecond : speeds.walkMetresPerSecond;
		const horizontalLength = Math.hypot(input.forward, input.right);
		const horizontalScale = horizontalLength > 1 ? 1 / horizontalLength : 1;
		return {
			forwardMetres: input.forward * horizontalScale * speed * seconds,
			rightMetres: input.right * horizontalScale * speed * seconds,
			turnRadians: input.turn * TURN_RADIANS_PER_SECOND * seconds,
			tiltRadians: input.tilt * TILT_RADIANS_PER_SECOND * seconds
		};
	}
}
