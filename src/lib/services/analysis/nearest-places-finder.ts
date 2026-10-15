import type { LocalPoint } from '#lib/services/measurement/measurement-calculator.js';

export interface NearestMatch<T extends LocalPoint> {
	candidate: T;
	horizontalMetres: number;
	straightMetres: number;
}

/** Wybiera z kandydatów te najbliższe wskazanemu punktowi, liczone po prostej w przestrzeni. */
export class NearestPlacesFinder {
	findNearest<T extends LocalPoint>(
		origin: LocalPoint,
		candidates: readonly T[],
		count: number
	): NearestMatch<T>[] {
		return candidates
			.map((candidate) => ({
				candidate,
				horizontalMetres: Math.hypot(candidate.east - origin.east, candidate.north - origin.north),
				straightMetres: Math.hypot(
					candidate.east - origin.east,
					candidate.north - origin.north,
					candidate.height - origin.height
				)
			}))
			.sort((a, b) => a.straightMetres - b.straightMetres)
			.slice(0, count);
	}
}
