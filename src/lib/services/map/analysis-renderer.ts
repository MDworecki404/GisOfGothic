import {
	Cartesian2,
	Cartesian3,
	Color,
	LabelCollection,
	LabelStyle,
	Material,
	PointPrimitiveCollection,
	PolylineCollection,
	type Viewer
} from 'cesium';

const ORIGIN_COLOR = Color.fromCssColorString('#ffd27a');
const CONNECTION_COLOR = Color.fromCssColorString('#ffd27a').withAlpha(0.7);
const TARGET_COLOR = Color.fromCssColorString('#e0662f');
const OUTLINE_COLOR = Color.fromCssColorString('#14110d');
const LABEL_FONT = '600 15px "Alegreya Sans", sans-serif';
const ORIGIN_PIXEL_SIZE = 12;
const TARGET_PIXEL_SIZE = 14;
const LINE_WIDTH_PIXELS = 2;
const RING_WIDTH_PIXELS = 3;
const LABEL_OFFSET = new Cartesian2(0, -20);

/** Rysuje wynik analiz na mapie: punkt wskazany, połączenia i numerowane wyniki. */
export class AnalysisRenderer {
	private readonly lines = new PolylineCollection();
	private readonly points = new PointPrimitiveCollection();
	private readonly labels = new LabelCollection();

	constructor(viewer: Viewer) {
		viewer.scene.primitives.add(this.lines);
		viewer.scene.primitives.add(this.points);
		viewer.scene.primitives.add(this.labels);
	}

	get primitivesToIgnoreWhenSampling(): object[] {
		return [this.lines, this.points, this.labels];
	}

	showNearestPlaces(origin: Cartesian3, targets: readonly Cartesian3[]): void {
		this.addPoint(origin, ORIGIN_COLOR, ORIGIN_PIXEL_SIZE);
		targets.forEach((target, index) => {
			this.lines.add({
				positions: [origin, target],
				width: LINE_WIDTH_PIXELS,
				material: Material.fromType('Color', { color: CONNECTION_COLOR })
			});
			this.addPoint(target, TARGET_COLOR, TARGET_PIXEL_SIZE);
			this.labels.add({
				position: target,
				text: String(index + 1),
				font: LABEL_FONT,
				fillColor: ORIGIN_COLOR,
				outlineColor: OUTLINE_COLOR,
				outlineWidth: 4,
				style: LabelStyle.FILL_AND_OUTLINE,
				pixelOffset: LABEL_OFFSET,
				disableDepthTestDistance: Number.POSITIVE_INFINITY
			});
		});
	}

	showBuffer(origin: Cartesian3, ring: readonly Cartesian3[]): void {
		this.addPoint(origin, ORIGIN_COLOR, ORIGIN_PIXEL_SIZE);
		this.lines.add({
			positions: [...ring],
			width: RING_WIDTH_PIXELS,
			material: Material.fromType('Color', { color: ORIGIN_COLOR })
		});
	}

	clear(): void {
		this.lines.removeAll();
		this.points.removeAll();
		this.labels.removeAll();
	}

	private addPoint(position: Cartesian3, color: Color, pixelSize: number): void {
		this.points.add({
			position,
			color,
			pixelSize,
			outlineColor: OUTLINE_COLOR,
			outlineWidth: 2,
			disableDepthTestDistance: Number.POSITIVE_INFINITY
		});
	}
}
