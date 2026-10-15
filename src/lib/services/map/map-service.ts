import {
	Cartesian3,
	Cesium3DTileset,
	Color,
	DirectionalLight,
	HeadingPitchRange,
	Ion,
	Math as CesiumMath,
	Transforms,
	Viewer
} from 'cesium';
import type { Anchor } from '#lib/data/types.js';
import { ViewerOptionsBuilder } from './viewer-options-builder.js';

const BACKGROUND_COLOR = '#14110d';
const LIGHT_DIRECTION_FROM_ABOVE = new Cartesian3(-1, 0.35, -0.25);
const OVERVIEW_PITCH_DEGREES = -50;
const OVERVIEW_RANGE_IN_WORLD_RADII = 2.2;

/**
 * Serwis mapy 3D. Obiekty Cesium trzyma w zwykłych polach — nigdy w `$state`,
 * bo proxy Svelte psuje Cesium.
 */
export class MapService {
	private readonly viewer: Viewer;
	private worldTileset: Cesium3DTileset | null = null;
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
	 * Tileset z ion nie jest georeferencjonowany: ion zamienia osie glTF (Wschód, Góra, -Północ)
	 * na lokalne (Wschód, Północ, Góra) wokół środka Ziemi. Macierz ENU kotwicy stawia go
	 * w punkcie kotwicy z poprawnymi kierunkami świata.
	 */
	async loadWorldTileset(ionAssetId: number, anchor: Anchor): Promise<void> {
		const tileset = await Cesium3DTileset.fromIonAssetId(ionAssetId, {
			modelMatrix: Transforms.eastNorthUpToFixedFrame(
				Cartesian3.fromDegrees(anchor.lon, anchor.lat, anchor.h)
			)
		});
		if (this.isDestroyed) {
			tileset.destroy();
			return;
		}
		this.worldTileset = tileset;
		this.viewer.scene.primitives.add(tileset);
		this.showWholeWorld(0);
	}

	showWholeWorld(flightDurationSeconds = 1.5): void {
		if (!this.worldTileset) return;
		const sphere = this.worldTileset.boundingSphere;
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
		this.worldTileset = null;
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
}
