import { describe, expect, it } from 'vitest';
import type { WaypointNetwork, WaypointNode } from '#lib/data/types.js';
import { LocalProjector } from '#lib/services/analysis/local-projector.js';
import { RouteFinder } from './route-finder.js';
import { WaypointGraph } from './waypoint-graph.js';

const projector = new LocalProjector({ lon: 0, lat: 0, h: 0 });
const DEGREES_PER_METRE = 1 / 111319.49;

function node(name: string, eastMetres: number, northMetres: number): WaypointNode {
	return {
		name,
		lon: eastMetres * DEGREES_PER_METRE,
		lat: northMetres * DEGREES_PER_METRE,
		height: 0,
		isUnderwater: false
	};
}

function buildGraph(nodes: WaypointNode[], links: [string, string][]): WaypointGraph {
	const network: WaypointNetwork = {
		nodes,
		edges: links.map(([from, to]) => ({ from, to }))
	};
	return new WaypointGraph(network, projector);
}

const finder = new RouteFinder();

describe('RouteFinder', () => {
	it('wybiera krótszą drogę, a nie tę z mniejszą liczbą odcinków', () => {
		const graph = buildGraph(
			[
				node('A', 0, 0),
				node('FAR', 0, 300),
				node('C', 200, 0),
				node('M1', 50, 0),
				node('M2', 100, 0),
				node('M3', 150, 0)
			],
			[
				['A', 'FAR'],
				['FAR', 'C'],
				['A', 'M1'],
				['M1', 'M2'],
				['M2', 'M3'],
				['M3', 'C']
			]
		);
		expect(finder.findShortestPath(graph, 0, 2)).toEqual([0, 3, 4, 5, 2]);
	});

	it('zwraca jeden węzeł, gdy start jest celem', () => {
		const graph = buildGraph([node('A', 0, 0), node('B', 10, 0)], [['A', 'B']]);
		expect(finder.findShortestPath(graph, 1, 1)).toEqual([1]);
	});

	it('zwraca null między osobnymi składowymi', () => {
		const graph = buildGraph(
			[node('A', 0, 0), node('B', 10, 0), node('C', 500, 0), node('D', 510, 0)],
			[
				['A', 'B'],
				['C', 'D']
			]
		);
		expect(finder.findShortestPath(graph, 0, 3)).toBeNull();
	});

	it('trasa zaczyna się w starcie i kończy w celu', () => {
		const graph = buildGraph(
			[node('A', 0, 0), node('B', 10, 0), node('C', 20, 0)],
			[
				['A', 'B'],
				['B', 'C']
			]
		);
		const path = finder.findShortestPath(graph, 2, 0);
		expect(path?.[0]).toBe(2);
		expect(path?.[path.length - 1]).toBe(0);
	});
});
