import { describe, expect, it } from 'vitest';
import type { WaypointNetwork, WaypointNode } from '#lib/data/types.js';
import { LocalProjector } from '#lib/services/analysis/local-projector.js';
import { RouteFinder } from './route-finder.js';
import { MAXIMUM_APPROACH_METRES, RoutePlanner } from './route-planner.js';
import { WaypointGraph } from './waypoint-graph.js';

const projector = new LocalProjector({ lon: 0, lat: 0, h: 0 });
const DEGREES_PER_METRE = 1 / 111319.49;

function node(name: string, eastMetres: number): WaypointNode {
	return { name, lon: eastMetres * DEGREES_PER_METRE, lat: 0, height: 0, isUnderwater: false };
}

const roadNetwork: WaypointNetwork = {
	nodes: [node('A', 0), node('B', 100), node('C', 200)],
	edges: [
		{ from: 'A', to: 'B' },
		{ from: 'B', to: 'C' }
	]
};

function createPlanner(network: WaypointNetwork = roadNetwork): RoutePlanner {
	return new RoutePlanner(new WaypointGraph(network, projector), new RouteFinder());
}

function at(east: number, north = 0) {
	return { east, north, height: 0 };
}

describe('RoutePlanner', () => {
	it('trasa zawiera dojście, sieć i dojście', () => {
		const outcome = createPlanner().planRoute(at(0, 10), at(200, -20));
		if (outcome.status !== 'found') throw new Error(`oczekiwano trasy, jest ${outcome.status}`);
		expect(outcome.path).toHaveLength(5);
		expect(outcome.path[0]).toEqual(at(0, 10));
		expect(outcome.path[4]).toEqual(at(200, -20));
		expect(outcome.networkMetres).toBeCloseTo(200, 0);
		expect(outcome.startApproachMetres).toBeCloseTo(10, 0);
		expect(outcome.endApproachMetres).toBeCloseTo(20, 0);
	});

	it('zwraca too-far-from-network, gdy start leży dalej niż próg', () => {
		const outcome = createPlanner().planRoute(at(0, MAXIMUM_APPROACH_METRES + 50), at(200));
		expect(outcome.status).toBe('too-far-from-network');
	});

	it('zwraca too-far-from-network dla pustej sieci', () => {
		const outcome = createPlanner({ nodes: [], edges: [] }).planRoute(at(0), at(10));
		expect(outcome.status).toBe('too-far-from-network');
	});

	it('zwraca no-path, gdy wyszukiwarka nie znajdzie ścieżki', () => {
		const planner = new RoutePlanner(new WaypointGraph(roadNetwork, projector), {
			findShortestPath: () => null
		});
		expect(planner.planRoute(at(0), at(200)).status).toBe('no-path');
	});

	it('start równy celowi daje długość sieci 0 i bez błędu', () => {
		const outcome = createPlanner().planRoute(at(100, 5), at(100, 5));
		if (outcome.status !== 'found') throw new Error(`oczekiwano trasy, jest ${outcome.status}`);
		expect(outcome.networkMetres).toBe(0);
		expect(outcome.path).toHaveLength(3);
	});
});
