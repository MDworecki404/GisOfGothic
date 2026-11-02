import { Cesium3DTileset, OrientedBoundingBox } from 'cesium';
import { isRecord } from '#lib/data/parsers.js';
import type { WorldFrame } from '#lib/services/geodesy/world-frame.js';

/** Obrys modelu świata w jego ramie (Wschód, Północ, Góra): środek i wymiary w metrach. */
export interface WorldExtent {
	centerEast: number;
	centerNorth: number;
	centerUp: number;
	widthMetres: number;
	depthMetres: number;
}

/**
 * Odczytuje obrys tilesetu z obwiedni korzenia (pudełko z `tileset.json`). Gdy obwiednia nie jest pudełkiem
 * (np. kula w zastępczym tilesecie testów), obrysem jest kwadrat opisany na kuli.
 */
export class WorldExtentReader {
	readExtent(tileset: Cesium3DTileset, frame: WorldFrame): WorldExtent {
		const box = this.findRootBox(tileset);
		if (box) return this.measureCorners(box, frame);
		const sphere = tileset.boundingSphere;
		const center = frame.toWorldPosition(sphere.center);
		return {
			centerEast: center.east,
			centerNorth: center.north,
			centerUp: center.height,
			widthMetres: sphere.radius * 2,
			depthMetres: sphere.radius * 2
		};
	}

	private findRootBox(tileset: Cesium3DTileset): OrientedBoundingBox | null {
		const volume: unknown = Reflect.get(tileset.root, 'boundingVolume');
		const box: unknown = isRecord(volume) ? volume.boundingVolume : undefined;
		return box instanceof OrientedBoundingBox ? box : null;
	}

	private measureCorners(box: OrientedBoundingBox, frame: WorldFrame): WorldExtent {
		const corners = OrientedBoundingBox.computeCorners(box).map((corner) =>
			frame.toWorldPosition(corner)
		);
		const easts = corners.map((corner) => corner.east);
		const norths = corners.map((corner) => corner.north);
		const heights = corners.map((corner) => corner.height);
		const middle = (values: readonly number[]): number =>
			(Math.min(...values) + Math.max(...values)) / 2;
		return {
			centerEast: middle(easts),
			centerNorth: middle(norths),
			centerUp: middle(heights),
			widthMetres: Math.max(...easts) - Math.min(...easts),
			depthMetres: Math.max(...norths) - Math.min(...norths)
		};
	}
}
