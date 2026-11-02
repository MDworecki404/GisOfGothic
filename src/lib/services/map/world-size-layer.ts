import {
	Cartesian2,
	Cartesian3,
	Cesium3DTileset,
	Ellipsoid,
	IntersectionTests,
	Matrix3,
	Matrix4,
	Plane,
	type CustomShader,
	type Viewer
} from 'cesium';
import { isRecord } from '#lib/data/parsers.js';
import type { Anchor } from '#lib/data/types.js';
import { WorldFrame } from '#lib/services/geodesy/world-frame.js';
import {
	findClosestParameterOnLine,
	measureClockwiseAngleDegrees,
	wrapToShortestTurnDegrees
} from './gizmo-math.js';
import { GhostWorldShaderBuilder } from './ghost-world-shader-builder.js';
import { REFERENCE_WORLD_KEY } from './size-world-keys.js';
import { WorldExtentReader, type WorldExtent } from './world-extent-reader.js';
import { WorldPlacementCalculator, type SizeWorldPlacement } from './world-placement-calculator.js';
import { WorldSizeGizmo, type GizmoHandle } from './world-size-gizmo.js';

export interface SizeWorldListener {
	onHovered(key: string | null): void;
	/** Użytkownik kliknął świat na mapie (przeciągnięcie świata albo uchwytu gizma też go wybiera). */
	onSelected(key: string): void;
	/** Przeciągnięcie świata albo uchwytu gizma: nowa pełna pozycja świata. */
	onPlaced(key: string, placement: SizeWorldPlacement): void;
}

interface SizeWorldEntry {
	tileset: Cesium3DTileset;
	shader: CustomShader;
	frame: WorldFrame;
	extent: WorldExtent;
	placement: SizeWorldPlacement;
}

interface ReferenceEntry {
	tileset: Cesium3DTileset;
	shader: CustomShader;
}

interface PlaneDrag {
	kind: 'plane';
	key: string;
	startEast: number;
	startNorth: number;
	startPlacement: SizeWorldPlacement;
	plane: Plane;
}

interface AxisDrag {
	kind: 'axis';
	key: string;
	handle: 'east' | 'north' | 'up';
	startParameter: number;
	startPlacement: SizeWorldPlacement;
	axisOrigin: Cartesian3;
	axisDirection: Cartesian3;
}

interface HeadingDrag {
	kind: 'heading';
	key: string;
	startAngle: number;
	startPlacement: SizeWorldPlacement;
	plane: Plane;
}

type Drag = PlaneDrag | AxisDrag | HeadingDrag;

const BASE_ALPHA = 0.5;
const HIGHLIGHT_ALPHA = 0.92;
const MAXIMUM_PICKED_OBJECTS = 8;

/**
 * Światy porównania rozmiarów: każdy to osobny, półprzezroczysty tileset w własnej pozycji (przesunięcie i obrót
 * wokół środka obrysu), a otwarty świat (odniesienie) też jest widmem, tylko nieruchomym. Najechanie lub przeciągnięcie
 * wskazuje świat przez `drillPick`, bo światy leżą jeden na drugim. Wybrany świat ma gizmo (osie i pierścień obrotu).
 * Przeciąganie przechwytuje zdarzenia wskaźnika, zanim zobaczy je kamera.
 */
export class WorldSizeLayer {
	private readonly worlds = new Map<string, SizeWorldEntry>();
	private reference: ReferenceEntry[] = [];
	private readonly shaderBuilder = new GhostWorldShaderBuilder();
	private readonly extentReader = new WorldExtentReader();
	private readonly placementCalculator = new WorldPlacementCalculator();
	private readonly gizmo: WorldSizeGizmo;
	private readonly requests = new Map<string, number>();
	private requestCounter = 0;
	private listener: SizeWorldListener | null = null;
	private isListeningToInput = false;
	private pendingHoverPosition: Cartesian2 | null = null;
	private hoveredKey: string | null = null;
	private highlightedKey: string | null = null;
	private selectedKey: string | null = null;
	private drag: Drag | null = null;
	private readonly removePostRenderListener: () => void;

	constructor(private readonly viewer: Viewer) {
		this.gizmo = new WorldSizeGizmo(viewer);
		this.removePostRenderListener = viewer.scene.postRender.addEventListener(() =>
			this.resolveHover()
		);
	}

	listen(listener: SizeWorldListener | null): void {
		this.listener = listener;
	}

	/** Dodaje świat w pozycji natywnej i zwraca jego obrys; `null`, gdy w międzyczasie został usunięty. */
	async addWorld(
		key: string,
		tilesetUrl: string,
		anchor: Anchor,
		tintCssColor: string
	): Promise<WorldExtent | null> {
		const request = ++this.requestCounter;
		this.requests.set(key, request);
		this.removeWorld(key, false);
		const frame = new WorldFrame(anchor);
		const tileset = await Cesium3DTileset.fromUrl(tilesetUrl, { modelMatrix: frame.anchorToEcef });
		if (this.requests.get(key) !== request) {
			tileset.destroy();
			return null;
		}
		const shader = this.shaderBuilder.createShader(tintCssColor, BASE_ALPHA);
		tileset.customShader = shader;
		const extent = this.extentReader.readExtent(tileset, frame);
		this.viewer.scene.primitives.add(tileset);
		this.worlds.set(key, {
			tileset,
			shader,
			frame,
			extent,
			placement: { east: 0, north: 0, up: 0, headingDegrees: 0 }
		});
		this.startListeningToInput();
		this.refreshGizmo();
		return extent;
	}

	removeWorld(key: string, shouldInvalidateRequest = true): void {
		if (shouldInvalidateRequest) this.requests.delete(key);
		const entry = this.worlds.get(key);
		if (!entry) return;
		this.viewer.scene.primitives.remove(entry.tileset);
		this.worlds.delete(key);
		if (this.hoveredKey === key) this.hoveredKey = null;
		if (this.drag?.key === key) this.finishDrag();
		if (this.selectedKey === key) this.selectedKey = null;
		this.refreshGizmo();
		if (this.worlds.size === 0 && this.reference.length === 0) this.stopListeningToInput();
	}

	/** Usuwa dodane światy; widmo otwartego świata zostaje, dopóki `releaseReference` nie przywróci mu shaderów. */
	clear(): void {
		for (const key of [...this.worlds.keys()]) this.removeWorld(key);
		this.requests.clear();
		this.selectedKey = null;
		this.refreshGizmo();
		if (this.reference.length === 0) this.stopListeningToInput();
	}

	/**
	 * Porzuca tilesety odniesienia bez przywracania shaderów: używamy tego, gdy właściciel sam je usuwa
	 * (zmiana modelu świata), więc nie ma czego przywracać.
	 */
	forgetReference(): void {
		this.reference = [];
		if (this.worlds.size === 0) this.stopListeningToInput();
	}

	/**
	 * Zamienia otwarty świat (i jego obiekty) w widmo o podanej barwie. Poprzednie shadery nie są zapamiętywane:
	 * po `releaseReference` właściciel tilesetów nakłada swoje shadery od nowa.
	 */
	ghostReference(tilesets: readonly Cesium3DTileset[], tintCssColor: string): void {
		this.releaseReference();
		this.reference = tilesets.map((tileset) => {
			const shader = this.shaderBuilder.createShader(tintCssColor, BASE_ALPHA);
			tileset.customShader = shader;
			return { tileset, shader };
		});
		this.startListeningToInput();
	}

	/** Przestaje traktować tilesety odniesienia jako widma i zwraca je, żeby właściciel przywrócił im shadery. */
	releaseReference(): Cesium3DTileset[] {
		const tilesets = this.reference.map((entry) => entry.tileset);
		this.reference = [];
		if (this.worlds.size === 0) this.stopListeningToInput();
		return tilesets;
	}

	isReferenceTileset(tileset: Cesium3DTileset): boolean {
		return this.reference.some((entry) => entry.tileset === tileset);
	}

	placeWorld(key: string, placement: SizeWorldPlacement): void {
		const entry = this.worlds.get(key);
		if (!entry) return;
		entry.placement = placement;
		entry.tileset.modelMatrix = this.placementCalculator.buildModelMatrix(
			entry.frame.anchorToEcef,
			entry.extent,
			placement
		);
		if (key === this.selectedKey) this.refreshGizmo();
	}

	/** Wybiera świat, który ma gizmo; `null` chowa gizmo. */
	selectWorld(key: string | null): void {
		this.selectedKey = key !== null && this.worlds.has(key) ? key : null;
		this.refreshGizmo();
	}

	/** Wyróżnia jeden świat (większa nieprzezroczystość); `null` wraca do stanu spokojnego. */
	highlightWorld(key: string | null): void {
		this.highlightedKey = key;
		this.applyAlphas();
	}

	destroy(): void {
		this.clear();
		this.forgetReference();
		this.gizmo.destroy();
		this.removePostRenderListener();
	}

	private applyAlphas(): void {
		const emphasizedKey = this.highlightedKey ?? this.hoveredKey;
		for (const [key, entry] of this.worlds) {
			this.shaderBuilder.setAlpha(
				entry.shader,
				key === emphasizedKey ? HIGHLIGHT_ALPHA : BASE_ALPHA
			);
		}
		for (const entry of this.reference) {
			this.shaderBuilder.setAlpha(
				entry.shader,
				emphasizedKey === REFERENCE_WORLD_KEY ? HIGHLIGHT_ALPHA : BASE_ALPHA
			);
		}
	}

	private refreshGizmo(): void {
		const entry = this.selectedKey === null ? undefined : this.worlds.get(this.selectedKey);
		if (!entry) {
			this.gizmo.hide();
			return;
		}
		this.gizmo.show(
			this.readCentre(entry),
			Matrix4.getMatrix3(entry.frame.anchorToEcef, new Matrix3()),
			entry.placement.headingDegrees
		);
	}

	private readCentre(entry: SizeWorldEntry): Cartesian3 {
		return entry.frame.toSceneCartesian(
			entry.extent.centerEast + entry.placement.east,
			entry.extent.centerNorth + entry.placement.north,
			entry.extent.centerUp + entry.placement.up
		);
	}

	/**
	 * Wciśnięcie przycisku przechwytujemy w fazie przechwytywania na oknie, zanim zobaczy je Cesium: gdy trafiamy
	 * w gizmo albo świat, zdarzenie nie dociera do kontrolera kamery, więc kamera nie ma czego „nadrabiać” po puszczeniu
	 * przycisku (samo wyłączenie jej akcji zostawiało ruch w kolejce i kamera skakała).
	 */
	private startListeningToInput(): void {
		if (this.isListeningToInput) return;
		this.isListeningToInput = true;
		window.addEventListener('pointerdown', this.reactToPointerDown, true);
		window.addEventListener('pointermove', this.reactToPointerMove);
		window.addEventListener('pointerup', this.reactToPointerUp);
		window.addEventListener('pointercancel', this.reactToPointerUp);
	}

	private stopListeningToInput(): void {
		if (!this.isListeningToInput) return;
		this.isListeningToInput = false;
		this.finishDrag();
		window.removeEventListener('pointerdown', this.reactToPointerDown, true);
		window.removeEventListener('pointermove', this.reactToPointerMove);
		window.removeEventListener('pointerup', this.reactToPointerUp);
		window.removeEventListener('pointercancel', this.reactToPointerUp);
		this.pendingHoverPosition = null;
		if (this.hoveredKey !== null) {
			this.hoveredKey = null;
			this.listener?.onHovered(null);
		}
	}

	private readonly reactToPointerDown = (event: PointerEvent): void => {
		if (event.target !== this.viewer.scene.canvas || event.button !== 0 || !event.isPrimary) {
			return;
		}
		if (this.startDrag(this.readCanvasPosition(event))) {
			event.stopImmediatePropagation();
			event.preventDefault();
		}
	};

	private readonly reactToPointerMove = (event: PointerEvent): void => {
		const position = this.readCanvasPosition(event);
		if (this.drag) this.moveDragged(position);
		else if (event.target === this.viewer.scene.canvas) this.pendingHoverPosition = position;
		else this.pendingHoverPosition = null;
	};

	private readonly reactToPointerUp = (): void => this.finishDrag();

	private readCanvasPosition(event: PointerEvent): Cartesian2 {
		const bounds = this.viewer.scene.canvas.getBoundingClientRect();
		return new Cartesian2(event.clientX - bounds.left, event.clientY - bounds.top);
	}

	/** Najechanie sprawdzamy raz na klatkę, bo `drillPick` renderuje scenę do bufora wyboru. */
	private resolveHover(): void {
		const position = this.pendingHoverPosition;
		this.pendingHoverPosition = null;
		if (!position || this.drag) return;
		const key = this.pickWorldKey(position);
		if (key === this.hoveredKey) return;
		this.hoveredKey = key;
		this.applyAlphas();
		this.listener?.onHovered(key);
	}

	private pickWorldKey(position: Cartesian2): string | null {
		for (const picked of this.viewer.scene.drillPick(position, MAXIMUM_PICKED_OBJECTS)) {
			const primitive: unknown = isRecord(picked) ? picked.primitive : undefined;
			for (const [key, entry] of this.worlds) {
				if (entry.tileset === primitive) return key;
			}
			if (this.reference.some((entry) => entry.tileset === primitive)) return REFERENCE_WORLD_KEY;
		}
		return null;
	}

	/** Zwraca `true`, gdy wskaźnik trafił w gizmo albo świat i zaczęło się przeciąganie. */
	private startDrag(position: Cartesian2): boolean {
		const handle = this.gizmo.pickHandle(position);
		const selected = this.selectedKey === null ? undefined : this.worlds.get(this.selectedKey);
		if (handle && selected && this.selectedKey !== null) {
			return this.startHandleDrag(this.selectedKey, selected, handle, position);
		}
		const key = this.pickWorldKey(position);
		const entry = key === null ? undefined : this.worlds.get(key);
		if (key === null || !entry) return false;
		const plane = this.buildHorizontalPlane(entry);
		const hit = this.intersectPlane(position, plane, entry.frame);
		if (!hit) return false;
		this.drag = {
			kind: 'plane',
			key,
			startEast: hit.east,
			startNorth: hit.north,
			startPlacement: entry.placement,
			plane
		};
		this.listener?.onSelected(key);
		return true;
	}

	private startHandleDrag(
		key: string,
		entry: SizeWorldEntry,
		handle: GizmoHandle,
		position: Cartesian2
	): boolean {
		if (handle === 'heading') {
			const plane = this.buildHorizontalPlane(entry);
			const hit = this.intersectPlane(position, plane, entry.frame);
			if (!hit) return false;
			this.drag = {
				kind: 'heading',
				key,
				startAngle: this.measureAngleAroundCentre(entry, hit),
				startPlacement: entry.placement,
				plane
			};
		} else {
			const axisOrigin = this.readCentre(entry);
			const axisDirection = Cartesian3.normalize(
				Matrix4.multiplyByPointAsVector(
					entry.frame.anchorToEcef,
					handle === 'east'
						? Cartesian3.UNIT_X
						: handle === 'north'
							? Cartesian3.UNIT_Y
							: Cartesian3.UNIT_Z,
					new Cartesian3()
				),
				new Cartesian3()
			);
			const startParameter = this.measureAxisParameter(position, axisOrigin, axisDirection);
			if (startParameter === null) return false;
			this.drag = {
				kind: 'axis',
				key,
				handle,
				startParameter,
				startPlacement: entry.placement,
				axisOrigin,
				axisDirection
			};
		}
		this.gizmo.highlightHandle(handle);
		this.listener?.onSelected(key);
		return true;
	}

	private moveDragged(position: Cartesian2): void {
		const drag = this.drag;
		const entry = drag ? this.worlds.get(drag.key) : undefined;
		if (!drag || !entry) return;
		const placement = this.computeDraggedPlacement(drag, entry, position);
		if (!placement) return;
		this.placeWorld(drag.key, placement);
		this.listener?.onPlaced(drag.key, placement);
	}

	private computeDraggedPlacement(
		drag: Drag,
		entry: SizeWorldEntry,
		position: Cartesian2
	): SizeWorldPlacement | null {
		if (drag.kind === 'plane') {
			const hit = this.intersectPlane(position, drag.plane, entry.frame);
			if (!hit) return null;
			return {
				...drag.startPlacement,
				east: drag.startPlacement.east + hit.east - drag.startEast,
				north: drag.startPlacement.north + hit.north - drag.startNorth
			};
		}
		if (drag.kind === 'axis') {
			const parameter = this.measureAxisParameter(position, drag.axisOrigin, drag.axisDirection);
			if (parameter === null) return null;
			return {
				...drag.startPlacement,
				[drag.handle]: drag.startPlacement[drag.handle] + parameter - drag.startParameter
			};
		}
		const hit = this.intersectPlane(position, drag.plane, entry.frame);
		if (!hit) return null;
		const turn = wrapToShortestTurnDegrees(
			this.measureAngleAroundCentre(entry, hit) - drag.startAngle
		);
		return { ...drag.startPlacement, headingDegrees: drag.startPlacement.headingDegrees + turn };
	}

	private finishDrag(): void {
		this.drag = null;
		this.gizmo.highlightHandle(null);
	}

	private buildHorizontalPlane(entry: SizeWorldEntry): Plane {
		const centre = this.readCentre(entry);
		return Plane.fromPointNormal(centre, Ellipsoid.WGS84.geodeticSurfaceNormal(centre));
	}

	private measureAngleAroundCentre(
		entry: SizeWorldEntry,
		hit: { east: number; north: number }
	): number {
		return measureClockwiseAngleDegrees(
			hit.east - (entry.extent.centerEast + entry.placement.east),
			hit.north - (entry.extent.centerNorth + entry.placement.north)
		);
	}

	private measureAxisParameter(
		position: Cartesian2,
		axisOrigin: Cartesian3,
		axisDirection: Cartesian3
	): number | null {
		const ray = this.viewer.camera.getPickRay(position);
		if (!ray) return null;
		return findClosestParameterOnLine(ray.origin, ray.direction, axisOrigin, axisDirection);
	}

	private intersectPlane(
		position: Cartesian2,
		plane: Plane,
		frame: WorldFrame
	): { east: number; north: number } | null {
		const ray = this.viewer.camera.getPickRay(position);
		const point = ray ? IntersectionTests.rayPlane(ray, plane, new Cartesian3()) : undefined;
		if (!point) return null;
		const local = frame.toWorldPosition(point);
		return { east: local.east, north: local.north };
	}
}
