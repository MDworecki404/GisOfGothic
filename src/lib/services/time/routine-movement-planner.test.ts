import { describe, expect, it } from 'vitest';
import type { WaypointNetwork, WaypointNode } from '#lib/data/types.js';
import { LocalProjector } from '#lib/services/analysis/local-projector.js';
import { RouteFinder } from '#lib/services/routing/route-finder.js';
import { RoutePlanner } from '#lib/services/routing/route-planner.js';
import { WaypointGraph } from '#lib/services/routing/waypoint-graph.js';
import type { RoutinePlace } from './character-timeline.js';
import { RoutineMovementPlanner } from './routine-movement-planner.js';

const DEGREES_PER_METRE = 1 / 111319.49;
const projector = new LocalProjector({ lon: 0, lat: 0, h: 0 });
const WALK_METRES_PER_SECOND = 1.43;

function createNode(name: string, eastMetres: number): WaypointNode {
	return { name, lon: eastMetres * DEGREES_PER_METRE, lat: 0, height: 0, isUnderwater: false };
}

function createPlace(eastMetres: number, northMetres = 0): RoutinePlace {
	return {
		lon: eastMetres * DEGREES_PER_METRE,
		lat: northMetres * DEGREES_PER_METRE,
		h: 0,
		properties: {
			id: `place-${eastMetres}-${northMetres}`,
			characterCode: 'NPC',
			characterName: 'Npc',
			isDefaultRoutine: true,
			routineName: 'START',
			waypoint: `WP_${eastMetres}`,
			timeRanges: [],
			actions: []
		}
	};
}

const roadNetwork: WaypointNetwork = {
	nodes: [createNode('A', 0), createNode('B', 100), createNode('C', 200)],
	edges: [
		{ from: 'A', to: 'B' },
		{ from: 'B', to: 'C' }
	]
};

function createMovementPlanner(): RoutineMovementPlanner {
	const routePlanner = new RoutePlanner(
		new WaypointGraph(roadNetwork, projector),
		new RouteFinder()
	);
	return new RoutineMovementPlanner(routePlanner, projector, WALK_METRES_PER_SECOND);
}

describe('RoutineMovementPlanner', () => {
	it('liczy czas marszu z prędkości bohatera w minutach gry', () => {
		const leg = createMovementPlanner().planLeg(createPlace(0), createPlace(143));
		if (!leg) throw new Error('oczekiwano odcinka marszu');
		expect(leg.totalMetres).toBeCloseTo(143, 0);
		expect(leg.durationMinutes).toBeCloseTo(25, 0);
	});

	it('pointAtFraction zwraca początek, koniec i środek drogi po długości', () => {
		const leg = createMovementPlanner().planLeg(createPlace(0), createPlace(143));
		if (!leg) throw new Error('oczekiwano odcinka marszu');
		expect(leg.pointAtFraction(0).lon).toBeCloseTo(0, 7);
		expect(leg.pointAtFraction(1).lon).toBeCloseTo(143 * DEGREES_PER_METRE, 7);
		expect(leg.pointAtFraction(0.5).lon).toBeCloseTo(71.5 * DEGREES_PER_METRE, 7);
		expect(leg.pointAtFraction(-3).lon).toBeCloseTo(0, 7);
		expect(leg.pointAtFraction(9).lon).toBeCloseTo(143 * DEGREES_PER_METRE, 7);
	});

	it('brak drogi daje null', () => {
		expect(createMovementPlanner().planLeg(createPlace(0), createPlace(0, 900))).toBeNull();
	});

	it('to samo miejsce daje null', () => {
		expect(createMovementPlanner().planLeg(createPlace(100), createPlace(100))).toBeNull();
	});
});
