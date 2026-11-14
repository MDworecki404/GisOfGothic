import { describe, expect, it } from 'vitest';
import { parseWaypointNetwork } from './waypoint-network-parser.js';

const networkJson = {
	version: 1,
	game: 'g2nk',
	world: 'NEWWORLD',
	nodes: [
		['A', 0.001, 0.002, 12.5, 0],
		['B', 0.0011, 0.002, 13, 1],
		['TOT', 0.5, 0.5, 0, 0]
	],
	edges: [
		[0, 1],
		[1, 2]
	]
};

describe('parseWaypointNetwork', () => {
	it('czyta punkty i krawędzie ze zwartego pliku', () => {
		const network = parseWaypointNetwork({ ...networkJson, nodes: [], edges: [] });
		expect(network).toEqual({ nodes: [], edges: [] });

		const filled = parseWaypointNetwork({
			...networkJson,
			nodes: networkJson.nodes.slice(0, 2),
			edges: [[0, 1]]
		});
		expect(filled.nodes[0]).toEqual({
			name: 'A',
			lon: 0.001,
			lat: 0.002,
			height: 12.5,
			isUnderwater: false
		});
		expect(filled.nodes[1].isUnderwater).toBe(true);
		expect(filled.edges).toEqual([{ from: 'A', to: 'B' }]);
	});

	it('pomija punkt TOT i krawędzie, które go dotyczą', () => {
		const network = parseWaypointNetwork(networkJson);
		expect(network.nodes.map((node) => node.name)).toEqual(['A', 'B']);
		expect(network.edges).toEqual([{ from: 'A', to: 'B' }]);
	});

	it('odrzuca krawędź z indeksem spoza zakresu', () => {
		expect(() => parseWaypointNetwork({ ...networkJson, edges: [[0, 7]] })).toThrow(/krawędź/);
	});

	it('odrzuca wiersz punktu o złym kształcie', () => {
		expect(() => parseWaypointNetwork({ ...networkJson, nodes: [['A', 'x', 0, 0, 0]] })).toThrow(
			/punkt/
		);
	});

	it('odrzuca plik bez nodes i edges', () => {
		expect(() => parseWaypointNetwork({ version: 1 })).toThrow(/nodes/);
	});
});
