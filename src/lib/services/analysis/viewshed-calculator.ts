import type { LocalPoint } from '#lib/services/measurement/measurement-calculator.js';

export interface ViewshedSettings {
	radiusMetres: number;
	eyeHeightMetres: number;
}

export interface ViewshedCell {
	corners: LocalPoint[];
	heightMetres: number;
	isVisible: boolean;
}

export interface ViewshedResult {
	cells: ViewshedCell[];
	visibleAreaFraction: number;
	unknownCellCount: number;
}

const AZIMUTH_COUNT = 120;
const RING_STEP_METRES = 6;
const MINIMUM_RING_COUNT = 5;
const SLOPE_TOLERANCE = 1e-4;

/**
 * Widoczność z punktu na siatce biegunowej: promienie co 3° i pierścienie co ok. 6 m. Rachunek jest
 * czysty — wysokości terenu pod próbkami dostarcza wywołujący, a wynik to komórki z flagą widoczności.
 */
export class ViewshedCalculator {
	readonly azimuthCount = AZIMUTH_COUNT;

	countRings(radiusMetres: number): number {
		return Math.max(MINIMUM_RING_COUNT, Math.ceil(radiusMetres / RING_STEP_METRES));
	}

	/**
	 * Punkty, pod którymi trzeba odczytać wysokość terenu, w kolejności promień po promieniu,
	 * od najbliższego pierścienia do najdalszego (środek komórki w kierunku promienia).
	 */
	buildSamplePoints(origin: LocalPoint, radiusMetres: number): LocalPoint[] {
		const ringCount = this.countRings(radiusMetres);
		const points: LocalPoint[] = [];
		for (let azimuth = 0; azimuth < this.azimuthCount; azimuth++) {
			for (let ring = 1; ring <= ringCount; ring++) {
				points.push(this.projectPoint(origin, azimuth, (ring / ringCount) * radiusMetres));
			}
		}
		return points;
	}

	/**
	 * `terrain` ma tyle elementów, co wynik `buildSamplePoints`; `null` oznacza brak odczytu
	 * (komórka nie ma wtedy koloru i nie liczy się do pola). Teren jest widoczny, gdy jego kąt
	 * wzniesienia z oka obserwatora nie jest mniejszy niż kąt najwyższej wcześniejszej przeszkody.
	 */
	calculate(
		origin: LocalPoint,
		settings: ViewshedSettings,
		terrain: readonly (LocalPoint | null)[]
	): ViewshedResult {
		const ringCount = this.countRings(settings.radiusMetres);
		const eyeHeight = origin.height + settings.eyeHeightMetres;
		const cells: ViewshedCell[] = [];
		let visibleArea = 0;
		let knownArea = 0;
		let unknownCellCount = 0;
		for (let azimuth = 0; azimuth < this.azimuthCount; azimuth++) {
			let highestSlope = Number.NEGATIVE_INFINITY;
			for (let ring = 1; ring <= ringCount; ring++) {
				const sample = terrain.at(azimuth * ringCount + ring - 1) ?? null;
				if (!sample) {
					unknownCellCount++;
					continue;
				}
				const outerDistance = (ring / ringCount) * settings.radiusMetres;
				const innerDistance = ((ring - 1) / ringCount) * settings.radiusMetres;
				const slope = (sample.height - eyeHeight) / outerDistance;
				const isVisible = slope >= highestSlope - SLOPE_TOLERANCE;
				highestSlope = Math.max(highestSlope, slope);
				const area = outerDistance ** 2 - innerDistance ** 2;
				knownArea += area;
				if (isVisible) visibleArea += area;
				cells.push({
					corners: this.buildCellCorners(origin, azimuth, innerDistance, outerDistance),
					heightMetres: sample.height,
					isVisible
				});
			}
		}
		return {
			cells,
			visibleAreaFraction: knownArea > 0 ? visibleArea / knownArea : 0,
			unknownCellCount
		};
	}

	private buildCellCorners(
		origin: LocalPoint,
		azimuth: number,
		innerDistance: number,
		outerDistance: number
	): LocalPoint[] {
		return [
			this.projectPoint(origin, azimuth - 0.5, innerDistance),
			this.projectPoint(origin, azimuth + 0.5, innerDistance),
			this.projectPoint(origin, azimuth + 0.5, outerDistance),
			this.projectPoint(origin, azimuth - 0.5, outerDistance)
		];
	}

	private projectPoint(origin: LocalPoint, azimuth: number, distanceMetres: number): LocalPoint {
		const angle = (azimuth / this.azimuthCount) * 2 * Math.PI;
		return {
			east: origin.east + distanceMetres * Math.cos(angle),
			north: origin.north + distanceMetres * Math.sin(angle),
			height: origin.height
		};
	}
}
