import {
	BoundingSphere,
	Cartesian2,
	Cartesian3,
	Cesium3DTileset,
	Color,
	DirectionalLight,
	HeadingPitchRange,
	Math as CesiumMath,
	Matrix4,
	Viewer
} from 'cesium';
import type { Anchor } from '#lib/data/types.js';
import { WorldFrame } from '#lib/services/geodesy/world-frame.js';
import type { CameraView } from '#lib/services/bookmarks/camera-view-codec.js';
import type { ViewshedCell } from '#lib/services/analysis/viewshed-calculator.js';
import type { DensityCell } from '#lib/services/analysis/density-grid-builder.js';
import type { LocalPoint } from '#lib/services/measurement/measurement-calculator.js';
import type { ShadowSettings } from '#lib/services/time/time-coordinator.js';
import { AnalysisRenderer } from './analysis-renderer.js';
import { CameraFramer } from './camera-framer.js';
import type { MapViewInsets } from './free-area-calculator.js';
import { DataLayersRenderer, type DataLayerPoint } from './data-layers-renderer.js';
import { MapViewObserver, type MapViewListeners } from './map-view-observer.js';
import { MeasurementRenderer } from './measurement-renderer.js';
import { PlaceMarkersLayer, type PlaceMarker } from './place-markers-layer.js';
import { ViewerOptionsBuilder } from './viewer-options-builder.js';

const BACKGROUND_COLOR = '#14110d';
const LIGHT_DIRECTION_FROM_ABOVE = new Cartesian3(-1, 0.35, -0.25);
const OVERVIEW_PITCH_DEGREES = -50;
const CLOSE_UP_PITCH_DEGREES = -55;
const OVERVIEW_RANGE_IN_WORLD_RADII = 2.2;
const ZOOM_STEP_FRACTION = 0.35;
const FALLBACK_ZOOM_DISTANCE_METRES = 400;
const NORTH_RESET_DURATION_SECONDS = 0.6;
const MEASUREMENT_LINE_LIFT_METRES = 0.4;
const DENSITY_CELL_LIFT_METRES = 0.6;
const VISIBLE_TERRAIN_COLOR = '#6fae5a';
const HIDDEN_TERRAIN_COLOR = '#8b3a2b';
const DAY_LIGHT_COLOR = new Color(1, 0.96, 0.88);
const NIGHT_LIGHT_COLOR = new Color(0.62, 0.7, 1);
const MINIMUM_SUN_ELEVATION = 0.25;
const SHADOW_DARKNESS = 0.45;
const SHARP_SHADOW_MAP_SIZE = 2048;
const SOFT_SHADOW_MAP_SIZE = 4096;

/**
 * Serwis mapy 3D. Obiekty Cesium trzyma w zwykłych polach — nigdy w `$state`,
 * bo proxy Svelte psuje Cesium.
 */
export class MapService {
	private readonly viewer: Viewer;
	private readonly viewObserver: MapViewObserver;
	private readonly placeMarkers: PlaceMarkersLayer;
	private readonly dataLayers: DataLayersRenderer;
	private readonly measurement: MeasurementRenderer;
	private readonly analysis: AnalysisRenderer;
	private readonly cameraFramer: CameraFramer;
	private worldTileset: Cesium3DTileset | null = null;
	private staticObjectsTileset: Cesium3DTileset | null = null;
	private latestStaticObjectsRequest = 0;
	private worldFrame: WorldFrame | null = null;
	private isDestroyed = false;
	private latestTilesetRequest = 0;
	private minuteOfDay: number | null = null;

	constructor(container: HTMLElement, listeners: MapViewListeners) {
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
		this.measurement = new MeasurementRenderer(this.viewer);
		this.analysis = new AnalysisRenderer(this.viewer);
		this.cameraFramer = new CameraFramer(this.viewer);
		this.placeMarkers = new PlaceMarkersLayer(this.viewer, this.cameraFramer);
	}

	/**
	 * Tileset z ion (podawany przez bramkę zasobów) nie jest georeferencjonowany: ion zamienia
	 * osie glTF (Wschód, Góra, -Północ) na lokalne (Wschód, Północ, Góra) wokół środka Ziemi. Macierz ENU kotwicy stawia go
	 * w punkcie kotwicy z poprawnymi kierunkami świata. Tileset z wcześniejszego, wyprzedzonego
	 * wywołania jest niszczony zamiast pokazany.
	 */
	async showWorldTileset(tilesetUrl: string, anchor: Anchor): Promise<void> {
		const request = ++this.latestTilesetRequest;
		this.removeWorldTileset();
		const frame = new WorldFrame(anchor);
		const tileset = await Cesium3DTileset.fromUrl(tilesetUrl, {
			modelMatrix: frame.anchorToEcef
		});
		if (this.isDestroyed || request !== this.latestTilesetRequest) {
			tileset.destroy();
			return;
		}
		this.worldTileset = tileset;
		this.worldFrame = frame;
		this.viewer.scene.primitives.add(tileset);
		if (this.minuteOfDay !== null) this.showTimeOfDay(this.minuteOfDay);
		this.showWholeWorld(0);
	}

	/** Zapamiętuje, które brzegi mapy zasłaniają panele; kolejne przeloty kadrują cel w wolnym obszarze. */
	setViewInsets(insets: MapViewInsets): void {
		this.cameraFramer.setInsets(insets);
	}

	/** Pozycja i kierunek kamery w ramie świata; `null`, zanim model świata się wczyta. */
	readCameraView(): CameraView | null {
		const frame = this.worldFrame;
		if (!frame) return null;
		const camera = this.viewer.camera;
		const position = frame.toWorldPosition(camera.positionWC);
		return {
			east: position.east,
			north: position.north,
			height: position.height,
			headingDegrees: CesiumMath.toDegrees(camera.heading),
			pitchDegrees: CesiumMath.toDegrees(camera.pitch)
		};
	}

	/** Ustawia kamerę w zapisanym widoku; czas 0 oznacza przeskok bez animacji. */
	moveCameraToView(view: CameraView, flightDurationSeconds: number): void {
		const frame = this.worldFrame;
		if (!frame) return;
		const destination = frame.toSceneCartesian(view.east, view.north, view.height);
		const orientation = {
			heading: CesiumMath.toRadians(view.headingDegrees),
			pitch: CesiumMath.toRadians(view.pitchDegrees),
			roll: 0
		};
		if (flightDurationSeconds <= 0) {
			this.viewer.camera.setView({ destination, orientation });
			return;
		}
		this.viewer.camera.flyTo({ destination, orientation, duration: flightDurationSeconds });
	}

	showWholeWorld(flightDurationSeconds = 1.5): void {
		if (!this.worldTileset) return;
		const sphere = this.worldTileset.boundingSphere;
		this.cameraFramer.flyToPoint(sphere.center, {
			headingRadians: 0,
			pitchRadians: CesiumMath.toRadians(OVERVIEW_PITCH_DEGREES),
			rangeMetres: this.cameraFramer.scaleRangeToFreeArea(
				sphere.radius * OVERVIEW_RANGE_IN_WORLD_RADII
			),
			flightSeconds: flightDurationSeconds
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

	/**
	 * Słońce wschodzi o 6:00 na wschodzie, w południe świeci z południa z góry, zachodzi o 18:00
	 * na zachodzie. Nocą świeci słabsze, chłodne światło „księżyca” z przeciwnej strony nieba.
	 * Kierunek liczony jest w ramie świata (Wschód, Północ, Góra) i przenoszony do sceny.
	 */
	showTimeOfDay(minuteOfDay: number): void {
		this.minuteOfDay = minuteOfDay;
		const frame = this.worldFrame;
		if (!frame) return;
		const sunAngle = ((minuteOfDay - 6 * 60) / (12 * 60)) * Math.PI;
		const sunElevation = Math.sin(sunAngle);
		const isDay = sunElevation > 0;
		const sign = isDay ? 1 : -1;
		const towardsLightSource = new Cartesian3(
			sign * Math.cos(sunAngle),
			-0.45,
			Math.max(Math.abs(sunElevation), MINIMUM_SUN_ELEVATION)
		);
		const sceneDirection = Matrix4.multiplyByPointAsVector(
			frame.anchorToEcef,
			Cartesian3.negate(towardsLightSource, new Cartesian3()),
			new Cartesian3()
		);
		this.viewer.scene.light = new DirectionalLight({
			direction: Cartesian3.normalize(sceneDirection, new Cartesian3()),
			color: isDay ? DAY_LIGHT_COLOR : NIGHT_LIGHT_COLOR,
			intensity: isDay ? 0.55 + 0.6 * sunElevation : 0.4
		});
	}

	/** Cienie rzuca światło sceny, więc podążają za porą dnia. Gładkie cienie kosztują więcej GPU. */
	showShadows({ areEnabled, areSoft }: ShadowSettings): void {
		this.viewer.shadows = areEnabled;
		const shadowMap = this.viewer.scene.shadowMap;
		shadowMap.softShadows = areSoft;
		shadowMap.size = areSoft ? SOFT_SHADOW_MAP_SIZE : SHARP_SHADOW_MAP_SIZE;
		shadowMap.darkness = SHADOW_DARKNESS;
	}

	showMeasurement(vertices: readonly LocalPoint[], linePath: readonly LocalPoint[]): void {
		const frame = this.worldFrame;
		if (!frame) return;
		this.measurement.showMeasurement(
			vertices.map((vertex) => frame.toSceneCartesian(vertex.east, vertex.north, vertex.height)),
			linePath.map((point) =>
				frame.toSceneCartesian(point.east, point.north, point.height + MEASUREMENT_LINE_LIFT_METRES)
			)
		);
	}

	clearMeasurement(): void {
		this.measurement.clearMeasurement();
	}

	showNearestPlaces(origin: LocalPoint, targets: readonly LocalPoint[]): void {
		const frame = this.worldFrame;
		if (!frame) return;
		const toScene = (point: LocalPoint): Cartesian3 =>
			frame.toSceneCartesian(point.east, point.north, point.height);
		this.analysis.showNearestPlaces(toScene(origin), targets.map(toScene));
	}

	showBuffer(origin: LocalPoint, ring: readonly LocalPoint[]): void {
		const frame = this.worldFrame;
		if (!frame) return;
		const toScene = (point: LocalPoint): Cartesian3 =>
			frame.toSceneCartesian(point.east, point.north, point.height);
		this.analysis.showBuffer(toScene(origin), ring.map(toScene));
	}

	showDensityCells(cells: readonly DensityCell[]): void {
		const frame = this.worldFrame;
		if (!frame) return;
		this.analysis.showDensityCells(
			cells.map((cell) => ({
				cssColor: cell.color,
				corners: cell.vertices.map((vertex) =>
					frame.toSceneCartesian(
						vertex.east,
						vertex.north,
						cell.meanHeight + DENSITY_CELL_LIFT_METRES
					)
				)
			}))
		);
	}

	showViewshed(origin: LocalPoint, cells: readonly ViewshedCell[]): void {
		const frame = this.worldFrame;
		if (!frame) return;
		this.analysis.showViewshed(
			frame.toSceneCartesian(origin.east, origin.north, origin.height),
			cells.map((cell) => ({
				cssColor: cell.isVisible ? VISIBLE_TERRAIN_COLOR : HIDDEN_TERRAIN_COLOR,
				corners: cell.corners.map((corner) =>
					frame.toSceneCartesian(
						corner.east,
						corner.north,
						cell.heightMetres + DENSITY_CELL_LIFT_METRES
					)
				)
			}))
		);
	}

	clearAnalysis(): void {
		this.analysis.clear();
	}

	flyToLocalPoint(point: LocalPoint, rangeMetres: number): void {
		const frame = this.worldFrame;
		if (!frame) return;
		this.cameraFramer.flyToPoint(frame.toSceneCartesian(point.east, point.north, point.height), {
			headingRadians: this.viewer.camera.heading,
			pitchRadians: CesiumMath.toRadians(CLOSE_UP_PITCH_DEGREES),
			rangeMetres,
			flightSeconds: 1
		});
	}

	/**
	 * Odczytuje wysokość modelu świata pod podanymi punktami (rzut wzdłuż pionu). Punkty, pod
	 * którymi nie ma terenu albo kafle nie są jeszcze wczytane, są pomijane.
	 */
	async sampleTerrainUnder(points: readonly LocalPoint[]): Promise<LocalPoint[]> {
		const samples = await this.sampleTerrainUnderKeepingOrder(points);
		return samples.flatMap((sample) => (sample ? [sample] : []));
	}

	/** Jak `sampleTerrainUnder`, ale wynik ma tyle elementów co wejście; brak odczytu to `null`. */
	async sampleTerrainUnderKeepingOrder(
		points: readonly LocalPoint[]
	): Promise<(LocalPoint | null)[]> {
		const frame = this.worldFrame;
		const scene = this.viewer.scene;
		if (!frame || !scene.sampleHeightSupported) return [];
		const probes = points.map((point) =>
			frame.toSceneCartesian(point.east, point.north, point.height)
		);
		const clamped: (Cartesian3 | undefined)[] = await scene.clampToHeightMostDetailed(probes, [
			...this.measurement.primitivesToIgnoreWhenSampling,
			...this.analysis.primitivesToIgnoreWhenSampling
		]);
		if (this.isDestroyed) return [];
		return clamped.map((position) => (position ? frame.toWorldPosition(position) : null));
	}

	/**
	 * Statyczne obiekty świata (voby) to osobny tileset w tym samym układzie co model świata,
	 * więc używa tej samej macierzy kotwicy. Wymaga wczytanego świata.
	 */
	async showStaticObjectsTileset(tilesetUrl: string): Promise<void> {
		const frame = this.worldFrame;
		if (!frame) throw new Error('Obiekty świata można pokazać dopiero po wczytaniu świata');
		this.hideStaticObjectsTileset();
		const request = this.latestStaticObjectsRequest;
		const tileset = await Cesium3DTileset.fromUrl(tilesetUrl, { modelMatrix: frame.anchorToEcef });
		if (this.isDestroyed || request !== this.latestStaticObjectsRequest) {
			tileset.destroy();
			return;
		}
		this.staticObjectsTileset = tileset;
		this.viewer.scene.primitives.add(tileset);
	}

	hideStaticObjectsTileset(): void {
		this.latestStaticObjectsRequest++;
		if (!this.staticObjectsTileset) return;
		this.viewer.scene.primitives.remove(this.staticObjectsTileset);
		this.staticObjectsTileset = null;
	}

	removeWorldTileset(): void {
		this.hideStaticObjectsTileset();
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
