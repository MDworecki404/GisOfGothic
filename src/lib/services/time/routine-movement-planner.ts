import type { GeodeticPoint, LocalProjector } from '#lib/services/analysis/local-projector.js';
import type { LocalPoint } from '#lib/services/measurement/measurement-calculator.js';
import { REAL_SECONDS_PER_GAME_MINUTE } from '#lib/services/measurement/travel-time-calculator.js';
import type { RoutePlanner } from '#lib/services/routing/route-planner.js';
import type { RoutinePlace } from './character-timeline.js';

/** Droga postaci z jednego miejsca rutyny do drugiego: punkty na mapie, długość i czas marszu w minutach gry. */
export class WalkingLeg {
	constructor(
		private readonly points: readonly GeodeticPoint[],
		private readonly cumulativeMetres: readonly number[],
		readonly totalMetres: number,
		readonly durationMinutes: number
	) {}

	/** Punkt drogi po ułamku jej długości; ułamek spoza 0–1 jest przycinany do początku albo końca. */
	pointAtFraction(fraction: number): GeodeticPoint {
		const targetMetres = Math.min(Math.max(fraction, 0), 1) * this.totalMetres;
		const segmentEnd = this.cumulativeMetres.findIndex((metres) => metres >= targetMetres);
		if (segmentEnd <= 0) return this.points[segmentEnd === -1 ? this.points.length - 1 : 0];
		const segmentStart = segmentEnd - 1;
		const segmentMetres = this.cumulativeMetres[segmentEnd] - this.cumulativeMetres[segmentStart];
		const along =
			segmentMetres === 0
				? 0
				: (targetMetres - this.cumulativeMetres[segmentStart]) / segmentMetres;
		const from = this.points[segmentStart];
		const to = this.points[segmentEnd];
		return {
			lon: from.lon + (to.lon - from.lon) * along,
			lat: from.lat + (to.lat - from.lat) * along,
			h: from.h + (to.h - from.h) * along
		};
	}
}

function measureHorizontalMetres(first: LocalPoint, second: LocalPoint): number {
	return Math.hypot(second.east - first.east, second.north - first.north);
}

function isSamePlace(first: RoutinePlace, second: RoutinePlace): boolean {
	return first.lon === second.lon && first.lat === second.lat && first.h === second.h;
}

/** Planuje marsz postaci między miejscami rutyny po sieci dróg świata. */
export class RoutineMovementPlanner {
	constructor(
		private readonly routePlanner: RoutePlanner,
		private readonly projector: LocalProjector,
		private readonly walkMetresPerSecond: number
	) {}

	/** `null`, gdy to samo miejsce albo brak drogi (miejsce za daleko od sieci). */
	planLeg(from: RoutinePlace, to: RoutinePlace): WalkingLeg | null {
		if (isSamePlace(from, to)) return null;
		const outcome = this.routePlanner.planRoute(
			this.projector.projectToLocalPoint(from.lon, from.lat, from.h),
			this.projector.projectToLocalPoint(to.lon, to.lat, to.h)
		);
		if (outcome.status !== 'found') return null;

		const cumulativeMetres = [0];
		for (let index = 1; index < outcome.path.length; index++) {
			cumulativeMetres.push(
				cumulativeMetres[index - 1] +
					measureHorizontalMetres(outcome.path[index - 1], outcome.path[index])
			);
		}
		const totalMetres = cumulativeMetres[cumulativeMetres.length - 1];
		return new WalkingLeg(
			outcome.path.map((point) => this.projector.unprojectToGeodetic(point)),
			cumulativeMetres,
			totalMetres,
			totalMetres / this.walkMetresPerSecond / REAL_SECONDS_PER_GAME_MINUTE
		);
	}
}
