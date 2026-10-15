import {
	Axis,
	Cartesian3,
	Color,
	DirectionalLight,
	HeadingPitchRange,
	Ion,
	Math as CesiumMath,
	Model,
	Transforms,
	Viewer
} from 'cesium';
import type { Anchor } from '#lib/data/types.js';
import { ViewerOptionsBuilder } from './viewer-options-builder.js';

const BACKGROUND_COLOR = '#14110d';
const LIGHT_DIRECTION_FROM_ABOVE = new Cartesian3(-1, 0.35, -0.25);
const OVERVIEW_PITCH_DEGREES = -50;
const OVERVIEW_RANGE_IN_WORLD_RADII = 2.2;

export interface WorldModelSource {
	url: string;
	anchor: Anchor;
}

/**
 * Serwis mapy 3D. Obiekty Cesium trzyma w zwykłych polach — nigdy w `$state`,
 * bo proxy Svelte psuje Cesium.
 */
export class MapService {
	private readonly viewer: Viewer;
	private worldModel: Model | null = null;
	private isDestroyed = false;

	constructor(container: HTMLElement, ionAccessToken?: string) {
		if (ionAccessToken) Ion.defaultAccessToken = ionAccessToken;

		const options = new ViewerOptionsBuilder()
			.withoutIonBaseLayer()
			.withoutToolbarWidgets()
			.withoutFeatureInfoPopups()
			.withHiddenCredits()
			.build();
		this.viewer = new Viewer(container, options);
		this.configureSceneForWorldBelowSeaLevel();
	}

	/**
	 * Wczytuje model świata z osiami glTF (Wschód, Góra, -Północ) w układzie ENU kotwicy
	 * i ustawia kamerę na widok całego świata. Bez `forwardAxis: Axis.X` Cesium obróciłby model.
	 */
	async loadWorldModel({ url, anchor }: WorldModelSource): Promise<void> {
		const modelMatrix = Transforms.eastNorthUpToFixedFrame(
			Cartesian3.fromDegrees(anchor.lon, anchor.lat, anchor.h)
		);
		const model = await Model.fromGltfAsync({
			url,
			modelMatrix,
			upAxis: Axis.Y,
			forwardAxis: Axis.X
		});
		if (this.isDestroyed) {
			model.destroy();
			return;
		}
		this.worldModel = model;
		this.viewer.scene.primitives.add(model);
		await this.waitUntilModelIsReady(model);
		if (!this.isDestroyed) this.showWholeWorld(0);
	}

	showWholeWorld(flightDurationSeconds = 1.5): void {
		if (!this.worldModel) return;
		const sphere = this.worldModel.boundingSphere;
		this.viewer.camera.flyToBoundingSphere(sphere, {
			duration: flightDurationSeconds,
			offset: new HeadingPitchRange(
				0,
				CesiumMath.toRadians(OVERVIEW_PITCH_DEGREES),
				sphere.radius * OVERVIEW_RANGE_IN_WORLD_RADII
			)
		});
	}

	destroy(): void {
		this.isDestroyed = true;
		if (!this.viewer.isDestroyed()) this.viewer.destroy();
		this.worldModel = null;
	}

	/**
	 * Teren leży częściowo poniżej 0 m, więc globus jest wyłączony. W lon/lat 0,0 oś +X ECEF
	 * wskazuje „górę”, dlatego światło kierunkowe ma kierunek zbliżony do -X.
	 */
	private configureSceneForWorldBelowSeaLevel(): void {
		const scene = this.viewer.scene;
		scene.globe.show = false;
		scene.backgroundColor = Color.fromCssColorString(BACKGROUND_COLOR);
		scene.fog.enabled = false;
		if (scene.skyBox) scene.skyBox.show = false;
		if (scene.skyAtmosphere) scene.skyAtmosphere.show = false;
		if (scene.sun) scene.sun.show = false;
		if (scene.moon) scene.moon.show = false;
		scene.light = new DirectionalLight({
			direction: Cartesian3.normalize(LIGHT_DIRECTION_FROM_ABOVE, new Cartesian3()),
			intensity: 1
		});
	}

	private waitUntilModelIsReady(model: Model): Promise<void> {
		return new Promise((resolve, reject) => {
			if (model.ready) {
				resolve();
				return;
			}
			model.readyEvent.addEventListener(() => resolve());
			model.errorEvent.addEventListener((error) =>
				reject(error instanceof Error ? error : new Error(String(error)))
			);
		});
	}
}
