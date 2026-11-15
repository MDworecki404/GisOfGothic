import { describe, expect, it } from 'vitest';
import { QuestGuideLegPlanner } from './quest-guide-leg-planner.js';
import type { QuestGuideStep } from './quest-guide-planner.js';

function step(number: number, alternativeGroup: string | null): QuestGuideStep {
	return {
		number,
		placeLabel: `Miejsce ${number}`,
		texts: [],
		lon: number,
		lat: 0,
		h: 0,
		isApproximate: false,
		isAlternative: alternativeGroup !== null,
		alternativeGroup
	};
}

describe('QuestGuideLegPlanner', () => {
	const planner = new QuestGuideLegPlanner();

	it('łączy przystanki kolejno, gdy quest nie ma gałęzi', () => {
		expect(planner.planLegs([step(1, null), step(2, null), step(3, null)])).toEqual([
			{ fromIndex: 0, toIndex: 1, isAlternative: false },
			{ fromIndex: 1, toIndex: 2, isAlternative: false }
		]);
	});

	it('rozdziela gałęzie jednej grupy i zbiera je z powrotem w następnym przystanku', () => {
		const legs = planner.planLegs([step(1, null), step(2, 'a'), step(3, 'a'), step(4, null)]);
		expect(legs).toEqual([
			{ fromIndex: 0, toIndex: 1, isAlternative: true },
			{ fromIndex: 0, toIndex: 2, isAlternative: true },
			{ fromIndex: 1, toIndex: 3, isAlternative: false },
			{ fromIndex: 2, toIndex: 3, isAlternative: false }
		]);
	});

	it('traktuje różne grupy jako osobne bloki', () => {
		const legs = planner.planLegs([step(1, 'a'), step(2, 'b')]);
		expect(legs).toEqual([{ fromIndex: 0, toIndex: 1, isAlternative: true }]);
	});

	it('nie zwraca odcinków dla jednego przystanku', () => {
		expect(planner.planLegs([step(1, null)])).toEqual([]);
	});
});
