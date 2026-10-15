import {
	BoundingSphere,
	Cartesian3,
	Color,
	Math as CesiumMath,
	PointPrimitiveCollection,
	type Viewer
} from 'cesium';
import type { CameraFramer } from './camera-framer.js';

export interface PlaceMarker {
	lon: number;
	lat: number;
	h: number;
	color: string;
}

const MARKER_PIXEL_SIZE = 11;
const HIGHLIGHT_PIXEL_SIZE = 18;
const MARKER_OUTLINE_COLOR = Color.fromCssColorString('#14110d');
const HIGHLIGHT_COLOR = Color.fromCssColorString('#ffd27a');
const OVERVIEW_PITCH_DEGREES = -55;
const MINIMUM_OVERVIEW_RANGE_METRES = 120;
const PLACE_CLOSE_UP_RANGE_METRES = 45;

/**
 * Znaczniki miejsc wybranego wpisu. Wszystkie punkty to jedna kolekcja prymitywów (jedno
 * wywołanie rysowania), widoczna także przez dachy — miejsca bywają wewnątrz budynków.
 */
export class PlaceMarkersLayer {
	private readonly points = new PointPrimitiveCollection();
	private positions: Cartesian3[] = [];

	constructor(
		private readonly viewer: Viewer,
		private readonly cameraFramer: CameraFramer
	) {
		viewer.scene.primitives.add(this.points);
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
		});
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
	}
}
