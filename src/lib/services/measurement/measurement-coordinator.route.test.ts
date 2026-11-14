import { describe, expect, it } from 'vitest';
import type { AppEvent } from '#lib/events/app-events.js';
import { EventBus } from '#lib/events/event-bus.js';
import type { WaypointNetwork, WaypointNode } from '#lib/data/types.js';
import { LocalProjector } from '#lib/services/analysis/local-projector.js';
import type { WorldPosition } from '#lib/services/geodesy/world-frame.js';
import { RouteFinder } from '#lib/services/routing/route-finder.js';
import { RoutePlanner } from '#lib/services/routing/route-planner.js';
import { WaypointGraph } from '#lib/services/routing/waypoint-graph.js';
import {
	MeasurementCoordinator,
	type MeasurementDisplay,
	type MeasurementView
} from './measurement-coordinator.js';
import type { LocalPoint } from './measurement-calculator.js';

const DEGREES_PER_METRE = 1 / 111319.49;

function node(name: string, eastMetres: number): WaypointNode {
	return { name, lon: eastMetres * DEGREES_PER_METRE, lat: 0, height: 0, isUnderwater: false };
}

function createPlanner(): RoutePlanner {
	const network: WaypointNetwork = {
		nodes: [node('A', 0), node('B', 100), node('C', 200)],
		edges: [
			{ from: 'A', to: 'B' },
			{ from: 'B', to: 'C' }
		]
	};
	return new RoutePlanner(
		new WaypointGraph(network, new LocalProjector({ lon: 0, lat: 0, h: 0 })),
		new RouteFinder()
	);
}

function at(east: number, north = 0): WorldPosition {
	return { east, north, height: 0, lon: 0, lat: 0 };
}

interface DisplayCall {
	vertices: readonly LocalPoint[];
	linePath: readonly LocalPoint[];
}

function createFixture() {
	const eventBus = new EventBus<AppEvent>();
	let latest: MeasurementView | null = null;
	eventBus.subscribe('measurement-changed', (event) => {
		latest = event.measurement;
	});
	const calls: DisplayCall[] = [];
	const display: MeasurementDisplay = {
		showMeasurement: (vertices, linePath) => calls.push({ vertices, linePath }),
		clearMeasurement: () => calls.push({ vertices: [], linePath: [] }),
		sampleTerrainUnder: async (points) => [...points]
	};
	const coordinator = new MeasurementCoordinator(eventBus, () => display);
	coordinator.useMovementSpeeds({ walk: 1.43, run: 3.45, sneak: 0.77, walkArmed: 1.95 });
	return { coordinator, calls, view: () => latest };
}

function settle(): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, 0));
}

async function openRouteMode(source: () => Promise<RoutePlanner | null>) {
	const fixture = createFixture();
	fixture.coordinator.useRoutePlannerSource(source);
	fixture.coordinator.switchMode('route');
	await settle();
	return fixture;
}

describe('MeasurementCoordinator: tryb trasy', () => {
	it('pierwsze kliknięcie ustawia start, drugie cel, trzecie zaczyna od nowa', async () => {
		const { coordinator, view } = await openRouteMode(async () => createPlanner());
		coordinator.addPoint(at(0, 5));
		expect(view()?.route).toMatchObject({ hasStart: true, hasEnd: false });
		coordinator.addPoint(at(200, 5));
		await settle();
		expect(view()?.route).toMatchObject({ hasStart: true, hasEnd: true, outcome: 'found' });
		coordinator.addPoint(at(100, 5));
		expect(view()?.route).toMatchObject({ hasStart: true, hasEnd: false, outcome: 'none' });
	});

	it('trasa znaleziona pokazuje markery i linię oraz czasy przejścia', async () => {
		const { coordinator, calls, view } = await openRouteMode(async () => createPlanner());
		coordinator.addPoint(at(0, 5));
		coordinator.addPoint(at(200, 5));
		await settle();
		const lastCall = calls[calls.length - 1];
		expect(lastCall.vertices).toHaveLength(2);
		expect(lastCall.linePath.length).toBeGreaterThanOrEqual(5);
		expect(view()?.summary?.horizontalMetres).toBeCloseTo(210, 0);
		expect(view()?.travelTimes.length).toBeGreaterThan(0);
		expect(view()?.route?.startApproachMetres).toBeCloseTo(5, 0);
	});

	it('źródło zwracające null daje availability unavailable', async () => {
		const { view } = await openRouteMode(async () => null);
		expect(view()?.route?.availability).toBe('unavailable');
	});

	it('źródło, które rzuca błąd, daje availability unavailable', async () => {
		const { view } = await openRouteMode(async () => {
			throw new Error('sieć niedostępna');
		});
		expect(view()?.route?.availability).toBe('unavailable');
	});

	it('wynik ładowania sieci po zmianie źródła jest pomijany', async () => {
		const fixture = createFixture();
		let finishOldLoading: (planner: RoutePlanner | null) => void = () => undefined;
		fixture.coordinator.useRoutePlannerSource(
			() => new Promise<RoutePlanner | null>((resolve) => (finishOldLoading = resolve))
		);
		fixture.coordinator.switchMode('route');
		fixture.coordinator.useRoutePlannerSource(null);
		finishOldLoading(createPlanner());
		await settle();
		expect(fixture.view()?.route?.availability).toBe('unavailable');
	});

	it('setRouteEnd zachowuje start', async () => {
		const { coordinator, view } = await openRouteMode(async () => createPlanner());
		coordinator.addPoint(at(0, 5));
		coordinator.setRouteEnd(at(200, 5));
		await settle();
		expect(view()?.route).toMatchObject({ hasStart: true, hasEnd: true, outcome: 'found' });
	});

	it('swapRouteEndpoints zamienia start z celem', async () => {
		const { coordinator, calls } = await openRouteMode(async () => createPlanner());
		coordinator.addPoint(at(0, 5));
		coordinator.addPoint(at(200, 5));
		await settle();
		coordinator.swapRouteEndpoints();
		await settle();
		const markers = calls[calls.length - 1].vertices;
		expect(markers[0].east).toBe(200);
		expect(markers[1].east).toBe(0);
	});

	it('too-far-from-network nie rysuje linii', async () => {
		const { coordinator, calls, view } = await openRouteMode(async () => createPlanner());
		coordinator.addPoint(at(0, 5));
		coordinator.addPoint(at(200, 900));
		await settle();
		expect(view()?.route?.outcome).toBe('too-far-from-network');
		expect(calls[calls.length - 1].linePath).toHaveLength(0);
	});

	it('openRouteMode nie gubi startu, gdy tryb trasy już jest włączony', async () => {
		const { coordinator, view } = await openRouteMode(async () => createPlanner());
		coordinator.addPoint(at(0, 5));
		coordinator.openRouteMode();
		expect(view()?.route?.hasStart).toBe(true);
	});

	it('openRouteMode włącza tryb trasy z innego trybu', async () => {
		const fixture = createFixture();
		fixture.coordinator.useRoutePlannerSource(async () => createPlanner());
		fixture.coordinator.openRouteMode();
		await settle();
		expect(fixture.view()?.mode).toBe('route');
	});

	it('kliknięcie po ustawieniu samego celu ustawia początek i zachowuje cel', async () => {
		const { coordinator, calls, view } = await openRouteMode(async () => createPlanner());
		coordinator.setRouteEnd(at(200, 5));
		expect(view()?.route).toMatchObject({ hasStart: false, hasEnd: true });
		coordinator.addPoint(at(0, 5));
		await settle();
		expect(view()?.route).toMatchObject({ hasStart: true, hasEnd: true, outcome: 'found' });
		expect(calls[calls.length - 1].vertices[1].east).toBe(200);
	});
});
