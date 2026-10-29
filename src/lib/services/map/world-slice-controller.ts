import { Cartesian3, ClippingPlane, ClippingPlaneCollection, type Cesium3DTileset } from 'cesium';
import type { SliceHeightRange } from '#lib/services/camera/view-mode.js';
import type { WorldFrame } from '#lib/services/geodesy/world-frame.js';
import { SlicePlaneCalculator } from './slice-plane-calculator.js';

const WORLD_FRAME_ORIGIN_HEIGHT_METRES = 0;

/**
 * Jedyne miejsce, które dotyka płaszczyzn cięcia tilesetów świata. Układ płaszczyzny tilesetu to rama
 * kotwicy świata (jego macierz początku pokrywa się z macierzą kotwicy), więc wysokość cięcia jest
 * wysokością w ramie świata. Kolekcja płaszczyzn powstaje raz na tileset i jest wyłączana zamiast usuwana.
 */
export class WorldSliceController {
	private readonly calculator = new SlicePlaneCalculator();
	private readonly collectionsByTileset = new WeakMap<Cesium3DTileset, ClippingPlaneCollection>();
	private sliceHeightMetres: number | null = null;

	constructor(
		private readonly readWorldTileset: () => Cesium3DTileset | null,
		private readonly readStaticObjectsTilesets: () => readonly Cesium3DTileset[],
		private readonly readFrame: () => WorldFrame | null
	) {}

	showHeight(metres: number | null): void {
		this.sliceHeightMetres = metres;
		const worldTileset = this.readWorldTileset();
		if (worldTileset) this.applyTo(worldTileset);
		for (const tileset of this.readStaticObjectsTilesets()) this.applyTo(tileset);
	}

	applyTo(tileset: Cesium3DTileset): void {
		const collection = this.collectionsByTileset.get(tileset);
		if (this.sliceHeightMetres === null) {
			if (collection) collection.enabled = false;
			return;
		}
		const distance = this.calculator.calculatePlaneDistance(
			this.sliceHeightMetres,
			WORLD_FRAME_ORIGIN_HEIGHT_METRES
		);
		const plane = collection?.get(0);
		if (collection && plane) {
			plane.distance = distance;
			collection.enabled = true;
			return;
		}
		const { x, y, z } = this.calculator.planeNormal;
		const created = new ClippingPlaneCollection({
			planes: [new ClippingPlane(new Cartesian3(x, y, z), distance)]
		});
		this.collectionsByTileset.set(tileset, created);
		tileset.clippingPlanes = created;
	}

	/** Zakres wysokości z kuli granicznej modelu świata, w ramie świata; `null`, zanim model się wczyta. */
	readHeightRange(): SliceHeightRange | null {
		const tileset = this.readWorldTileset();
		const frame = this.readFrame();
		if (!tileset || !frame) return null;
		const { center, radius } = tileset.boundingSphere;
		const centreHeight = frame.toWorldPosition(center).height;
		return {
			minimumMetres: Math.floor(centreHeight - radius),
			maximumMetres: Math.ceil(centreHeight + radius)
		};
	}
}
