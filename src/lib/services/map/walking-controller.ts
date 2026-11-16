import {
	Cartesian2,
	Cartesian3,
	Cartographic,
	Math as CesiumMath,
	type Camera,
	type Viewer
} from 'cesium';
import {
	IDLE_FLIGHT_INPUT,
	isFlightInputIdle,
	type FlightInput
} from '#lib/services/flight/flight-input.js';
import {
	EYE_HEIGHT_METRES,
	WalkingGroundResolver
} from '#lib/services/walking/walking-ground-resolver.js';
import {
	DEFAULT_WALKING_SPEEDS,
	WalkingMotionCalculator,
	type WalkingSpeeds,
	type WalkingStep
} from '#lib/services/walking/walking-motion-calculator.js';
import { PointerClickDetector } from '#lib/services/walking/pointer-click-detector.js';
import { CameraHorizontalBasisReader } from './camera-horizontal-basis-reader.js';

const LANDING_SECONDS = 1.8;
const MAXIMUM_PITCH_RADIANS = CesiumMath.toRadians(80);
const DRAG_LOOK_RADIANS_PER_PIXEL = 0.003;

/**
 * Spacer pierwszoosobowy: kamera na wysokości oczu postaci chodzi po modelu świata. Wejście sprowadza
 * kamerę płynnie do punktu pod środkiem ekranu. Potem co klatkę przesuwa ją poziomo (z zamiaru z klawiatury
 * lub joysticków), pilnuje wysokości nad gruntem odczytaną z modelu i nie pozwala wejść na ścianę ani dach
 * (zob. `WalkingGroundResolver`). Rozglądać się można strzałkami albo przeciągając po mapie. Na czas
 * spaceru wyłączone są domyślne sterowanie kamerą Cesium.
 */
export class WalkingController {
	private readonly motionCalculator = new WalkingMotionCalculator();
	private readonly groundResolver = new WalkingGroundResolver();
	private readonly basisReader = new CameraHorizontalBasisReader();
	private readonly stopListeningToRender: () => void;
	private input: FlightInput = IDLE_FLIGHT_INPUT;
	private speeds: WalkingSpeeds = DEFAULT_WALKING_SPEEDS;
	private phase: 'off' | 'choosing' | 'landing' | 'walking' = 'off';
	private cancelChoosingPlace: (() => void) | null = null;
	private previousFrameMilliseconds: number | null = null;
	private groundHeightMetres: number | null = null;
	private stopListeningToDrag: (() => void) | null = null;

	/** @param readObjectsToIgnore obiekty (pomiary, analizy), które nie są gruntem przy odczycie wysokości */
	constructor(
		private readonly viewer: Viewer,
		private readonly readObjectsToIgnore: () => object[]
	) {
		this.stopListeningToRender = viewer.scene.preRender.addEventListener(() =>
			this.walkForThisFrame(performance.now())
		);
	}

	/** Czy spacer przejął sterowanie kamerą (po wyborze miejsca); w czasie wyboru nadal można latać. */
	get isControllingCamera(): boolean {
		return this.phase === 'landing' || this.phase === 'walking';
	}

	useSpeeds(speeds: WalkingSpeeds | null): void {
		this.speeds = speeds ?? DEFAULT_WALKING_SPEEDS;
	}

	replaceInput(input: FlightInput): void {
		this.input = input;
		if (isFlightInputIdle(input)) this.previousFrameMilliseconds = null;
	}

	/**
	 * Czeka, aż użytkownik kliknie teren na mapie (w tym czasie mapą można normalnie poruszać), potem sprowadza
	 * kamerę lotem w wybrane miejsce i zaczyna spacer. `onPlaceChosen` woła się tuż po kliknięciu. Zwraca `false`,
	 * gdy wybór przerwano albo przeglądarka nie potrafi odczytać wysokości.
	 */
	async begin(onPlaceChosen: () => void): Promise<boolean> {
		const { scene, camera } = this.viewer;
		if (this.phase !== 'off' || !scene.sampleHeightSupported || !scene.pickPositionSupported) {
			return false;
		}
		this.phase = 'choosing';
		this.input = IDLE_FLIGHT_INPUT;
		const ground = await this.waitForClickedGround();
		if (!ground || this.phase !== 'choosing') {
			this.phase = 'off';
			return false;
		}
		this.phase = 'landing';
		onPlaceChosen();
		const hasLanded = await this.landOn(camera, ground);
		if (!hasLanded || this.phase !== 'landing') {
			this.phase = 'off';
			return false;
		}
		this.groundHeightMetres = ground.height;
		this.phase = 'walking';
		this.previousFrameMilliseconds = null;
		this.viewer.scene.screenSpaceCameraController.enableInputs = false;
		this.stopListeningToDrag = this.listenToDragLook();
		return true;
	}

	end(): void {
		if (this.phase === 'off') return;
		const wasLanding = this.phase === 'landing';
		const cancelChoosing = this.cancelChoosingPlace;
		this.phase = 'off';
		cancelChoosing?.();
		this.input = IDLE_FLIGHT_INPUT;
		this.groundHeightMetres = null;
		this.previousFrameMilliseconds = null;
		if (wasLanding) this.viewer.camera.cancelFlight();
		this.stopListeningToDrag?.();
		this.stopListeningToDrag = null;
		this.viewer.scene.screenSpaceCameraController.enableInputs = true;
	}

	destroy(): void {
		this.end();
		this.stopListeningToRender();
	}

	private waitForClickedGround(): Promise<Cartographic | null> {
		const canvas = this.viewer.scene.canvas;
		const clickDetector = new PointerClickDetector();
		const previousCursor = canvas.style.cursor;
		canvas.style.cursor = 'crosshair';
		return new Promise((resolve) => {
			const finish = (ground: Cartographic | null): void => {
				canvas.removeEventListener('pointerdown', press);
				canvas.removeEventListener('pointermove', move);
				canvas.removeEventListener('pointerup', release);
				canvas.removeEventListener('pointercancel', cancel);
				canvas.style.cursor = previousCursor;
				this.cancelChoosingPlace = null;
				resolve(ground);
			};
			const press = (event: PointerEvent): void =>
				clickDetector.press(event.clientX, event.clientY, performance.now());
			const move = (event: PointerEvent): void => clickDetector.move(event.clientX, event.clientY);
			const cancel = (): void => clickDetector.cancel();
			const release = (event: PointerEvent): void => {
				if (!clickDetector.release(performance.now())) return;
				const bounds = canvas.getBoundingClientRect();
				const picked = this.viewer.scene.pickPosition(
					new Cartesian2(event.clientX - bounds.left, event.clientY - bounds.top)
				);
				if (picked) finish(Cartographic.fromCartesian(picked));
			};
			canvas.addEventListener('pointerdown', press);
			canvas.addEventListener('pointermove', move);
			canvas.addEventListener('pointerup', release);
			canvas.addEventListener('pointercancel', cancel);
			this.cancelChoosingPlace = () => finish(null);
		});
	}

	private landOn(camera: Camera, ground: Cartographic): Promise<boolean> {
		return new Promise((resolve) => {
			camera.flyTo({
				destination: Cartesian3.fromRadians(
					ground.longitude,
					ground.latitude,
					ground.height + EYE_HEIGHT_METRES
				),
				orientation: { heading: camera.heading, pitch: 0, roll: 0 },
				duration: LANDING_SECONDS,
				complete: () => resolve(true),
				cancel: () => resolve(false)
			});
		});
	}

	private walkForThisFrame(nowMilliseconds: number): void {
		if (this.phase !== 'walking' || isFlightInputIdle(this.input)) return;
		if (this.previousFrameMilliseconds === null) {
			this.previousFrameMilliseconds = nowMilliseconds;
			this.groundHeightMetres = this.sampleGroundAt(this.viewer.camera.positionWC);
			return;
		}
		const frameSeconds = (nowMilliseconds - this.previousFrameMilliseconds) / 1000;
		this.previousFrameMilliseconds = nowMilliseconds;
		const step = this.motionCalculator.calculate(this.input, frameSeconds, this.speeds);
		this.applyMovement(step);
		this.applyLook(step);
		this.keepEyesAboveGround(frameSeconds);
	}

	private applyMovement(step: WalkingStep): void {
		if (this.groundHeightMetres === null) return;
		const camera = this.viewer.camera;
		const { forward, right } = this.basisReader.read(camera);
		const forwardDelta = Cartesian3.multiplyByScalar(forward, step.forwardMetres, new Cartesian3());
		const rightDelta = Cartesian3.multiplyByScalar(right, step.rightMetres, new Cartesian3());
		const fullDelta = Cartesian3.add(forwardDelta, rightDelta, new Cartesian3());
		for (const delta of [fullDelta, forwardDelta, rightDelta]) {
			if (this.tryStep(camera, delta)) return;
		}
	}

	private tryStep(camera: Camera, delta: Cartesian3): boolean {
		const stepLengthMetres = Cartesian3.magnitude(delta);
		if (stepLengthMetres === 0 || this.groundHeightMetres === null) return false;
		const target = Cartesian3.add(camera.positionWC, delta, new Cartesian3());
		const targetGround = this.sampleGroundAt(target);
		if (
			targetGround === null ||
			!this.groundResolver.canStepTo(this.groundHeightMetres, targetGround, stepLengthMetres)
		) {
			return false;
		}
		Cartesian3.clone(target, camera.position);
		this.groundHeightMetres = targetGround;
		return true;
	}

	private applyLook(step: WalkingStep): void {
		const camera = this.viewer.camera;
		const { up } = this.basisReader.read(camera);
		if (step.turnRadians !== 0) camera.look(up, step.turnRadians);
		if (step.tiltRadians !== 0) this.tiltBy(step.tiltRadians);
	}

	private tiltBy(radians: number): void {
		const camera = this.viewer.camera;
		const tiltedPitch = CesiumMath.clamp(
			camera.pitch + radians,
			-MAXIMUM_PITCH_RADIANS,
			MAXIMUM_PITCH_RADIANS
		);
		camera.lookUp(tiltedPitch - camera.pitch);
	}

	private keepEyesAboveGround(frameSeconds: number): void {
		if (this.groundHeightMetres === null) return;
		const camera = this.viewer.camera;
		const verticalChange = this.groundResolver.calculateVerticalChange(
			camera.positionCartographic.height,
			this.groundHeightMetres,
			frameSeconds
		);
		if (verticalChange === 0) return;
		const { up } = this.basisReader.read(camera);
		camera.move(up, verticalChange);
	}

	private sampleGroundAt(position: Cartesian3): number | null {
		const height = this.viewer.scene.sampleHeight(
			Cartographic.fromCartesian(position),
			this.readObjectsToIgnore()
		);
		return height === undefined ? null : height;
	}

	private listenToDragLook(): () => void {
		const canvas = this.viewer.scene.canvas;
		let isDragging = false;
		const startDrag = (event: PointerEvent): void => {
			isDragging = true;
			canvas.setPointerCapture(event.pointerId);
		};
		const moveDrag = (event: PointerEvent): void => {
			if (!isDragging) return;
			const { up } = this.basisReader.read(this.viewer.camera);
			this.viewer.camera.look(up, event.movementX * DRAG_LOOK_RADIANS_PER_PIXEL);
			this.tiltBy(-event.movementY * DRAG_LOOK_RADIANS_PER_PIXEL);
		};
		const endDrag = (event: PointerEvent): void => {
			isDragging = false;
			if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
		};
		canvas.addEventListener('pointerdown', startDrag);
		canvas.addEventListener('pointermove', moveDrag);
		canvas.addEventListener('pointerup', endDrag);
		canvas.addEventListener('pointercancel', endDrag);
		return () => {
			canvas.removeEventListener('pointerdown', startDrag);
			canvas.removeEventListener('pointermove', moveDrag);
			canvas.removeEventListener('pointerup', endDrag);
			canvas.removeEventListener('pointercancel', endDrag);
		};
	}
}
