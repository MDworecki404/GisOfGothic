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

const BACKGROUND_COLOR = '#1d1812';
const PREVIEW_PITCH_DEGREES = -30;
const STANDING_PREVIEW_PITCH_DEGREES = -8;
const FROM_ABOVE_PREVIEW_PITCH_DEGREES = -62;
const PREVIEW_HEADING_DEGREES = 35;
const RANGE_IN_BOUNDING_RADII = 2.6;
const STANDING_RANGE_IN_BOUNDING_RADII = 4.2;

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
 * obracać i przybliżać model myszą albo palcem. Wynik starszego żądania jest pomijany.
 */
export class ModelPreview {
	private readonly widget: CesiumWidget;
	private models: Model[] = [];
	private view: PreviewView = OBJECT_PREVIEW_VIEW;
	private latestRequest = 0;
	private orientation: PreviewOrientation = 'as-saved';

	constructor(container: HTMLElement) {
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
		scene.screenSpaceCameraController.enableTranslate = false;
		scene.screenSpaceCameraController.enableTilt = false;
		scene.screenSpaceCameraController.enableLook = false;
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
		models.forEach((model) => {
			this.widget.scene.primitives.add(model);
			model.readyEvent.addEventListener(() => this.frameModelsWhenReady());
			model.texturesReadyEvent.addEventListener(() => this.widget.scene.requestRender());
		});
		this.frameModelsWhenReady();
	}

	destroy(): void {
		this.latestRequest++;
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
		const camera = this.widget.camera;
		camera.lookAt(
			sphere.center,
			new HeadingPitchRange(
				CesiumMath.toRadians(this.view.headingDegrees),
				CesiumMath.toRadians(this.choosePitchDegrees()),
				Math.max(sphere.radius, 0.01) * this.chooseRangeInBoundingRadii()
			)
		);
		this.widget.scene.screenSpaceCameraController.minimumZoomDistance = sphere.radius * 0.8;
		this.widget.scene.screenSpaceCameraController.maximumZoomDistance = sphere.radius * 8;
		this.widget.scene.requestRender();
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
