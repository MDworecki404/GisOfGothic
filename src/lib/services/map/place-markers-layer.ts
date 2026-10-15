import {
	BoundingSphere,
	Cartesian3,
	Color,
	HeadingPitchRange,
	Math as CesiumMath,
	PointPrimitiveCollection,
	type Viewer
} from 'cesium';

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

	constructor(private readonly viewer: Viewer) {
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
		this.viewer.camera.flyToBoundingSphere(sphere, {
			duration: 1.2,
			offset: new HeadingPitchRange(
				this.viewer.camera.heading,
				CesiumMath.toRadians(OVERVIEW_PITCH_DEGREES),
				Math.max(sphere.radius * 2.6, MINIMUM_OVERVIEW_RANGE_METRES)
			)
		});
	}

	flyToMarker(index: number): void {
		const position = this.positions.at(index);
		if (!position) return;
		this.highlightMarker(index);
		this.viewer.camera.flyToBoundingSphere(new BoundingSphere(position, 0), {
			duration: 1,
			offset: new HeadingPitchRange(
				this.viewer.camera.heading,
				CesiumMath.toRadians(OVERVIEW_PITCH_DEGREES),
				PLACE_CLOSE_UP_RANGE_METRES
			)
		});
	}

	clearMarkers(): void {
		this.points.removeAll();
		this.positions = [];
	}
}
