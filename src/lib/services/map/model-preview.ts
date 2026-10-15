import {
	Axis,
	BoundingSphere,
	Cartesian3,
	CesiumWidget,
	Color,
	HeadingPitchRange,
	Math as CesiumMath,
	Model,
	Transforms
} from 'cesium';

const BACKGROUND_COLOR = '#1d1812';
const PREVIEW_PITCH_DEGREES = -30;
const PREVIEW_HEADING_DEGREES = 35;
const RANGE_IN_BOUNDING_RADII = 2.6;

/**
 * Mały, osobny widok 3D jednego przedmiotu w karcie wpisu. Używa tego samego układu osi co
 * modele świata (glTF: Wschód, Góra, −Północ), bez globusa, nieba i podkładu. Użytkownik może
 * obracać i przybliżać model myszą albo palcem. Wynik starszego żądania jest pomijany.
 */
export class ModelPreview {
	private readonly widget: CesiumWidget;
	private model: Model | null = null;
	private latestRequest = 0;

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

	async showModel(modelUrl: string): Promise<void> {
		const request = ++this.latestRequest;
		this.removeModel();
		const originFrame = Transforms.eastNorthUpToFixedFrame(Cartesian3.fromDegrees(0, 0, 0));
		const model = await Model.fromGltfAsync({
			url: modelUrl,
			modelMatrix: originFrame,
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

	private frameModel(model: Model): void {
		const sphere = BoundingSphere.clone(model.boundingSphere);
		const camera = this.widget.camera;
		camera.lookAt(
			sphere.center,
			new HeadingPitchRange(
				CesiumMath.toRadians(PREVIEW_HEADING_DEGREES),
				CesiumMath.toRadians(PREVIEW_PITCH_DEGREES),
				Math.max(sphere.radius, 0.01) * RANGE_IN_BOUNDING_RADII
			)
		);
		this.widget.scene.screenSpaceCameraController.minimumZoomDistance = sphere.radius * 0.8;
		this.widget.scene.screenSpaceCameraController.maximumZoomDistance = sphere.radius * 8;
		this.widget.scene.requestRender();
	}

	private removeModel(): void {
		if (!this.model) return;
		this.widget.scene.primitives.remove(this.model);
		this.model = null;
	}
}
