import { describe, expect, it } from 'vitest';
import type { QuestRecord, QuestStage, QuestStagePlace } from '#lib/data/types.js';
import { QuestGuidePlanner } from './quest-guide-planner.js';

function place(label: string, lon: number): QuestStagePlace {
	return { lon, lat: 0, h: 0, label, waypoint: null, isDefaultRoutine: false };
}

function stage(
	seq: number,
	level: number,
	stagePlace: QuestStagePlace | null,
	text: string
): QuestStage {
	return {
		seq,
		kind: 'entry',
		text,
		status: null,
		chapter: null,
		isConditional: false,
		requires: [],
		level,
		alternativeGroup: null,
		place: stagePlace
	};
}

function quest(order: QuestRecord['order'], stages: QuestStage[]): QuestRecord {
	return {
		id: 'quest:X',
		order,
		name: 'Test',
		section: 'mission',
		chapter: null,
		giver: null,
		giverCandidates: [],
		stages,
		people: [],
		items: [],
		experiencePoints: null
	};
}

describe('QuestGuidePlanner', () => {
	const planner = new QuestGuidePlanner();

	it('układa przystanki według poziomu zależności, nie numeru etapu', () => {
		const steps = planner.planSteps(
			quest('dependency', [
				stage(1, 2, place('Nagur', 3), 'trzeci'),
				stage(2, 0, place('Akil', 1), 'pierwszy'),
				stage(3, 1, place('Baltram', 2), 'drugi')
			])
		);
		expect(steps?.map((step) => step.placeLabel)).toEqual(['Akil', 'Baltram', 'Nagur']);
		expect(steps?.map((step) => step.number)).toEqual([1, 2, 3]);
	});

	it('zlewa kolejne etapy w tym samym miejscu w jeden przystanek', () => {
		const steps = planner.planSteps(
			quest('dependency', [
				stage(1, 0, place('Akil', 1), 'a'),
				stage(2, 1, place('Akil', 1), 'b'),
				stage(3, 2, place('Nagur', 2), 'c')
			])
		);
		expect(steps).toHaveLength(2);
		expect(steps?.[0]?.texts).toEqual(['a', 'b']);
	});

	it('nie planuje przewodnika, gdy kolejność wynika tylko ze skryptów', () => {
		expect(
			planner.planSteps(
				quest('script', [stage(1, 0, place('A', 1), 'a'), stage(2, 1, place('B', 2), 'b')])
			)
		).toBeNull();
	});

	it('nie planuje przewodnika z jednego przystanku ani z etapów bez miejsca', () => {
		expect(planner.planSteps(quest('dependency', [stage(1, 0, place('A', 1), 'a')]))).toBeNull();
		expect(
			planner.planSteps(quest('dependency', [stage(1, 0, null, 'a'), stage(2, 1, null, 'b')]))
		).toBeNull();
	});
});
