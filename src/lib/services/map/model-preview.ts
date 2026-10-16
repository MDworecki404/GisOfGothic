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

const BACKGROUND_COLOR = '#1d1812';
const PREVIEW_PITCH_DEGREES = -30;
const STANDING_PREVIEW_PITCH_DEGREES = -8;
const FROM_ABOVE_PREVIEW_PITCH_DEGREES = -62;
const PREVIEW_HEADING_DEGREES = 35;
const RANGE_IN_BOUNDING_RADII = 2.6;
const STANDING_RANGE_IN_BOUNDING_RADII = 4.2;

/**
 * Mały, osobny widok 3D jednego przedmiotu w karcie wpisu. Używa tego samego układu osi co
 * modele świata (glTF: Wschód, Góra, −Północ), bez globusa, nieba i podkładu. Użytkownik może
 * obracać i przybliżać model myszą albo palcem. Wynik starszego żądania jest pomijany.
 */
export class ModelPreview {
	private readonly widget: CesiumWidget;
	private model: Model | null = null;
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

	async showModel(modelUrl: string, orientation: PreviewOrientation): Promise<void> {
		const request = ++this.latestRequest;
		this.removeModel();
		this.orientation = orientation;
		const model = await Model.fromGltfAsync({
			url: modelUrl,
			modelMatrix: this.buildModelMatrix(orientation),
			upAxis: Axis.Y,
			forwardAxis: Axis.X
		});
		if (this.widget.isDestroyed() || request !== this.latestRequest) {
			model.destroy();
			return;
		}
		this.model = model;
		this.widget.scene.primitives.add(model);
		model.readyEvent.addEventListener(() => this.frameModel(model));
		if (model.ready) this.frameModel(model);
	}

	destroy(): void {
		this.latestRequest++;
		if (!this.widget.isDestroyed()) this.widget.destroy();
		this.model = null;
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

	private frameModel(model: Model): void {
		const sphere = BoundingSphere.clone(model.boundingSphere);
		const camera = this.widget.camera;
		camera.lookAt(
			sphere.center,
			new HeadingPitchRange(
				CesiumMath.toRadians(PREVIEW_HEADING_DEGREES),
				CesiumMath.toRadians(this.choosePitchDegrees()),
				Math.max(sphere.radius, 0.01) *
					(this.orientation === 'as-saved'
						? RANGE_IN_BOUNDING_RADII
						: STANDING_RANGE_IN_BOUNDING_RADII)
			)
		);
		this.widget.scene.screenSpaceCameraController.minimumZoomDistance = sphere.radius * 0.8;
		this.widget.scene.screenSpaceCameraController.maximumZoomDistance = sphere.radius * 8;
		this.widget.scene.requestRender();
	}

	private isStanding(): boolean {
		return this.orientation === 'stand-on-east-axis' || this.orientation === 'stand-on-north-axis';
	}

	private choosePitchDegrees(): number {
		if (this.isStanding()) return STANDING_PREVIEW_PITCH_DEGREES;
		if (this.orientation === 'view-from-above') return FROM_ABOVE_PREVIEW_PITCH_DEGREES;
		return PREVIEW_PITCH_DEGREES;
	}

	private removeModel(): void {
		if (!this.model) return;
		this.widget.scene.primitives.remove(this.model);
		this.model = null;
	}
}
