import { Cartesian3, Cartographic, Math as CesiumMath, Matrix4, Transforms } from 'cesium';
import type { Anchor } from '#lib/data/types.js';

export interface WorldPosition {
	east: number;
	north: number;
	height: number;
	lon: number;
	lat: number;
}

export interface GameCoordinates {
	x: number;
	y: number;
	z: number;
}

const CENTIMETRES_PER_METRE = 100;

/**
 * Lokalna rama świata gry: osie Wschód, Północ, Góra w metrach od kotwicy z `metadata.json`.
 * Przelicza punkty sceny Cesium na pozycję w świecie i z powrotem.
 */
export class WorldFrame {
	readonly anchorToEcef: Matrix4;
	readonly ecefToAnchor: Matrix4;

	constructor(anchor: Anchor) {
		this.anchorToEcef = Transforms.eastNorthUpToFixedFrame(
			Cartesian3.fromDegrees(anchor.lon, anchor.lat, anchor.h)
		);
		this.ecefToAnchor = Matrix4.inverseTransformation(this.anchorToEcef, new Matrix4());
	}

	toWorldPosition(sceneCartesian: Cartesian3): WorldPosition {
		const local = Matrix4.multiplyByPoint(this.ecefToAnchor, sceneCartesian, new Cartesian3());
		const cartographic = Cartographic.fromCartesian(sceneCartesian);
		return {
			east: local.x,
			north: local.y,
			height: local.z,
			lon: CesiumMath.toDegrees(cartographic.longitude),
			lat: CesiumMath.toDegrees(cartographic.latitude)
		};
	}

	toSceneCartesian(east: number, north: number, height: number): Cartesian3 {
		return Matrix4.multiplyByPoint(
			this.anchorToEcef,
			new Cartesian3(east, north, height),
			new Cartesian3()
		);
	}
}

/** Współrzędne gry (cm): x = Wschód, y = Góra, z = −Północ — odwrotność osi z `metadata.json`. */
export function convertToGameCoordinates(position: WorldPosition): GameCoordinates {
	return {
		x: Math.round(position.east * CENTIMETRES_PER_METRE),
		y: Math.round(position.height * CENTIMETRES_PER_METRE),
		z: Math.round(-position.north * CENTIMETRES_PER_METRE)
	};
}
