import { Cartesian3, Matrix4, Transforms, type Viewer } from 'cesium';
import type { CameraPresetOrientation } from '#lib/services/camera/camera-preset-builder.js';
import type { CameraViewGeometry } from './camera-projection-controller.js';
import { FreeAreaCalculator, type MapViewInsets } from './free-area-calculator.js';

export interface FramedFlight {
	headingRadians: number;
	pitchRadians: number;
	rangeMetres: number;
	flightSeconds: number;
}

/**
 * Przeloty kamery do punktu z uwzględnieniem paneli zasłaniających mapę: cel ląduje w środku
 * wolnego obszaru (z prawej strony panelu na komputerze, nad arkuszem na telefonie), a nie pod panelem.
 * Kamera ma ten sam kierunek, nachylenie i odległość co zwykły przelot `flyToBoundingSphere`;
 * różni się tylko przesunięciem w bok i w górę o tyle, ile zasłania interfejs.
 */
export class CameraFramer {
	private readonly freeAreaCalculator = new FreeAreaCalculator();
	private insets: MapViewInsets = { leftPixels: 0, bottomPixels: 0 };
	private lockedOrientation: CameraPresetOrientation | null = null;

	constructor(
		private readonly viewer: Viewer,
		private readonly viewGeometry: CameraViewGeometry
	) {}

	setInsets(insets: MapViewInsets): void {
		this.insets = insets;
	}

	/** Dopóki kierunek i nachylenie są zablokowane (widok 2D), każdy przelot używa ich zamiast własnych. */
	lockOrientation(orientation: CameraPresetOrientation | null): void {
		this.lockedOrientation = orientation;
	}

	/** Odległość kamery, przy której obiekt mieszczący się w całym płótnie zmieści się w wolnym obszarze. */
	scaleRangeToFreeArea(rangeMetres: number): number {
		return (
			rangeMetres * this.freeAreaCalculator.calculateRangeScale(this.insets, this.readCanvasSize())
		);
	}

	/**
	 * Przesunięcie liczone w lokalnym układzie Wschód–Północ–Góra celu: kamera patrzy w kierunku
	 * `kierunek` (północ = 0), „w prawo” na ekranie to prostopadła do niego, „w górę” to prostopadła
	 * do obu. Metry na piksel w odległości celu wynikają z kąta widzenia kamery.
	 */
	flyToPoint(target: Cartesian3, flight: FramedFlight): void {
		const camera = this.viewer.camera;
		const canvasSize = this.readCanvasSize();
		const shift = this.freeAreaCalculator.calculateShiftToFreeAreaCentre(this.insets, canvasSize);
		const verticalFieldOfView = this.viewGeometry.readVerticalFieldOfViewRadians();
		const metresPerPixel =
			(2 * flight.rangeMetres * Math.tan(verticalFieldOfView / 2)) / canvasSize.heightPixels;

		const { rangeMetres: range } = flight;
		const { headingRadians: heading, pitchRadians: pitch } = this.lockedOrientation ?? flight;
		const cameraDistance = this.viewGeometry.convertViewRangeToCameraDistance(range);
		const forward = new Cartesian3(
			Math.sin(heading) * Math.cos(pitch),
			Math.cos(heading) * Math.cos(pitch),
			Math.sin(pitch)
		);
		const right = new Cartesian3(Math.cos(heading), -Math.sin(heading), 0);
		const up = Cartesian3.cross(right, forward, new Cartesian3());
		const offset = new Cartesian3();
		Cartesian3.multiplyByScalar(forward, -cameraDistance, offset);
		Cartesian3.subtract(
			offset,
			Cartesian3.multiplyByScalar(right, shift.rightPixels * metresPerPixel, new Cartesian3()),
			offset
		);
		Cartesian3.subtract(
			offset,
			Cartesian3.multiplyByScalar(up, shift.upPixels * metresPerPixel, new Cartesian3()),
			offset
		);

		const enuToScene = Transforms.eastNorthUpToFixedFrame(target);
		const destination = Cartesian3.add(
			target,
			Matrix4.multiplyByPointAsVector(enuToScene, offset, new Cartesian3()),
			new Cartesian3()
		);
		camera.flyTo({
			destination,
			orientation: { heading, pitch, roll: 0 },
			duration: this.prefersReducedMotion() ? 0 : flight.flightSeconds
		});
	}

	private readCanvasSize(): { widthPixels: number; heightPixels: number } {
		const canvas = this.viewer.scene.canvas;
		return { widthPixels: canvas.clientWidth, heightPixels: canvas.clientHeight };
	}

	private prefersReducedMotion(): boolean {
		return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	}
}
