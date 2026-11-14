import { describe, expect, it } from 'vitest';
import type { WaypointNetwork } from '#lib/data/types.js';
import { WorldRoutingContext } from './world-routing-context.js';

const anchor = { lon: 0, lat: 0, h: 0 };
const smallNetwork: WaypointNetwork = {
	nodes: [
		{ name: 'A', lon: 0, lat: 0, height: 0, isUnderwater: false },
		{ name: 'B', lon: 0.001, lat: 0, height: 0, isUnderwater: false }
	],
	edges: [{ from: 'A', to: 'B' }]
};

describe('WorldRoutingContext', () => {
	it('buduje planistę z sieci i pobiera ją tylko raz', async () => {
		let downloads = 0;
		const context = new WorldRoutingContext(async () => {
			downloads++;
			return smallNetwork;
		}, anchor);
		const first = await context.loadRoutePlanner();
		const second = await context.loadRoutePlanner();
		expect(first).not.toBeNull();
		expect(second).toBe(first);
		expect(downloads).toBe(1);
	});

	it('zwraca null dla świata bez sieci', async () => {
		const context = new WorldRoutingContext(async () => null, anchor);
		await expect(context.loadRoutePlanner()).resolves.toBeNull();
	});

	it('po błędzie pobierania próbuje ponownie przy następnym wywołaniu', async () => {
		let attempts = 0;
		const context = new WorldRoutingContext(async () => {
			attempts++;
			if (attempts === 1) throw new Error('brak sieci');
			return smallNetwork;
		}, anchor);
		await expect(context.loadRoutePlanner()).rejects.toThrow('brak sieci');
		await expect(context.loadRoutePlanner()).resolves.not.toBeNull();
	});

	it('przelicza lon/lat/h miejsca na pozycję w metrach od kotwicy', () => {
		const context = new WorldRoutingContext(async () => null, anchor);
		const position = context.convertToWorldPosition(0.001, 0, 12);
		expect(position.east).toBeCloseTo(111.3, 0);
		expect(position.north).toBeCloseTo(0, 1);
		expect(position.height).toBeCloseTo(12, 1);
		expect(position.lon).toBe(0.001);
	});
});
