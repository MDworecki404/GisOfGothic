import {
	Axis,
	BoundingSphere,
	Cartesian3,
	CesiumWidget,
	Color,
	HeadingPitchRange,
	Math as CesiumMath,
	Matrix3,
	Matrix4,
	Model,
	Transforms
} from 'cesium';
import type { PreviewOrientation } from '#lib/services/models/preview-orientation.js';
import { InMemoryModelResource } from './in-memory-model-resource.js';
import { PreviewCameraMath } from './preview-camera-math.js';

const BACKGROUND_COLOR = '#1d1812';
const PREVIEW_PITCH_DEGREES = -30;
const STANDING_PREVIEW_PITCH_DEGREES = -8;
const FROM_ABOVE_PREVIEW_PITCH_DEGREES = -62;
const PREVIEW_HEADING_DEGREES = 35;
const MAXIMUM_FORCED_RENDER_MILLISECONDS = 15000;
const FRAMES_AFTER_MODELS_READY = 5;
const FRAMES_WAITING_FOR_TEXTURES = 120;
const RANGE_IN_BOUNDING_RADII = 2.6;
const STANDING_RANGE_IN_BOUNDING_RADII = 4.2;
const BUTTON_TILT_STEP_DEGREES = 12;
const BUTTON_ZOOM_FACTOR = 0.8;
const MINIMUM_RANGE_IN_BOUNDING_RADII = 0.8;
const MAXIMUM_RANGE_IN_BOUNDING_RADII = 8;

interface CameraPose {
	headingDegrees: number;
	pitchDegrees: number;
	range: number;
}

/** Wywołania zwrotne, którymi podgląd zgłasza zmiany, które nie wynikają z poleceń (np. dotknięcie zatrzymuje obrót). */
export interface ModelPreviewListener {
	onAutoRotationChanged(isAutoRotating: boolean): void;
}

/** Z której strony i jak daleko (w promieniach bryły modelu) patrzy kamera; `null` dobiera odległość do ułożenia. */
export interface PreviewView {
	headingDegrees: number;
	rangeInBoundingRadii: number | null;
}

const OBJECT_PREVIEW_VIEW: PreviewView = {
	headingDegrees: PREVIEW_HEADING_DEGREES,
	rangeInBoundingRadii: null
};

/**
 * Mały, osobny widok 3D jednego przedmiotu w karcie wpisu. Używa tego samego układu osi co
 * modele świata (glTF: Wschód, Góra, −Północ), bez globusa, nieba i podkładu. Użytkownik może
 * obracać (także w górę i w dół) i przybliżać model myszą albo palcem, a przyciski dostają polecenia
 * `tilt`, `zoom`, `resetView` i `setAutoRotation`. Gesty obsługuje sama klasa (kontroler kamery Cesium jest
 * wyłączony), żeby przechył miał limity. Wynik starszego żądania jest pomijany.
 */
export class ModelPreview {
	private readonly widget: CesiumWidget;
	private models: Model[] = [];
	private texturesLoadedCount = 0;
	private view: PreviewView = OBJECT_PREVIEW_VIEW;
	private latestRequest = 0;
	private orientation: PreviewOrientation = 'as-saved';
	private readonly cameraMath = new PreviewCameraMath();
	private readonly activePointers = new Map<number, { x: number; y: number }>();
	private target: Cartesian3 = Cartesian3.ZERO;
	private defaultPose: CameraPose = { headingDegrees: 0, pitchDegrees: -30, range: 1 };
	private pose: CameraPose = this.defaultPose;
	private minimumRange = 0.01;
	private maximumRange = 100;
	private isFramed = false;
	private isAutoRotating = false;
	private lastAutoRotationTimestamp = 0;

	constructor(
		container: HTMLElement,
		private readonly listener: ModelPreviewListener
	) {
		this.widget = new CesiumWidget(container, {
			baseLayer: false,
			skyBox: false,
			skyAtmosphere: false,
			creditContainer: document.createElement('div'),
			requestRenderMode: true,
			showRenderLoopErrors: false
		});
		const scene = this.widget.scene;
		scene.globe.show = false;
		scene.backgroundColor = Color.fromCssColorString(BACKGROUND_COLOR);
		scene.fog.enabled = false;
		if (scene.sun) scene.sun.show = false;
		if (scene.moon) scene.moon.show = false;
		const controller = scene.screenSpaceCameraController;
		controller.enableRotate = false;
		controller.enableTranslate = false;
		controller.enableZoom = false;
		controller.enableTilt = false;
		controller.enableLook = false;
		this.listenForGestures(this.widget.canvas);
	}

	/** Obraca model o `deltaDegrees` w pionie (dodatnie — ku górze modelu), w granicach dozwolonego przechyłu. */
	tilt(deltaDegrees: number): void {
		this.setPose({
			...this.pose,
			pitchDegrees: this.cameraMath.clampPitchDegrees(this.pose.pitchDegrees + deltaDegrees)
		});
	}

	tiltUp(): void {
		this.tilt(BUTTON_TILT_STEP_DEGREES);
	}

	tiltDown(): void {
		this.tilt(-BUTTON_TILT_STEP_DEGREES);
	}

	zoomIn(): void {
		this.zoomBy(BUTTON_ZOOM_FACTOR);
	}

	zoomOut(): void {
		this.zoomBy(1 / BUTTON_ZOOM_FACTOR);
	}

	resetView(): void {
		this.setPose(this.defaultPose);
	}

	setAutoRotation(isEnabled: boolean): void {
		if (this.isAutoRotating === isEnabled) return;
		this.isAutoRotating = isEnabled;
		this.listener.onAutoRotationChanged(isEnabled);
		if (isEnabled) {
			this.lastAutoRotationTimestamp = performance.now();
			requestAnimationFrame((timestamp) => this.rotateAutomatically(timestamp));
		}
	}

	/** Po zmianie rozmiaru kontenera (np. pełny ekran) prosi o nową klatkę, bo widget renderuje tylko na żądanie. */
	refreshSize(): void {
		if (this.widget.isDestroyed()) return;
		this.widget.resize();
		this.widget.scene.requestRender();
	}

	private zoomBy(factor: number): void {
		this.setPose({
			...this.pose,
			range: this.cameraMath.zoomRange(
				this.pose.range,
				factor,
				this.minimumRange,
				this.maximumRange
			)
		});
	}

	private setPose(pose: CameraPose): void {
		this.pose = pose;
		this.applyPose();
	}

	private applyPose(): void {
		if (!this.isFramed || this.widget.isDestroyed()) return;
		this.widget.camera.lookAt(
			this.target,
			new HeadingPitchRange(
				CesiumMath.toRadians(this.pose.headingDegrees),
				CesiumMath.toRadians(this.pose.pitchDegrees),
				this.pose.range
			)
		);
		this.widget.scene.requestRender();
	}

	private rotateAutomatically(timestamp: number): void {
		if (!this.isAutoRotating || this.widget.isDestroyed()) return;
		const elapsedMilliseconds = Math.min(timestamp - this.lastAutoRotationTimestamp, 100);
		this.lastAutoRotationTimestamp = timestamp;
		this.setPose({
			...this.pose,
			headingDegrees: this.cameraMath.advanceAutoRotation(
				this.pose.headingDegrees,
				elapsedMilliseconds
			)
		});
		requestAnimationFrame((next) => this.rotateAutomatically(next));
	}

	private listenForGestures(canvas: HTMLCanvasElement): void {
		canvas.style.touchAction = 'none';
		canvas.addEventListener('pointerdown', (event) => {
			this.setAutoRotation(false);
			canvas.setPointerCapture(event.pointerId);
			this.activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
		});
		canvas.addEventListener('pointermove', (event) => this.dragPointer(event));
		const releasePointer = (event: PointerEvent): void => {
			this.activePointers.delete(event.pointerId);
		};
		canvas.addEventListener('pointerup', releasePointer);
		canvas.addEventListener('pointercancel', releasePointer);
		canvas.addEventListener(
			'wheel',
			(event) => {
				event.preventDefault();
				this.zoomBy(this.cameraMath.wheelZoomFactor(event.deltaY));
			},
			{ passive: false }
		);
	}

	private dragPointer(event: PointerEvent): void {
		const previous = this.activePointers.get(event.pointerId);
		if (!previous) return;
		const current = { x: event.clientX, y: event.clientY };
		if (this.activePointers.size >= 2) {
			const other = [...this.activePointers.entries()].find(([id]) => id !== event.pointerId);
			if (other) {
				const otherPoint = other[1];
				const previousDistance = Math.hypot(previous.x - otherPoint.x, previous.y - otherPoint.y);
				const currentDistance = Math.hypot(current.x - otherPoint.x, current.y - otherPoint.y);
				this.zoomBy(this.cameraMath.pinchZoomFactor(previousDistance, currentDistance));
			}
		} else {
			const angles = this.cameraMath.dragAngles(
				this.pose,
				current.x - previous.x,
				current.y - previous.y
			);
			this.setPose({ ...this.pose, ...angles });
		}
		this.activePointers.set(event.pointerId, current);
	}

	async showModel(
		glb: Uint8Array<ArrayBuffer>,
		cacheKey: string,
		orientation: PreviewOrientation
	): Promise<void> {
		await this.showModels([{ glb, cacheKey }], orientation, OBJECT_PREVIEW_VIEW);
	}

	/**
	 * Pokazuje kilka modeli w tym samym miejscu sceny (części jednej postaci) i kadruje kamerę
	 * na ich wspólnej bryle według `view`.
	 */
	async showModels(
		parts: readonly { glb: Uint8Array<ArrayBuffer>; cacheKey: string }[],
		orientation: PreviewOrientation,
		view: PreviewView
	): Promise<void> {
		const request = ++this.latestRequest;
		this.removeModels();
		this.orientation = orientation;
		this.view = view;
		this.isFramed = false;
		const modelMatrix = this.buildModelMatrix(orientation);
		const models = await Promise.all(
			parts.map((part) =>
				Model.fromGltfAsync({
					url: new InMemoryModelResource(part.glb, part.cacheKey),
					modelMatrix,
					upAxis: Axis.Y,
					forwardAxis: Axis.X
				})
			)
		);
		if (this.widget.isDestroyed() || request !== this.latestRequest) {
			models.forEach((model) => model.destroy());
			return;
		}
		this.models = models;
		this.texturesLoadedCount = 0;
		models.forEach((model) => {
			this.widget.scene.primitives.add(model);
			model.readyEvent.addEventListener(() => this.frameModelsWhenReady());
			model.texturesReadyEvent.addEventListener(() => {
				this.texturesLoadedCount++;
				this.widget.scene.requestRender();
			});
		});
		this.frameModelsWhenReady();
		this.keepRenderingUntilModelsAreDrawn(request);
	}

	/**
	 * Widget renderuje tylko na żądanie, a model i jego tekstury trafiają na kartę graficzną w kolejnych klatkach,
	 * po których nic nie prosi o następną. Bez tego podgląd zostaje pusty, dopóki użytkownik nie ruszy kamerą,
	 * więc wymuszamy klatki, aż wszystkie modele będą gotowe (z limitem czasu na wypadek błędu wczytywania).
	 */
	private keepRenderingUntilModelsAreDrawn(request: number): void {
		const startedAtMilliseconds = performance.now();
		let framesAfterReady = 0;
		const requestFrame = (): void => {
			if (this.widget.isDestroyed() || request !== this.latestRequest) return;
			this.widget.scene.requestRender();
			const areModelsReady = this.models.every((model) => model.ready);
			framesAfterReady = areModelsReady ? framesAfterReady + 1 : 0;
			const framesToWait =
				this.texturesLoadedCount >= this.models.length
					? FRAMES_AFTER_MODELS_READY
					: FRAMES_WAITING_FOR_TEXTURES;
			const hasTimedOut =
				performance.now() - startedAtMilliseconds > MAXIMUM_FORCED_RENDER_MILLISECONDS;
			if (framesAfterReady < framesToWait && !hasTimedOut) {
				requestAnimationFrame(requestFrame);
			}
		};
		requestAnimationFrame(requestFrame);
	}

	destroy(): void {
		this.latestRequest++;
		this.isAutoRotating = false;
		if (!this.widget.isDestroyed()) this.widget.destroy();
		this.models = [];
	}

	/**
	 * Obrót w lokalnej ramie (Wschód, Północ, Góra) wokół punktu pod modelem: o 90° wokół osi
	 * północnej stawia oś wschodnią w pion tak, że strona −x (głowica broni) jest u góry;
	 * o 90° wokół osi wschodniej stawia w pion oś północną.
	 */
	private buildModelMatrix(orientation: PreviewOrientation): Matrix4 {
		const originFrame = Transforms.eastNorthUpToFixedFrame(Cartesian3.fromDegrees(0, 0, 0));
		if (orientation === 'as-saved' || orientation === 'view-from-above') return originFrame;
		const rotation =
			orientation === 'stand-on-east-axis'
				? Matrix3.fromRotationY(CesiumMath.toRadians(90))
				: Matrix3.fromRotationX(CesiumMath.toRadians(90));
		return Matrix4.multiply(
			originFrame,
			Matrix4.fromRotationTranslation(rotation, Cartesian3.ZERO),
			new Matrix4()
		);
	}

	private frameModelsWhenReady(): void {
		if (this.models.length === 0 || this.models.some((model) => !model.ready)) return;
		const sphere = this.models
			.map((model) => model.boundingSphere)
			.reduce((union, next) => BoundingSphere.union(union, next, new BoundingSphere()));
		if (this.isFramed) return;
		this.isFramed = true;
		const radius = Math.max(sphere.radius, 0.01);
		this.target = sphere.center;
		this.defaultPose = {
			headingDegrees: this.view.headingDegrees,
			pitchDegrees: this.choosePitchDegrees(),
			range: radius * this.chooseRangeInBoundingRadii()
		};
		this.minimumRange = radius * MINIMUM_RANGE_IN_BOUNDING_RADII;
		this.maximumRange = radius * MAXIMUM_RANGE_IN_BOUNDING_RADII;
		this.setPose(this.defaultPose);
	}

	private chooseRangeInBoundingRadii(): number {
		if (this.view.rangeInBoundingRadii !== null) return this.view.rangeInBoundingRadii;
		return this.orientation === 'as-saved'
			? RANGE_IN_BOUNDING_RADII
			: STANDING_RANGE_IN_BOUNDING_RADII;
	}

	private isStanding(): boolean {
		return this.orientation === 'stand-on-east-axis' || this.orientation === 'stand-on-north-axis';
	}

	private choosePitchDegrees(): number {
		if (this.isStanding()) return STANDING_PREVIEW_PITCH_DEGREES;
		if (this.orientation === 'view-from-above') return FROM_ABOVE_PREVIEW_PITCH_DEGREES;
		return PREVIEW_PITCH_DEGREES;
	}

	private removeModels(): void {
		this.models.forEach((model) => this.widget.scene.primitives.remove(model));
		this.models = [];
	}
}
