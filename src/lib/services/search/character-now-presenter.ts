import { describeRoutineAction } from '#lib/data/routine-places.js';
import { isMinuteWithinInterval, parseTimeInterval } from '#lib/services/time/daily-schedule.js';
import type { PlaceSummary } from './search-entry-presenter.js';

export interface CharacterNow {
	activity: string;
	timeRange: string | null;
}

const WHOLE_DAY_PATTERN = /ca.y dzie./i;

/** Opisuje, co postać robi o danej godzinie, na podstawie miejsc jej domyślnej rutyny. */
export class CharacterNowPresenter {
	describeAt(places: readonly PlaceSummary[], minuteOfDay: number): CharacterNow | null {
		for (const place of places) {
			if (place.routineSlot === null) continue;
			const matchingRange = place.routineSlot.timeRanges.find((range) =>
				this.isMinuteWithinRange(minuteOfDay, range)
			);
			if (matchingRange === undefined) continue;
			return {
				activity: this.describeActions(place.routineSlot.actions),
				timeRange: WHOLE_DAY_PATTERN.test(matchingRange) ? null : matchingRange
			};
		}
		return null;
	}

	hasRoutine(places: readonly PlaceSummary[]): boolean {
		return places.some((place) => place.routineSlot !== null);
	}

	private isMinuteWithinRange(minuteOfDay: number, range: string): boolean {
		if (WHOLE_DAY_PATTERN.test(range)) return true;
		const interval = parseTimeInterval(range);
		return interval !== null && isMinuteWithinInterval(minuteOfDay, interval);
	}

	private describeActions(actions: readonly string[]): string {
		const descriptions = [...new Set(actions.map(describeRoutineAction))];
		return descriptions.length > 0 ? descriptions.join(', ') : 'przebywa tutaj';
	}
}
