import { MAP_PALETTE } from '#lib/services/map/map-palette.js';
import type { PlaceExtent } from '#lib/data/types.js';
import type { GeodeticPoint } from '#lib/services/analysis/local-projector.js';
import {
	BoundingSphere,
	Cartesian3,
	Color,
	Math as CesiumMath,
	Material,
	Matrix4,
	PointPrimitiveCollection,
	PolylineCollection,
	Transforms,
	type Viewer
} from 'cesium';
import type { CameraFramer } from './camera-framer.js';

export interface PlaceMarker {
	lon: number;
	lat: number;
	h: number;
	color: string;
	/** Zasięg rysowany jako obrys wokół znacznika (lokacje). */
	extent?: PlaceExtent;
}

/** Odcinek trasy między miejscami; przerywany oznacza jedną z możliwych dróg. */
export interface PlaceRoute {
	points: readonly GeodeticPoint[];
	isAlternative: boolean;
}

const MARKER_PIXEL_SIZE = 11;
const HIGHLIGHT_PIXEL_SIZE = 18;
const MARKER_OUTLINE_COLOR = Color.fromCssColorString(MAP_PALETTE.edge);
const HIGHLIGHT_COLOR = Color.fromCssColorString(MAP_PALETTE.emberLight);
const OVERVIEW_PITCH_DEGREES = -55;
const MINIMUM_OVERVIEW_RANGE_METRES = 120;
const PLACE_CLOSE_UP_RANGE_METRES = 45;
const EXTENT_CIRCLE_SEGMENTS = 64;
const EXTENT_LINE_WIDTH = 3;

/**
 * Znaczniki miejsc wybranego wpisu. Wszystkie punkty to jedna kolekcja prymitywów (jedno
 * wywołanie rysowania), widoczna także przez dachy — miejsca bywają wewnątrz budynków.
 */
export class PlaceMarkersLayer {
	private readonly points = new PointPrimitiveCollection();
	private positions: Cartesian3[] = [];
	private readonly outlines = new PolylineCollection();
	private readonly routeLines = new PolylineCollection();

	constructor(
		private readonly viewer: Viewer,
		private readonly cameraFramer: CameraFramer
	) {
		viewer.scene.primitives.add(this.points);
		viewer.scene.primitives.add(this.outlines);
		viewer.scene.primitives.add(this.routeLines);
	}

	showMarkers(markers: readonly PlaceMarker[]): void {
		this.clearMarkers();
		this.positions = markers.map((marker) =>
			Cartesian3.fromDegrees(marker.lon, marker.lat, marker.h)
		);
		markers.forEach((marker, index) => {
			this.points.add({
				position: this.positions[index],
				color: Color.fromCssColorString(marker.color),
				pixelSize: MARKER_PIXEL_SIZE,
				outlineColor: MARKER_OUTLINE_COLOR,
				outlineWidth: 2,
				disableDepthTestDistance: Number.POSITIVE_INFINITY
			});
			if (marker.extent) this.addExtentOutline(marker, marker.extent);
		});
	}

	/** Rysuje trasy (przewodnik po queście) w miejsce poprzednich; znaczniki zostają bez zmian. */
	showRoutes(routes: readonly PlaceRoute[]): void {
		this.routeLines.removeAll();
		const color = Color.fromCssColorString(MAP_PALETTE.emberLight);
		for (const route of routes) {
			if (route.points.length < 2) continue;
			this.routeLines.add({
				positions: route.points.map((point) =>
					Cartesian3.fromDegrees(point.lon, point.lat, point.h)
				),
				width: EXTENT_LINE_WIDTH,
				material: route.isAlternative
					? Material.fromType('PolylineDash', { color, dashLength: 16 })
					: Material.fromType('Color', { color })
			});
		}
	}

	highlightMarker(index: number): void {
		for (let pointIndex = 0; pointIndex < this.points.length; pointIndex++) {
			const point = this.points.get(pointIndex);
			const isHighlighted = pointIndex === index;
			point.pixelSize = isHighlighted ? HIGHLIGHT_PIXEL_SIZE : MARKER_PIXEL_SIZE;
			point.outlineColor = isHighlighted ? HIGHLIGHT_COLOR : MARKER_OUTLINE_COLOR;
		}
	}

	flyToAllMarkers(): void {
		if (this.positions.length === 0) return;
		const sphere = BoundingSphere.fromPoints(this.positions);
		this.cameraFramer.flyToPoint(sphere.center, {
			headingRadians: this.viewer.camera.heading,
			pitchRadians: CesiumMath.toRadians(OVERVIEW_PITCH_DEGREES),
			rangeMetres: this.cameraFramer.scaleRangeToFreeArea(
				Math.max(sphere.radius * 2.6, MINIMUM_OVERVIEW_RANGE_METRES)
			),
			flightSeconds: 1.2
		});
	}

	flyToMarker(index: number): void {
		const position = this.positions.at(index);
		if (!position) return;
		this.highlightMarker(index);
		this.cameraFramer.flyToPoint(position, {
			headingRadians: this.viewer.camera.heading,
			pitchRadians: CesiumMath.toRadians(OVERVIEW_PITCH_DEGREES),
			rangeMetres: PLACE_CLOSE_UP_RANGE_METRES,
			flightSeconds: 1
		});
	}

	clearMarkers(): void {
		this.points.removeAll();
		this.positions = [];
		this.outlines.removeAll();
		this.routeLines.removeAll();
	}

	private addExtentOutline(marker: PlaceMarker, extent: PlaceExtent): void {
		const ring = this.buildExtentRing(marker, extent);
		if (ring.length < 3) return;
		this.outlines.add({
			positions: ring,
			width: EXTENT_LINE_WIDTH,
			material: Material.fromType('Color', { color: Color.fromCssColorString(marker.color) })
		});
	}

	/** Zamknięty pierścień punktów: obrys z danych, a bez niego okrąg o promieniu lokacji w płaszczyźnie poziomej. */
	private buildExtentRing(marker: PlaceMarker, extent: PlaceExtent): Cartesian3[] {
		if (extent.polygon) {
			return extent.polygon.map(([lon, lat]) => Cartesian3.fromDegrees(lon, lat, marker.h));
		}
		if (extent.radiusMetres === null) return [];
		const localToWorld = Transforms.eastNorthUpToFixedFrame(
			Cartesian3.fromDegrees(marker.lon, marker.lat, marker.h)
		);
		const radius = extent.radiusMetres;
		return Array.from({ length: EXTENT_CIRCLE_SEGMENTS + 1 }, (_, segment) => {
			const angle = (segment / EXTENT_CIRCLE_SEGMENTS) * 2 * Math.PI;
			return Matrix4.multiplyByPoint(
				localToWorld,
				new Cartesian3(radius * Math.cos(angle), radius * Math.sin(angle), 0),
				new Cartesian3()
			);
		});
	}
}
