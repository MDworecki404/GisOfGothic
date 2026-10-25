import { Math as CesiumMath, OrthographicFrustum, PerspectiveFrustum, type Viewer } from 'cesium';
import {
	CameraProjectionConverter,
	MINIMUM_PERSPECTIVE_DISTANCE_METRES
} from '#lib/services/camera/camera-projection-converter.js';
import {
	DEFAULT_FIELD_OF_VIEW_DEGREES,
	type CameraProjectionSetting
} from '#lib/services/camera/camera-projection.js';

const MAXIMUM_FRAMES_TO_WAIT_FOR_SURFACE = 120;

/**
 * Rozmiar widoku mierzony „zakresem perspektywy”: odległością, z jakiej kamera środkowa o bieżącym kącie
 * widzenia widziałaby cel tak samo dużego. Pozwala przelotom i kadrowaniu liczyć tak samo w obu rzutach.
 */
export interface CameraViewGeometry {
	readVerticalFieldOfViewRadians(): number;
	convertViewRangeToCameraDistance(viewRangeMetres: number): number;
	convertCameraDistanceToViewRange(cameraDistanceMetres: number): number;
}

/**
 * Jedyne miejsce, które zmienia frustum kamery Cesium. W rzucie ortogonalnym Cesium ustawia szerokość widoku
 * równą odległości kamery od punktu pod środkiem ekranu, więc przy przełączeniu rzutu kamerę odsuwa się
 * (albo przysuwa) tak, by cel zachował rozmiar na ekranie. Kąt widzenia perspektywy jest pamiętany także
 * w rzucie ortogonalnym, bo na nim opiera się to przeliczenie.
 */
export class CameraProjectionController implements CameraViewGeometry {
	private readonly converter = new CameraProjectionConverter();
	private fieldOfViewDegrees = DEFAULT_FIELD_OF_VIEW_DEGREES;
	private stopWaitingForSurface: (() => void) | null = null;

	/**
	 * @param measureDistanceToScreenCentre odległość kamery od powierzchni pod środkiem ekranu; `null`, gdy nieznana
	 */
	constructor(
		private readonly viewer: Viewer,
		private readonly measureDistanceToScreenCentre: () => number | null
	) {}

	isOrthographic(): boolean {
		return this.viewer.camera.frustum instanceof OrthographicFrustum;
	}

	applyProjection(setting: CameraProjectionSetting): void {
		if (setting.kind === 'orthographic') {
			this.switchToOrthographic();
			return;
		}
		this.fieldOfViewDegrees = setting.fovDegrees;
		this.switchToPerspective();
	}

	readVerticalFieldOfViewRadians(): number {
		return this.converter.calculateVerticalFieldOfView(
			CesiumMath.toRadians(this.fieldOfViewDegrees),
			this.readAspectRatio()
		);
	}

	convertViewRangeToCameraDistance(viewRangeMetres: number): number {
		if (!this.isOrthographic()) return viewRangeMetres;
		return this.converter.calculatePerspectiveVisibleWidth(
			viewRangeMetres,
			this.readVerticalFieldOfViewRadians(),
			this.readAspectRatio()
		);
	}

	convertCameraDistanceToViewRange(cameraDistanceMetres: number): number {
		if (!this.isOrthographic()) return cameraDistanceMetres;
		return this.converter.calculatePerspectiveDistanceForWidth(
			cameraDistanceMetres,
			this.readVerticalFieldOfViewRadians(),
			this.readAspectRatio(),
			0
		);
	}

	readOrthographicMetresPerPixel(): number | null {
		const frustum = this.viewer.camera.frustum;
		if (!(frustum instanceof OrthographicFrustum) || frustum.width === undefined) return null;
		return this.converter.calculateMetresPerPixel(
			frustum.width,
			this.viewer.scene.canvas.clientWidth
		);
	}

	/**
	 * Po przywróceniu widoku z linku kafle świata mogą jeszcze nie być wczytane, a wtedy Cesium liczy szerokość
	 * z wysokości nad elipsoidą. Dlatego do czasu, aż pod środkiem ekranu pojawi się powierzchnia (co najwyżej
	 * kilkaset klatek), szerokość jest ustawiana ponownie na odległość od niej.
	 */
	synchronizeWidthWhenSurfaceKnown(): void {
		this.stopWaitingForSurface?.();
		if (!this.isOrthographic()) return;
		let framesWaited = 0;
		const stopListening = this.viewer.scene.postRender.addEventListener(() => {
			framesWaited++;
			const distance = this.measureDistanceToScreenCentre();
			const frustum = this.viewer.camera.frustum;
			if (!(frustum instanceof OrthographicFrustum)) {
				this.stopWaitingForSurface?.();
				return;
			}
			if (distance !== null) frustum.width = distance;
			if (distance !== null || framesWaited >= MAXIMUM_FRAMES_TO_WAIT_FOR_SURFACE) {
				this.stopWaitingForSurface?.();
			}
		});
		this.stopWaitingForSurface = () => {
			stopListening();
			this.stopWaitingForSurface = null;
		};
	}

	destroy(): void {
		this.stopWaitingForSurface?.();
	}

	private switchToOrthographic(): void {
		const camera = this.viewer.camera;
		if (camera.frustum instanceof OrthographicFrustum) return;
		const distance = this.measureDistanceToScreenCentre();
		camera.switchToOrthographicFrustum();
		const frustum = camera.frustum;
		if (distance === null || !(frustum instanceof OrthographicFrustum)) return;
		const visibleWidth = this.converter.calculatePerspectiveVisibleWidth(
			distance,
			this.readVerticalFieldOfViewRadians(),
			this.readAspectRatio()
		);
		camera.move(camera.directionWC, -(visibleWidth - distance));
		frustum.width = visibleWidth;
	}

	private switchToPerspective(): void {
		const camera = this.viewer.camera;
		const orthographicFrustum = camera.frustum;
		if (!(orthographicFrustum instanceof OrthographicFrustum)) {
			this.applyFieldOfViewToFrustum();
			return;
		}
		const orthographicWidth = orthographicFrustum.width;
		const distance = this.measureDistanceToScreenCentre();
		camera.switchToPerspectiveFrustum();
		this.applyFieldOfViewToFrustum();
		if (distance === null || orthographicWidth === undefined) return;
		const perspectiveDistance = this.converter.calculatePerspectiveDistanceForWidth(
			orthographicWidth,
			this.readVerticalFieldOfViewRadians(),
			this.readAspectRatio(),
			MINIMUM_PERSPECTIVE_DISTANCE_METRES
		);
		camera.move(camera.directionWC, distance - perspectiveDistance);
	}

	private applyFieldOfViewToFrustum(): void {
		const frustum = this.viewer.camera.frustum;
		if (frustum instanceof PerspectiveFrustum) {
			frustum.fov = CesiumMath.toRadians(this.fieldOfViewDegrees);
		}
	}

	private readAspectRatio(): number {
		const canvas = this.viewer.scene.canvas;
		return canvas.clientHeight > 0 ? canvas.clientWidth / canvas.clientHeight : 1;
	}
}
