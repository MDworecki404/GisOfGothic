import {
	Cartesian3,
	Color,
	Material,
	PointPrimitiveCollection,
	PolylineCollection,
	type Viewer
} from 'cesium';

const LINE_COLOR = Color.fromCssColorString('#ecd08a');
const VERTEX_OUTLINE_COLOR = Color.fromCssColorString('#14110d');
const LINE_WIDTH_PIXELS = 3;
const VERTEX_PIXEL_SIZE = 9;

/** Rysuje pomiar: wierzchołki zawsze widoczne, linię po terenie (albo prostą, zanim profil się policzy). */
export class MeasurementRenderer {
	private readonly lines = new PolylineCollection();
	private readonly vertices = new PointPrimitiveCollection();

	constructor(viewer: Viewer) {
		viewer.scene.primitives.add(this.lines);
		viewer.scene.primitives.add(this.vertices);
	}

	get primitivesToIgnoreWhenSampling(): object[] {
		return [this.lines, this.vertices];
	}

	showMeasurement(vertices: readonly Cartesian3[], linePath: readonly Cartesian3[]): void {
		this.clearMeasurement();
		for (const position of vertices) {
			this.vertices.add({
				position,
				color: LINE_COLOR,
				pixelSize: VERTEX_PIXEL_SIZE,
				outlineColor: VERTEX_OUTLINE_COLOR,
				outlineWidth: 2,
				disableDepthTestDistance: Number.POSITIVE_INFINITY
			});
		}
		if (linePath.length >= 2) {
			this.lines.add({
				positions: [...linePath],
				width: LINE_WIDTH_PIXELS,
				material: Material.fromType('Color', { color: LINE_COLOR })
			});
		}
	}

	clearMeasurement(): void {
		this.lines.removeAll();
		this.vertices.removeAll();
	}
}
