import { Math as CesiumMath, type Viewer } from 'cesium';
import { CameraHorizontalBasisReader } from './camera-horizontal-basis-reader.js';
import {
	FlightMotionCalculator,
	type FlightStep
} from '#lib/services/flight/flight-motion-calculator.js';
import {
	IDLE_FLIGHT_INPUT,
	isFlightInputIdle,
	type FlightInput
} from '#lib/services/flight/flight-input.js';

const FALLBACK_REFERENCE_DISTANCE_METRES = 200;
const FRAMES_BETWEEN_REFERENCE_MEASUREMENTS = 12;
const MAXIMUM_PITCH_RADIANS = CesiumMath.toRadians(85);

/**
 * Lot kamerą sterowany klawiaturą i joystickami. Co klatkę przesuwa i obraca kamerę o krok
 * policzony z czasu klatki, więc ruch nie zależy od liczby FPS. Ruch „do przodu” i „w bok” odbywa się
 * poziomo (wzdłuż powierzchni), „w górę” – wzdłuż pionu, a obrót wokół pionu zachowuje horyzont.
 * Rozpoczęcie lotu przerywa trwający przelot kamery.
 */
export class CameraFlightController {
	private readonly motionCalculator = new FlightMotionCalculator();
	private readonly basisReader = new CameraHorizontalBasisReader();
	private readonly stopListeningToRender: () => void;
	private input: FlightInput = IDLE_FLIGHT_INPUT;
	private previousFrameMilliseconds: number | null = null;
	private referenceDistanceMetres = FALLBACK_REFERENCE_DISTANCE_METRES;
	private framesSinceReferenceMeasurement = FRAMES_BETWEEN_REFERENCE_MEASUREMENTS;

	/**
	 * @param measureReferenceDistance odległość kamery od oglądanej powierzchni; `null`, gdy nieznana
	 * @param isOrthographic w rzucie ortogonalnym odległość kamery nie zmienia rozmiaru obrazu, więc „wysokość” działa jak zoom
	 * @param isOrientationLocked w widoku 2D obrót i przechył są pomijane (zostaje przesuwanie i zoom)
	 */
	constructor(
		private readonly viewer: Viewer,
		private readonly measureReferenceDistance: () => number | null,
		private readonly isOrthographic: () => boolean,
		private readonly isOrientationLocked: () => boolean
	) {
		this.stopListeningToRender = viewer.scene.preRender.addEventListener(() =>
			this.moveCameraForThisFrame(performance.now())
		);
	}

	replaceInput(input: FlightInput): void {
		this.input = input;
		if (isFlightInputIdle(input)) this.previousFrameMilliseconds = null;
	}

	destroy(): void {
		this.stopListeningToRender();
	}

	private moveCameraForThisFrame(nowMilliseconds: number): void {
		if (isFlightInputIdle(this.input)) return;
		if (this.previousFrameMilliseconds === null) {
			this.previousFrameMilliseconds = nowMilliseconds;
			this.viewer.camera.cancelFlight();
			this.framesSinceReferenceMeasurement = FRAMES_BETWEEN_REFERENCE_MEASUREMENTS;
			return;
		}
		const frameSeconds = (nowMilliseconds - this.previousFrameMilliseconds) / 1000;
		this.previousFrameMilliseconds = nowMilliseconds;
		this.refreshReferenceDistance();
		this.applyStep(
			this.motionCalculator.calculate(this.input, frameSeconds, this.referenceDistanceMetres)
		);
	}

	private refreshReferenceDistance(): void {
		this.framesSinceReferenceMeasurement++;
		if (this.framesSinceReferenceMeasurement < FRAMES_BETWEEN_REFERENCE_MEASUREMENTS) return;
		this.framesSinceReferenceMeasurement = 0;
		const measured = this.measureReferenceDistance();
		if (measured !== null && Number.isFinite(measured)) this.referenceDistanceMetres = measured;
	}

	private applyStep(step: FlightStep): void {
		const camera = this.viewer.camera;
		const { up: surfaceUp, forward, right } = this.basisReader.read(camera);
		if (step.forwardMetres !== 0) camera.move(forward, step.forwardMetres);
		if (step.rightMetres !== 0) camera.move(right, step.rightMetres);
		if (step.riseMetres !== 0) {
			if (this.isOrthographic()) camera.move(camera.directionWC, -step.riseMetres);
			else camera.move(surfaceUp, step.riseMetres);
		}
		if (this.isOrientationLocked()) return;
		if (step.turnRadians !== 0) camera.look(surfaceUp, step.turnRadians);
		if (step.tiltRadians !== 0) {
			const tiltedPitch = CesiumMath.clamp(
				camera.pitch + step.tiltRadians,
				-MAXIMUM_PITCH_RADIANS,
				MAXIMUM_PITCH_RADIANS
			);
			camera.lookUp(tiltedPitch - camera.pitch);
		}
	}
}
