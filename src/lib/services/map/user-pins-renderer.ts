import {
	Cartesian2,
	Cartesian3,
	Color,
	LabelCollection,
	LabelStyle,
	Math as CesiumMath,
	PointPrimitiveCollection,
	VerticalOrigin,
	type Viewer
} from 'cesium';
import type { CameraFramer } from './camera-framer.js';

export interface UserPinPlacement {
	position: Cartesian3;
	label: string;
}

const PIN_COLOR = Color.fromCssColorString('#7cc4e0');
const PIN_OUTLINE_COLOR = Color.fromCssColorString('#14110d');
const LABEL_COLOR = Color.fromCssColorString('#f3ead6');
const PIN_PIXEL_SIZE = 13;
const LABEL_FONT = '600 14px sans-serif';
const LABEL_OFFSET = new Cartesian2(0, -16);
const PIN_CLOSE_UP_RANGE_METRES = 45;
const PIN_PITCH_DEGREES = -55;

/** Pinezki gracza: kropka z podpisem, widoczna także przez dachy i zbocza. */
export class UserPinsRenderer {
	private readonly points = new PointPrimitiveCollection();
	private readonly labels = new LabelCollection();
	private positions: Cartesian3[] = [];

	constructor(
		private readonly viewer: Viewer,
		private readonly cameraFramer: CameraFramer
	) {
		viewer.scene.primitives.add(this.points);
		viewer.scene.primitives.add(this.labels);
	}

	showPins(pins: readonly UserPinPlacement[]): void {
		this.points.removeAll();
		this.labels.removeAll();
		this.positions = pins.map((pin) => pin.position);
		for (const pin of pins) {
			this.points.add({
				position: pin.position,
				color: PIN_COLOR,
				pixelSize: PIN_PIXEL_SIZE,
				outlineColor: PIN_OUTLINE_COLOR,
				outlineWidth: 2,
				disableDepthTestDistance: Number.POSITIVE_INFINITY
			});
			this.labels.add({
				position: pin.position,
				text: pin.label,
				font: LABEL_FONT,
				style: LabelStyle.FILL_AND_OUTLINE,
				fillColor: LABEL_COLOR,
				outlineColor: PIN_OUTLINE_COLOR,
				outlineWidth: 3,
				verticalOrigin: VerticalOrigin.BOTTOM,
				pixelOffset: LABEL_OFFSET,
				disableDepthTestDistance: Number.POSITIVE_INFINITY
			});
		}
	}

	flyToPin(index: number): void {
		const position = this.positions.at(index);
		if (!position) return;
		this.cameraFramer.flyToPoint(position, {
			headingRadians: this.viewer.camera.heading,
			pitchRadians: CesiumMath.toRadians(PIN_PITCH_DEGREES),
			rangeMetres: PIN_CLOSE_UP_RANGE_METRES,
			flightSeconds: 1
		});
	}
}
