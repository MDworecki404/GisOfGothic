import type { Anchor } from '#lib/data/types.js';
import type { LocalPoint } from '#lib/services/measurement/measurement-calculator.js';

const SEMI_MAJOR_AXIS_METRES = 6378137;
const FLATTENING = 1 / 298.257223563;
const ECCENTRICITY_SQUARED = FLATTENING * (2 - FLATTENING);

interface EarthFixedPoint {
	x: number;
	y: number;
	z: number;
}

function convertGeodeticToEarthFixed(
	lonDegrees: number,
	latDegrees: number,
	height: number
): EarthFixedPoint {
	const lon = (lonDegrees * Math.PI) / 180;
	const lat = (latDegrees * Math.PI) / 180;
	const primeVerticalRadius =
		SEMI_MAJOR_AXIS_METRES / Math.sqrt(1 - ECCENTRICITY_SQUARED * Math.sin(lat) ** 2);
	return {
		x: (primeVerticalRadius + height) * Math.cos(lat) * Math.cos(lon),
		y: (primeVerticalRadius + height) * Math.cos(lat) * Math.sin(lon),
		z: (primeVerticalRadius * (1 - ECCENTRICITY_SQUARED) + height) * Math.sin(lat)
	};
}

/**
 * Rzutuje punkty podane jako lon/lat/h (WGS 84) na lokalną ramę świata: Wschód, Północ, Góra
 * w metrach od kotwicy. To ten sam układ co `WorldFrame`, ale bez Cesium — analizy liczą się
 * więc na czystych liczbach i da się je testować bez przeglądarki.
 */
export class LocalProjector {
	private readonly anchorPoint: EarthFixedPoint;
	private readonly sinLon: number;
	private readonly cosLon: number;
	private readonly sinLat: number;
	private readonly cosLat: number;

	constructor(anchor: Anchor) {
		this.anchorPoint = convertGeodeticToEarthFixed(anchor.lon, anchor.lat, anchor.h);
		const lon = (anchor.lon * Math.PI) / 180;
		const lat = (anchor.lat * Math.PI) / 180;
		this.sinLon = Math.sin(lon);
		this.cosLon = Math.cos(lon);
		this.sinLat = Math.sin(lat);
		this.cosLat = Math.cos(lat);
	}

	projectToLocalPoint(lon: number, lat: number, height: number): LocalPoint {
		const point = convertGeodeticToEarthFixed(lon, lat, height);
		const dx = point.x - this.anchorPoint.x;
		const dy = point.y - this.anchorPoint.y;
		const dz = point.z - this.anchorPoint.z;
		return {
			east: -this.sinLon * dx + this.cosLon * dy,
			north: -this.sinLat * this.cosLon * dx - this.sinLat * this.sinLon * dy + this.cosLat * dz,
			height: this.cosLat * this.cosLon * dx + this.cosLat * this.sinLon * dy + this.sinLat * dz
		};
	}
}
