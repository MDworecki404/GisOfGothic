import type { QuestRecord, QuestStage } from '#lib/data/types.js';

/** Jeden przystanek przewodnika: miejsce na mapie i to, co dzieje się w nim w dzienniku. */
export interface QuestGuideStep {
	number: number;
	placeLabel: string;
	texts: string[];
	lon: number;
	lat: number;
	h: number;
	/** Miejsce wynika z domyślnej rutyny postaci, więc postać może stać gdzie indziej. */
	isApproximate: boolean;
	/** Przystanek należy do rozgałęzienia: wystarczy jedna z gałęzi. */
	isAlternative: boolean;
	/** Grupa wykluczających się gałęzi, do której należy przystanek; `null`, gdy nie jest alternatywą. */
	alternativeGroup: string | null;
}

const MINIMUM_STEPS_OF_GUIDE = 2;
const STATUS_TEXTS = {
	RUNNING: 'Quest rozpoczęty',
	SUCCESS: 'Quest ukończony',
	FAILED: 'Quest nieudany',
	OBSOLETE: 'Quest nieaktualny'
} as const;

function describeStage(stage: QuestStage): string | null {
	if (stage.text) return stage.text;
	return stage.status ? STATUS_TEXTS[stage.status] : null;
}

function isSamePosition(
	first: { lon: number; lat: number; h: number },
	second: { lon: number; lat: number; h: number }
): boolean {
	return first.lon === second.lon && first.lat === second.lat && first.h === second.h;
}

/**
 * Układa przystanki questa w kolejności wynikającej z zależności między etapami (`level`, potem `seq`).
 * Kolejne etapy w tym samym miejscu zlewają się w jeden przystanek. Quest, którego kolejność wynika tylko
 * ze skryptów (`order: 'script'`), nie ma przewodnika: trasa byłaby zgadywaniem.
 */
export class QuestGuidePlanner {
	planSteps(quest: QuestRecord): QuestGuideStep[] | null {
		if (quest.order !== 'dependency') return null;
		const placedStages = quest.stages
			.filter((stage) => stage.place !== null)
			.sort((first, second) => (first.level ?? 0) - (second.level ?? 0) || first.seq - second.seq);
		const steps: QuestGuideStep[] = [];
		for (const stage of placedStages) {
			const place = stage.place;
			if (!place) continue;
			const text = describeStage(stage);
			const previous = steps.at(-1);
			if (previous && isSamePosition(previous, place)) {
				if (text && !previous.texts.includes(text)) previous.texts.push(text);
				previous.isAlternative ||= stage.alternativeGroup !== null;
				previous.alternativeGroup ??= stage.alternativeGroup;
				continue;
			}
			steps.push({
				number: steps.length + 1,
				placeLabel: place.label,
				texts: text ? [text] : [],
				lon: place.lon,
				lat: place.lat,
				h: place.h,
				isApproximate: place.isDefaultRoutine,
				isAlternative: stage.alternativeGroup !== null,
				alternativeGroup: stage.alternativeGroup
			});
		}
		return steps.length >= MINIMUM_STEPS_OF_GUIDE ? steps : null;
	}
}
