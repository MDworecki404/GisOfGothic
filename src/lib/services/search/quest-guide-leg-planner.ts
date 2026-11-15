import type { QuestGuideStep } from './quest-guide-planner.js';

/** Odcinek trasy przewodnika między dwoma przystankami (numery od zera); przerywany, gdy dotyczy gałęzi alternatywnej. */
export interface QuestGuideLeg {
	fromIndex: number;
	toIndex: number;
	isAlternative: boolean;
}

/**
 * Układa odcinki trasy. Kolejne przystanki jednej grupy alternatywnej (`alternativeGroup`) to równoległe gałęzie:
 * każda dostaje własny odcinek od końca poprzedniego bloku, a następny blok zaczyna się od końca każdej z nich.
 * Dzięki temu trasa nie biegnie przez wszystkie gałęzie jedna po drugiej, choć wystarczy przejść jedną.
 */
export class QuestGuideLegPlanner {
	planLegs(steps: readonly QuestGuideStep[]): QuestGuideLeg[] {
		const legs: QuestGuideLeg[] = [];
		let previousEnds: number[] = [];
		let blockStart = 0;
		while (blockStart < steps.length) {
			const group = steps[blockStart].alternativeGroup;
			let blockEnd = blockStart + 1;
			while (
				group !== null &&
				blockEnd < steps.length &&
				steps[blockEnd].alternativeGroup === group
			) {
				blockEnd++;
			}
			const members = Array.from(
				{ length: blockEnd - blockStart },
				(_, offset) => blockStart + offset
			);
			for (const member of members) {
				for (const previousEnd of previousEnds) {
					legs.push({ fromIndex: previousEnd, toIndex: member, isAlternative: group !== null });
				}
			}
			previousEnds = members;
			blockStart = blockEnd;
		}
		return legs;
	}
}
