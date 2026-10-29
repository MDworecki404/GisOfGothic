export interface SlicePlaneNormal {
	x: number;
	y: number;
	z: number;
}

/**
 * Płaszczyzna cięcia jest pozioma, z normalną skierowaną w dół. Cesium zostawia część, dla której
 * normalna razy punkt plus odległość jest większe od zera, więc zostaje to, co leży poniżej wysokości cięcia.
 */
export class SlicePlaneCalculator {
	readonly planeNormal: SlicePlaneNormal = { x: 0, y: 0, z: -1 };

	calculatePlaneDistance(sliceHeightMetres: number, planeOriginHeightMetres: number): number {
		return sliceHeightMetres - planeOriginHeightMetres;
	}
}
