import type { GeodeticPoint } from '#lib/services/analysis/local-projector.js';
import type { LocalPoint } from '#lib/services/measurement/measurement-calculator.js';
import type { RouteOutcome } from './route-planner.js';

export interface RoutePlanning {
	planRoute(start: LocalPoint, end: LocalPoint): RouteOutcome;
}

export interface GeodeticProjection {
	projectToLocalPoint(lon: number, lat: number, height: number): LocalPoint;
	unprojectToGeodetic(point: LocalPoint): GeodeticPoint;
}

/** Wyznacza drogę między dwoma miejscami po sieci dróg świata; bez drogi zwraca linię prostą. */
export class RoadPathFinder {
	constructor(
		private readonly routePlanner: RoutePlanning,
		private readonly projector: GeodeticProjection
	) {}

	findPath(from: GeodeticPoint, to: GeodeticPoint): GeodeticPoint[] {
		const outcome = this.routePlanner.planRoute(
			this.projector.projectToLocalPoint(from.lon, from.lat, from.h),
			this.projector.projectToLocalPoint(to.lon, to.lat, to.h)
		);
		if (outcome.status !== 'found') return [from, to];
		return outcome.path.map((point) => this.projector.unprojectToGeodetic(point));
	}
}
