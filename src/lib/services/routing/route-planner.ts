import type { LocalPoint } from '#lib/services/measurement/measurement-calculator.js';
import type { ShortestPathFinder } from './route-finder.js';
import type { WaypointGraph } from './waypoint-graph.js';

/** Dalej od drogi (w poziomie) trasa nie jest wyznaczana; 99% przedmiotów w grze leży do 40 m od waypointu. */
export const MAXIMUM_APPROACH_METRES = 60;

export type RouteOutcome =
	| {
			status: 'found';
			path: LocalPoint[];
			networkMetres: number;
			startApproachMetres: number;
			endApproachMetres: number;
	  }
	| { status: 'too-far-from-network' }
	| { status: 'no-path' };

/**
 * Wyznacza trasę między dwoma dowolnymi punktami: przyciąga je do najbliższych waypointów,
 * szuka drogi po sieci, a ostatnie odcinki od punktów do sieci dokłada w linii prostej.
 */
export class RoutePlanner {
	constructor(
		private readonly graph: WaypointGraph,
		private readonly finder: ShortestPathFinder
	) {}

	planRoute(start: LocalPoint, end: LocalPoint): RouteOutcome {
		const startNode = this.graph.findNearestNode(start);
		const endNode = this.graph.findNearestNode(end);
		if (
			startNode === null ||
			endNode === null ||
			startNode.distanceMetres > MAXIMUM_APPROACH_METRES ||
			endNode.distanceMetres > MAXIMUM_APPROACH_METRES
		) {
			return { status: 'too-far-from-network' };
		}
		const nodeIndexes = this.finder.findShortestPath(this.graph, startNode.index, endNode.index);
		if (nodeIndexes === null) return { status: 'no-path' };

		const networkPoints = nodeIndexes.map((index) => this.graph.readNode(index));
		return {
			status: 'found',
			path: [start, ...networkPoints, end],
			networkMetres: this.measureHorizontalLength(networkPoints),
			startApproachMetres: startNode.distanceMetres,
			endApproachMetres: endNode.distanceMetres
		};
	}

	private measureHorizontalLength(points: readonly LocalPoint[]): number {
		let lengthMetres = 0;
		for (let index = 1; index < points.length; index++) {
			lengthMetres += Math.hypot(
				points[index].east - points[index - 1].east,
				points[index].north - points[index - 1].north
			);
		}
		return lengthMetres;
	}
}
