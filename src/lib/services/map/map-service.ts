import {
	BoundingSphere,
	Cartesian2,
	Cartesian3,
	Cesium3DTileset,
	Color,
	DirectionalLight,
	HeadingPitchRange,
	Ion,
	Math as CesiumMath,
	Viewer
} from 'cesium';
import type { Anchor } from '#lib/data/types.js';
import { WorldFrame } from '#lib/services/geodesy/world-frame.js';
import { DataLayersRenderer, type DataLayerPoint } from './data-layers-renderer.js';
import { MapViewObserver, type MapViewListeners } from './map-view-observer.js';
import { PlaceMarkersLayer, type PlaceMarker } from './place-markers-layer.js';
import { ViewerOptionsBuilder } from './viewer-options-builder.js';

const BACKGROUND_COLOR = '#14110d';
const LIGHT_DIRECTION_FROM_ABOVE = new Cartesian3(-1, 0.35, -0.25);
const OVERVIEW_PITCH_DEGREES = -50;
const OVERVIEW_RANGE_IN_WORLD_RADII = 2.2;
const ZOOM_STEP_FRACTION = 0.35;
const FALLBACK_ZOOM_DISTANCE_METRES = 400;
const NORTH_RESET_DURATION_SECONDS = 0.6;

/**
 * Serwis mapy 3D. Obiekty Cesium trzyma w zwykłych polach — nigdy w `$state`,
 * bo proxy Svelte psuje Cesium.
 */
export class MapService {
	private readonly viewer: Viewer;
	private readonly viewObserver: MapViewObserver;
	private readonly placeMarkers: PlaceMarkersLayer;
	private readonly dataLayers: DataLayersRenderer;
	private worldTileset: Cesium3DTileset | null = null;
	private worldFrame: WorldFrame | null = null;
	private isDestroyed = false;
	private latestTilesetRequest = 0;

	constructor(container: HTMLElement, listeners: MapViewListeners, ionAccessToken?: string) {
		if (ionAccessToken) Ion.defaultAccessToken = ionAccessToken;

		const options = new ViewerOptionsBuilder()
			.withoutIonBaseLayer()
			.withoutToolbarWidgets()
			.withoutFeatureInfoPopups()
			.withHiddenCredits()
			.build();
		this.viewer = new Viewer(container, options);
		this.configureSceneForWorldBelowSeaLevel();
		this.viewObserver = new MapViewObserver(this.viewer, listeners, () => this.worldFrame);
		this.dataLayers = new DataLayersRenderer(this.viewer);
		this.placeMarkers = new PlaceMarkersLayer(this.viewer);
	}

	/**
	 * Tileset z ion nie jest georeferencjonowany: ion zamienia osie glTF (Wschód, Góra, -Północ)
	 * na lokalne (Wschód, Północ, Góra) wokół środka Ziemi. Macierz ENU kotwicy stawia go
	 * w punkcie kotwicy z poprawnymi kierunkami świata. Tileset z wcześniejszego, wyprzedzonego
	 * wywołania jest niszczony zamiast pokazany.
	 */
	async showWorldTileset(ionAssetId: number, anchor: Anchor): Promise<void> {
		const request = ++this.latestTilesetRequest;
		this.removeWorldTileset();
		const frame = new WorldFrame(anchor);
		const tileset = await Cesium3DTileset.fromIonAssetId(ionAssetId, {
			modelMatrix: frame.anchorToEcef
		});
		if (this.isDestroyed || request !== this.latestTilesetRequest) {
			tileset.destroy();
			return;
		}
		this.worldTileset = tileset;
		this.worldFrame = frame;
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

	zoomIn(): void {
		this.viewer.camera.zoomIn(this.measureDistanceToScreenCentre() * ZOOM_STEP_FRACTION);
	}

	zoomOut(): void {
		this.viewer.camera.zoomOut(this.measureDistanceToScreenCentre() * ZOOM_STEP_FRACTION);
	}

	/** Obraca kamerę na północ wokół punktu w środku ekranu, zachowując nachylenie i odległość. */
	turnToNorth(): void {
		const camera = this.viewer.camera;
		const centre = this.pickPointAtScreenCentre();
		if (!centre) {
			camera.setView({ orientation: { heading: 0, pitch: camera.pitch, roll: 0 } });
			return;
		}
		camera.flyToBoundingSphere(new BoundingSphere(centre, 0), {
			duration: NORTH_RESET_DURATION_SECONDS,
			offset: new HeadingPitchRange(0, camera.pitch, Cartesian3.distance(camera.position, centre))
		});
	}

	showPlaceMarkers(markers: readonly PlaceMarker[], shouldFlyToMarkers: boolean): void {
		this.placeMarkers.showMarkers(markers);
		if (shouldFlyToMarkers) this.placeMarkers.flyToAllMarkers();
	}

	flyToPlaceMarker(index: number): void {
		this.placeMarkers.flyToMarker(index);
	}

	clearPlaceMarkers(): void {
		this.placeMarkers.clearMarkers();
	}

	showDataLayer(layerId: string, points: readonly DataLayerPoint[], cssColor: string): void {
		this.dataLayers.showLayer(layerId, points, cssColor);
	}

	hideDataLayer(layerId: string): void {
		this.dataLayers.hideLayer(layerId);
	}

	removeWorldTileset(): void {
		if (!this.worldTileset) return;
		this.viewer.scene.primitives.remove(this.worldTileset);
		this.worldTileset = null;
		this.worldFrame = null;
	}

	destroy(): void {
		this.isDestroyed = true;
		this.viewObserver.destroy();
		if (!this.viewer.isDestroyed()) this.viewer.destroy();
		this.worldTileset = null;
		this.worldFrame = null;
	}

	private pickPointAtScreenCentre(): Cartesian3 | null {
		const canvas = this.viewer.scene.canvas;
		return this.viewObserver.pickSceneCartesian(
			new Cartesian2(canvas.clientWidth / 2, canvas.clientHeight / 2)
		);
	}

	private measureDistanceToScreenCentre(): number {
		const centre = this.pickPointAtScreenCentre();
		if (!centre) return FALLBACK_ZOOM_DISTANCE_METRES;
		return Cartesian3.distance(this.viewer.camera.position, centre);
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
