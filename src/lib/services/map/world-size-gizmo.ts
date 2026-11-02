import {
	BoundingSphere,
	Cartesian2,
	Cartesian3,
	Color,
	Matrix3,
	Matrix4,
	PointPrimitiveCollection,
	type PointPrimitive,
	type Viewer
} from 'cesium';
import { isRecord } from '#lib/data/parsers.js';

export type GizmoHandle = 'east' | 'north' | 'up' | 'heading';

type GizmoAxis = 'east' | 'north' | 'up';

const HANDLE_ID_PREFIX = 'gizmo-handle:';
const HANDLES: readonly GizmoHandle[] = ['east', 'north', 'up', 'heading'];
const AXES: readonly GizmoAxis[] = ['east', 'north', 'up'];
const HANDLE_COLORS: Readonly<Record<GizmoHandle, Color>> = {
	east: Color.fromCssColorString('#ff4545'),
	north: Color.fromCssColorString('#45ff70'),
	up: Color.fromCssColorString('#4596ff'),
	heading: Color.fromCssColorString('#ffffff')
};
const AXIS_DIRECTIONS: Readonly<Record<GizmoAxis, Cartesian3>> = {
	east: new Cartesian3(1, 0, 0),
	north: new Cartesian3(0, 1, 0),
	up: new Cartesian3(0, 0, 1)
};
const GIZMO_SIZE_PIXELS = 130;
const RING_RADIUS = 0.8;
const RING_DOTS = 72;
const AXIS_DOTS = 18;
const DOT_PIXEL_SIZE = 7;
const TIP_PIXEL_SIZE = 18;
const ACTIVE_TIP_PIXEL_SIZE = 24;
const PICK_TOLERANCE_PIXELS = 14;

function buildHandleId(handle: GizmoHandle): string {
	return `${HANDLE_ID_PREFIX}${handle}`;
}

function readHandle(value: unknown): GizmoHandle | null {
	if (typeof value !== 'string' || !value.startsWith(HANDLE_ID_PREFIX)) return null;
	const name = value.slice(HANDLE_ID_PREFIX.length);
	return HANDLES.find((handle) => handle === name) ?? null;
}

function buildRingDirection(headingDegrees: number): Cartesian3 {
	const radians = (headingDegrees * Math.PI) / 180;
	return new Cartesian3(Math.sin(radians) * RING_RADIUS, Math.cos(radians) * RING_RADIUS, 0);
}

/**
 * Gizmo przesuwania i obrotu jednego świata: trzy osie (wschód, północ, góra) z kulką na końcu i pierścień obrotu
 * z kulką pokazującą kierunek. Wszystko to punkty (linie to gęste kropki), bo punkty mają wyłączony test głębi, więc
 * gizmo widać także wewnątrz modelu świata (środek obrysu zwykle leży pod powierzchnią), a Cesium sam rozpoznaje je
 * myszą. Punkty leżą w jednostkowym rozmiarze, a co klatkę macierz kolekcji skaluje je tak, żeby oś miała stały
 * rozmiar na ekranie.
 */
export class WorldSizeGizmo {
	private readonly points = new PointPrimitiveCollection();
	private readonly tips = new Map<GizmoHandle, PointPrimitive>();
	private origin: Cartesian3 | null = null;
	private rotation: Matrix3 = Matrix3.IDENTITY;
	private readonly removePreRenderListener: () => void;

	constructor(private readonly viewer: Viewer) {
		this.points.show = false;
		this.addDots();
		this.addTips();
		viewer.scene.primitives.add(this.points);
		this.removePreRenderListener = viewer.scene.preRender.addEventListener(() => this.rescale());
	}

	get isVisible(): boolean {
		return this.origin !== null;
	}

	/** Ustawia gizmo w środku świata: `rotation` to osie wschód–północ–góra, `headingDegrees` obrót znacznika na pierścieniu. */
	show(origin: Cartesian3, rotation: Matrix3, headingDegrees: number): void {
		this.origin = Cartesian3.clone(origin);
		this.rotation = Matrix3.clone(rotation);
		const headingTip = this.tips.get('heading');
		if (headingTip) headingTip.position = buildRingDirection(headingDegrees);
		this.points.show = true;
		this.rescale();
	}

	hide(): void {
		this.origin = null;
		this.points.show = false;
		this.highlightHandle(null);
	}

	/** Powiększa kulkę uchwytu, który użytkownik właśnie przeciąga. */
	highlightHandle(handle: GizmoHandle | null): void {
		for (const [name, tip] of this.tips) {
			tip.pixelSize = name === handle ? ACTIVE_TIP_PIXEL_SIZE : TIP_PIXEL_SIZE;
		}
	}

	pickHandle(position: Cartesian2): GizmoHandle | null {
		if (!this.isVisible) return null;
		const picked: unknown = this.viewer.scene.pick(
			position,
			PICK_TOLERANCE_PIXELS,
			PICK_TOLERANCE_PIXELS
		);
		return isRecord(picked) ? readHandle(picked.id) : null;
	}

	destroy(): void {
		this.removePreRenderListener();
		this.viewer.scene.primitives.remove(this.points);
	}

	private addDots(): void {
		for (const axis of AXES) {
			for (let step = 1; step < AXIS_DOTS; step++) {
				const position = Cartesian3.multiplyByScalar(
					AXIS_DIRECTIONS[axis],
					step / AXIS_DOTS,
					new Cartesian3()
				);
				this.addPoint(axis, position, DOT_PIXEL_SIZE);
			}
		}
		for (let step = 0; step < RING_DOTS; step++) {
			this.addPoint('heading', buildRingDirection((step / RING_DOTS) * 360), DOT_PIXEL_SIZE);
		}
	}

	private addTips(): void {
		for (const axis of AXES) {
			this.tips.set(axis, this.addPoint(axis, AXIS_DIRECTIONS[axis], TIP_PIXEL_SIZE));
		}
		this.tips.set('heading', this.addPoint('heading', buildRingDirection(0), TIP_PIXEL_SIZE));
	}

	private addPoint(handle: GizmoHandle, position: Cartesian3, pixelSize: number): PointPrimitive {
		return this.points.add({
			id: buildHandleId(handle),
			position,
			color: HANDLE_COLORS[handle],
			outlineColor: Color.BLACK,
			outlineWidth: 1,
			pixelSize,
			disableDepthTestDistance: Number.POSITIVE_INFINITY
		});
	}

	/** Skala: tyle metrów, żeby oś miała ok. `GIZMO_SIZE_PIXELS` pikseli niezależnie od odległości kamery. */
	private rescale(): void {
		const origin = this.origin;
		if (!origin) return;
		const canvas = this.viewer.scene.canvas;
		const metresPerPixel = this.viewer.camera.getPixelSize(
			new BoundingSphere(origin, 1),
			canvas.clientWidth,
			canvas.clientHeight
		);
		const scale = Math.max(metresPerPixel * GIZMO_SIZE_PIXELS, 0.001);
		this.points.modelMatrix = Matrix4.fromRotationTranslation(
			Matrix3.multiplyByScalar(this.rotation, scale, new Matrix3()),
			origin
		);
	}
}
