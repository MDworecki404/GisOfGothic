import {
	Cartesian2,
	Cartesian3,
	Color,
	ColorGeometryInstanceAttribute,
	GeometryInstance,
	LabelCollection,
	LabelStyle,
	Material,
	PerInstanceColorAppearance,
	PointPrimitiveCollection,
	PolygonGeometry,
	PolygonHierarchy,
	PolylineCollection,
	Primitive,
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
const CELL_OPACITY = 0.62;
const CELL_SHRINK_FACTOR = 0.94;

export interface DensityCellPolygon {
	corners: readonly Cartesian3[];
	cssColor: string;
}

/** Rysuje wynik analiz na mapie: punkt wskazany, połączenia i numerowane wyniki. */
export class AnalysisRenderer {
	private readonly lines = new PolylineCollection();
	private readonly points = new PointPrimitiveCollection();
	private readonly labels = new LabelCollection();

	private densityCells: Primitive | null = null;

	constructor(private readonly viewer: Viewer) {
		viewer.scene.primitives.add(this.lines);
		viewer.scene.primitives.add(this.points);
		viewer.scene.primitives.add(this.labels);
	}

	get primitivesToIgnoreWhenSampling(): object[] {
		return this.densityCells
			? [this.lines, this.points, this.labels, this.densityCells]
			: [this.lines, this.points, this.labels];
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

	/**
	 * Komórki to jeden prymityw (jedno wywołanie rysowania). `depthFailAppearance` rysuje je też tam,
	 * gdzie teren przesłania płaski sześciokąt na zboczu, więc żadna komórka nie ginie pod terenem.
	 */
	showDensityCells(cells: readonly DensityCellPolygon[]): void {
		this.clearDensityCells();
		if (cells.length === 0) return;
		const appearance = new PerInstanceColorAppearance({ translucent: true, closed: false });
		this.densityCells = this.viewer.scene.primitives.add(
			new Primitive({
				geometryInstances: cells.map(
					(cell) =>
						new GeometryInstance({
							geometry: new PolygonGeometry({
								polygonHierarchy: new PolygonHierarchy(this.shrinkTowardsCentre(cell.corners)),
								perPositionHeight: true,
								vertexFormat: PerInstanceColorAppearance.VERTEX_FORMAT
							}),
							attributes: {
								color: ColorGeometryInstanceAttribute.fromColor(
									Color.fromCssColorString(cell.cssColor).withAlpha(CELL_OPACITY)
								),
								depthFailColor: ColorGeometryInstanceAttribute.fromColor(
									Color.fromCssColorString(cell.cssColor).withAlpha(CELL_OPACITY)
								)
							}
						})
				),
				appearance,
				depthFailAppearance: appearance,
				asynchronous: false
			})
		);
	}

	clear(): void {
		this.clearDensityCells();
		this.lines.removeAll();
		this.points.removeAll();
		this.labels.removeAll();
	}

	private clearDensityCells(): void {
		if (!this.densityCells) return;
		this.viewer.scene.primitives.remove(this.densityCells);
		this.densityCells = null;
	}

	private shrinkTowardsCentre(corners: readonly Cartesian3[]): Cartesian3[] {
		const centre = Cartesian3.divideByScalar(
			corners.reduce(
				(sum, corner) => Cartesian3.add(sum, corner, new Cartesian3()),
				new Cartesian3()
			),
			corners.length,
			new Cartesian3()
		);
		return corners.map((corner) =>
			Cartesian3.lerp(centre, corner, CELL_SHRINK_FACTOR, new Cartesian3())
		);
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
