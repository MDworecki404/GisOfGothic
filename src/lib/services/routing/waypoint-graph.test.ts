import { describe, expect, it } from 'vitest';
import type { WaypointNetwork, WaypointNode } from '#lib/data/types.js';
import { LocalProjector } from '#lib/services/analysis/local-projector.js';
import { WaypointGraph } from './waypoint-graph.js';

const projector = new LocalProjector({ lon: 0, lat: 0, h: 0 });
const DEGREES_PER_100_METRES = 100 / 111319.49;

function createNode(name: string, eastMetres: number, northMetres = 0, isUnderwater = false) {
	const node: WaypointNode = {
		name,
		lon: (eastMetres / 100) * DEGREES_PER_100_METRES,
		lat: (northMetres / 100) * DEGREES_PER_100_METRES,
		height: 0,
		isUnderwater
	};
	return node;
}

function connect(from: string, to: string) {
	return { from, to };
}

describe('WaypointGraph', () => {
	it('waży krawędzie poziomą odległością w metrach', () => {
		const network: WaypointNetwork = {
			nodes: [createNode('A', 0), createNode('B', 100)],
			edges: [connect('A', 'B')]
		};
		const graph = new WaypointGraph(network, projector);
		const [neighbour] = graph.listNeighbours(0);
		expect(neighbour.index).toBe(1);
		expect(neighbour.lengthMetres).toBeCloseTo(100, 0);
		expect(graph.listNeighbours(1)[0].index).toBe(0);
	});

	it('pomija punkty pod wodą i ich krawędzie', () => {
		const network: WaypointNetwork = {
			nodes: [createNode('A', 0), createNode('WET', 50, 0, true), createNode('B', 100)],
			edges: [connect('A', 'WET'), connect('WET', 'B'), connect('A', 'B')]
		};
		const graph = new WaypointGraph(network, projector);
		expect(graph.nodeCount).toBe(2);
		expect(graph.listNeighbours(0)).toHaveLength(1);
	});

	it('findNearestNode wybiera najbliższy punkt największej składowej', () => {
		const network: WaypointNetwork = {
			nodes: [
				createNode('A', 0),
				createNode('B', 100),
				createNode('C', 200),
				createNode('ISLAND', 1000)
			],
			edges: [connect('A', 'B'), connect('B', 'C')]
		};
		const graph = new WaypointGraph(network, projector);
		const nearest = graph.findNearestNode({ east: 990, north: 0, height: 0 });
		expect(nearest?.index).toBe(2);
		expect(nearest?.distanceMetres).toBeCloseTo(790, 0);
	});

	it('findNearestNode zwraca null dla pustego grafu', () => {
		const graph = new WaypointGraph({ nodes: [], edges: [] }, projector);
		expect(graph.findNearestNode({ east: 0, north: 0, height: 0 })).toBeNull();
	});
});
