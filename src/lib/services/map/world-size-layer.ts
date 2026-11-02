import {
	Cartesian2,
	Cartesian3,
	Cesium3DTileset,
	Ellipsoid,
	IntersectionTests,
	Plane,
	type CustomShader,
	type Viewer
} from 'cesium';
import { isRecord } from '#lib/data/parsers.js';
import type { Anchor } from '#lib/data/types.js';
import { WorldFrame } from '#lib/services/geodesy/world-frame.js';
import { GhostWorldShaderBuilder } from './ghost-world-shader-builder.js';
import { WorldExtentReader, type WorldExtent } from './world-extent-reader.js';
import { WorldPlacementCalculator, type SizeWorldPlacement } from './world-placement-calculator.js';

export interface SizeWorldListener {
	onHovered(key: string | null): void;
	/** Przeciągnięcie świata po mapie: nowe przesunięcie na wschód i północ (metry). */
	onDragged(key: string, east: number, north: number): void;
}

interface SizeWorldEntry {
	tileset: Cesium3DTileset;
	shader: CustomShader;
	frame: WorldFrame;
	extent: WorldExtent;
	placement: SizeWorldPlacement;
}

interface DragState {
	key: string;
	startEast: number;
	startNorth: number;
	startPlacement: SizeWorldPlacement;
	plane: Plane;
}

const BASE_ALPHA = 0.4;
const HIGHLIGHT_ALPHA = 0.9;
const MAXIMUM_PICKED_OBJECTS = 8;

/**
 * Światy porównania rozmiarów: każdy to osobny, półprzezroczysty tileset w własnej pozycji (przesunięcie i obrót
 * wokół środka obrysu). Najechanie lub przeciągnięcie wskazuje świat przez `drillPick`, bo światy leżą jeden na drugim
 * i na otwartym modelu świata. Podczas przeciągania świat jedzie po płaszczyźnie poziomej przez swój środek,
 * a kamera w ogóle nie dostaje tego przeciągnięcia.
 */
export class WorldSizeLayer {
	private readonly worlds = new Map<string, SizeWorldEntry>();
	private readonly shaderBuilder = new GhostWorldShaderBuilder();
	private readonly extentReader = new WorldExtentReader();
	private readonly placementCalculator = new WorldPlacementCalculator();
	private readonly requests = new Map<string, number>();
	private requestCounter = 0;
	private listener: SizeWorldListener | null = null;
	private isListeningToInput = false;
	private pendingHoverPosition: Cartesian2 | null = null;
	private hoveredKey: string | null = null;
	private highlightedKey: string | null = null;
	private drag: DragState | null = null;
	private readonly removePostRenderListener: () => void;

	constructor(private readonly viewer: Viewer) {
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
		if (this.worlds.size === 0) this.stopListeningToInput();
	}

	clear(): void {
		for (const key of [...this.worlds.keys()]) this.removeWorld(key);
		this.requests.clear();
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
	}

	/** Wyróżnia jeden świat (większa nieprzezroczystość); `null` wraca do stanu spokojnego. */
	highlightWorld(key: string | null): void {
		this.highlightedKey = key;
		this.applyAlphas();
	}

	destroy(): void {
		this.clear();
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
	}

	/**
	 * Wciśnięcie przycisku przechwytujemy w fazie przechwytywania na oknie, zanim zobaczy je Cesium: gdy trafiamy
	 * w świat, zdarzenie nie dociera do kontrolera kamery, więc kamera nie ma czego „nadrabiać” po puszczeniu
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
		if (this.drag) this.moveDraggedWorld(position);
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
		}
		return null;
	}

	/** Zwraca `true`, gdy wskaźnik trafił w świat i zaczęło się jego przeciąganie. */
	private startDrag(position: Cartesian2): boolean {
		const key = this.pickWorldKey(position);
		const entry = key === null ? undefined : this.worlds.get(key);
		if (key === null || !entry) return false;
		const centre = entry.frame.toSceneCartesian(
			entry.extent.centerEast + entry.placement.east,
			entry.extent.centerNorth + entry.placement.north,
			entry.extent.centerUp + entry.placement.up
		);
		const plane = Plane.fromPointNormal(centre, Ellipsoid.WGS84.geodeticSurfaceNormal(centre));
		const hit = this.intersectPlane(position, plane, entry.frame);
		if (!hit) return false;
		this.drag = {
			key,
			startEast: hit.east,
			startNorth: hit.north,
			startPlacement: entry.placement,
			plane
		};
		return true;
	}

	private moveDraggedWorld(position: Cartesian2): void {
		const drag = this.drag;
		const entry = drag ? this.worlds.get(drag.key) : undefined;
		if (!drag || !entry) return;
		const hit = this.intersectPlane(position, drag.plane, entry.frame);
		if (!hit) return;
		const east = drag.startPlacement.east + hit.east - drag.startEast;
		const north = drag.startPlacement.north + hit.north - drag.startNorth;
		this.placeWorld(drag.key, { ...drag.startPlacement, east, north });
		this.listener?.onDragged(drag.key, east, north);
	}

	private finishDrag(): void {
		this.drag = null;
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
