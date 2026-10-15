import {
	Cartesian2,
	Cartesian3,
	Math as CesiumMath,
	ScreenSpaceEventHandler,
	ScreenSpaceEventType,
	type Viewer
} from 'cesium';
import type { WorldFrame, WorldPosition } from '#lib/services/geodesy/world-frame.js';
import { isFeaturePick, type FeaturePick } from './data-layers-renderer.js';

export interface MapClick {
	position: WorldPosition | null;
	featurePick: FeaturePick | null;
}

export interface MapViewListeners {
	onCursorMoved(position: WorldPosition | null): void;
	onMapClicked(click: MapClick): void;
	onHeadingChanged(headingDegrees: number): void;
	onScaleChanged(metresPerPixel: number | null): void;
	onCameraSettled(): void;
}

const SCALE_SAMPLE_PIXELS = 100;
const CAMERA_CHANGE_SENSITIVITY = 0.01;
const FRAMES_BETWEEN_SCALE_RETRIES = 30;

/**
 * Śledzi kursor i kamerę, ale liczy pozycje najwyżej raz na klatkę (po renderze), bo
 * `pickPosition` czyta bufor głębi i przy każdym ruchu myszy byłby zbyt kosztowny.
 * Dopóki skala jest nieznana (kafle terenu jeszcze się wczytują), pomiar ponawiany jest co kilkadziesiąt klatek.
 */
export class MapViewObserver {
	private readonly inputHandler: ScreenSpaceEventHandler;
	private readonly stopListeningToCamera: () => void;
	private readonly stopListeningToRender: () => void;
	private readonly stopListeningToCameraSettling: () => void;
	private pendingCursorPosition: Cartesian2 | null = null;
	private isCameraChanged = true;
	private isScaleKnown = false;
	private framesSinceScaleAttempt = 0;

	constructor(
		private readonly viewer: Viewer,
		private readonly listeners: MapViewListeners,
		private readonly getWorldFrame: () => WorldFrame | null
	) {
		this.inputHandler = new ScreenSpaceEventHandler(viewer.scene.canvas);
		this.inputHandler.setInputAction((movement: ScreenSpaceEventHandler.MotionEvent) => {
			this.pendingCursorPosition = Cartesian2.clone(movement.endPosition);
		}, ScreenSpaceEventType.MOUSE_MOVE);
		this.inputHandler.setInputAction((click: ScreenSpaceEventHandler.PositionedEvent) => {
			this.listeners.onMapClicked(this.describeClick(click.position));
		}, ScreenSpaceEventType.LEFT_CLICK);
		viewer.scene.canvas.addEventListener('mouseleave', this.reportCursorLeftMap);

		viewer.camera.percentageChanged = CAMERA_CHANGE_SENSITIVITY;
		this.stopListeningToCamera = viewer.camera.changed.addEventListener(() => {
			this.isCameraChanged = true;
		});
		this.stopListeningToCameraSettling = viewer.camera.moveEnd.addEventListener(() =>
			this.listeners.onCameraSettled()
		);
		this.stopListeningToRender = viewer.scene.postRender.addEventListener(() =>
			this.reportChangesAfterRender()
		);
	}

	pickWorldPosition(screenPosition: Cartesian2): WorldPosition | null {
		const frame = this.getWorldFrame();
		const sceneCartesian = this.pickSceneCartesian(screenPosition);
		if (!frame || !sceneCartesian) return null;
		return frame.toWorldPosition(sceneCartesian);
	}

	pickSceneCartesian(screenPosition: Cartesian2): Cartesian3 | null {
		const scene = this.viewer.scene;
		if (!scene.pickPositionSupported) return null;
		return scene.pickPosition(screenPosition) ?? null;
	}

	private describeClick(screenPosition: Cartesian2): MapClick {
		const picked: unknown = this.viewer.scene.pick(screenPosition);
		const pickedId =
			typeof picked === 'object' && picked !== null && 'id' in picked ? picked.id : null;
		return {
			position: this.pickWorldPosition(screenPosition),
			featurePick: isFeaturePick(pickedId) ? pickedId : null
		};
	}

	destroy(): void {
		this.viewer.scene.canvas.removeEventListener('mouseleave', this.reportCursorLeftMap);
		this.stopListeningToCamera();
		this.stopListeningToCameraSettling();
		this.stopListeningToRender();
		if (!this.inputHandler.isDestroyed()) this.inputHandler.destroy();
	}

	private readonly reportCursorLeftMap = (): void => {
		this.pendingCursorPosition = null;
		this.listeners.onCursorMoved(null);
	};

	private reportChangesAfterRender(): void {
		if (this.pendingCursorPosition) {
			this.listeners.onCursorMoved(this.pickWorldPosition(this.pendingCursorPosition));
			this.pendingCursorPosition = null;
		}
		this.framesSinceScaleAttempt++;
		const shouldRetryScale =
			!this.isScaleKnown && this.framesSinceScaleAttempt >= FRAMES_BETWEEN_SCALE_RETRIES;
		if (this.isCameraChanged || shouldRetryScale) {
			this.isCameraChanged = false;
			this.framesSinceScaleAttempt = 0;
			this.listeners.onHeadingChanged(CesiumMath.toDegrees(this.viewer.camera.heading));
			const metresPerPixel = this.measureMetresPerPixelAtCentre();
			this.isScaleKnown = metresPerPixel !== null;
			this.listeners.onScaleChanged(metresPerPixel);
		}
	}

	private measureMetresPerPixelAtCentre(): number | null {
		const canvas = this.viewer.scene.canvas;
		const centre = new Cartesian2(canvas.clientWidth / 2, canvas.clientHeight / 2);
		const sideways = new Cartesian2(centre.x + SCALE_SAMPLE_PIXELS, centre.y);
		const centrePoint = this.pickSceneCartesian(centre);
		const sidewaysPoint = this.pickSceneCartesian(sideways);
		if (!centrePoint || !sidewaysPoint) return null;
		return Cartesian3.distance(centrePoint, sidewaysPoint) / SCALE_SAMPLE_PIXELS;
	}
}
