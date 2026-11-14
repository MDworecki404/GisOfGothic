import { requireRecord } from './parsers.js';
import type { WaypointNetwork, WaypointNode } from './types.js';

const PARKED_WAYPOINT_NAME = 'TOT';
const NODE_ROW_LENGTH = 5;
const EDGE_ROW_LENGTH = 2;

function parseNodeRow(row: unknown, rowNumber: number): WaypointNode {
	const description = `waypoints.json: punkt ${rowNumber}`;
	if (!Array.isArray(row) || row.length !== NODE_ROW_LENGTH) {
		throw new Error(`${description}: oczekiwano wiersza [nazwa, lon, lat, wysokość, pod wodą]`);
	}
	const [name, lon, lat, height, underwaterFlag] = row;
	if (
		typeof name !== 'string' ||
		typeof lon !== 'number' ||
		typeof lat !== 'number' ||
		typeof height !== 'number' ||
		typeof underwaterFlag !== 'number' ||
		![lon, lat, height].every(Number.isFinite)
	) {
		throw new Error(`${description}: zły typ pola`);
	}
	return { name, lon, lat, height, isUnderwater: underwaterFlag === 1 };
}

function readEdgeIndexes(row: unknown, rowNumber: number, nodeCount: number): [number, number] {
	const description = `waypoints.json: krawędź ${rowNumber}`;
	if (!Array.isArray(row) || row.length !== EDGE_ROW_LENGTH) {
		throw new Error(`${description}: oczekiwano pary indeksów`);
	}
	const [first, second] = row;
	if (
		typeof first !== 'number' ||
		typeof second !== 'number' ||
		!Number.isInteger(first) ||
		!Number.isInteger(second) ||
		first < 0 ||
		second < 0 ||
		first >= nodeCount ||
		second >= nodeCount
	) {
		throw new Error(`${description}: indeks poza zakresem punktów`);
	}
	return [first, second];
}

/** Czyta zwarty `waypoints.json`; punkt `TOT` (miejsce odstawienia postaci) i jego krawędzie są pomijane. */
export function parseWaypointNetwork(json: unknown): WaypointNetwork {
	const record = requireRecord(json, 'waypoints.json');
	const { nodes: rawNodes, edges: rawEdges } = record;
	if (!Array.isArray(rawNodes)) throw new Error('waypoints.json: pole "nodes" musi być listą');
	if (!Array.isArray(rawEdges)) throw new Error('waypoints.json: pole "edges" musi być listą');

	const allNodes = rawNodes.map(parseNodeRow);
	const nodes = allNodes.filter((node) => node.name !== PARKED_WAYPOINT_NAME);
	const edges = rawEdges.flatMap((row, rowNumber) => {
		const [first, second] = readEdgeIndexes(row, rowNumber, allNodes.length);
		const from = allNodes[first].name;
		const to = allNodes[second].name;
		return from === PARKED_WAYPOINT_NAME || to === PARKED_WAYPOINT_NAME ? [] : [{ from, to }];
	});
	return { nodes, edges };
}
