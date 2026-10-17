import { isFlightInputIdle, type FlightInput } from './flight-input.js';

export interface FlightStep {
	forwardMetres: number;
	rightMetres: number;
	riseMetres: number;
	turnRadians: number;
	tiltRadians: number;
}

const MAXIMUM_FRAME_SECONDS = 0.1;
const REFERENCE_DISTANCES_PER_SECOND = 0.35;
const MINIMUM_SPEED_METRES_PER_SECOND = 4;
const MAXIMUM_SPEED_METRES_PER_SECOND = 800;
const BOOST_FACTOR = 3;
const TURN_RADIANS_PER_SECOND = (70 * Math.PI) / 180;
const TILT_RADIANS_PER_SECOND = (50 * Math.PI) / 180;

const NO_STEP: FlightStep = {
	forwardMetres: 0,
	rightMetres: 0,
	riseMetres: 0,
	turnRadians: 0,
	tiltRadians: 0
};

/**
 * Przelicza zamiar lotu na przesunięcie i obrót w jednej klatce. Prędkość rośnie z odległością
 * kamery od oglądanej powierzchni, więc z wysoka lot jest szybki, a tuż nad ziemią – spokojny.
 * Ruch po przekątnej nie jest szybszy niż w jedną stronę.
 */
export class FlightMotionCalculator {
	calculate(input: FlightInput, frameSeconds: number, referenceDistanceMetres: number): FlightStep {
		if (isFlightInputIdle(input) || !(frameSeconds > 0)) return NO_STEP;
		const seconds = Math.min(frameSeconds, MAXIMUM_FRAME_SECONDS);
		const speed =
			this.calculateSpeed(referenceDistanceMetres) * (input.isBoosted ? BOOST_FACTOR : 1);
		const horizontalLength = Math.hypot(input.forward, input.right);
		const horizontalScale = horizontalLength > 1 ? 1 / horizontalLength : 1;
		return {
			forwardMetres: input.forward * horizontalScale * speed * seconds,
			rightMetres: input.right * horizontalScale * speed * seconds,
			riseMetres: input.rise * speed * seconds,
			turnRadians: input.turn * TURN_RADIANS_PER_SECOND * seconds,
			tiltRadians: input.tilt * TILT_RADIANS_PER_SECOND * seconds
		};
	}

	private calculateSpeed(referenceDistanceMetres: number): number {
		const proportional = referenceDistanceMetres * REFERENCE_DISTANCES_PER_SECOND;
		return Math.min(
			MAXIMUM_SPEED_METRES_PER_SECOND,
			Math.max(MINIMUM_SPEED_METRES_PER_SECOND, proportional)
		);
	}
}
