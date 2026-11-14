import type { PointFeature } from '#lib/data/layer-features.js';
import type { RoutinePlaceProperties } from '#lib/data/routine-places.js';
import {
	MINUTES_PER_DAY,
	isMinuteWithinInterval,
	parseTimeInterval,
	type TimeInterval
} from './daily-schedule.js';

export type RoutinePlace = PointFeature<RoutinePlaceProperties>;

/** Pobyt w jednym miejscu: od `startMinute` (włącznie) do `endMinute` (wyłącznie); koniec przed początkiem oznacza przejście przez północ, a równe wartości całą dobę. */
export interface RoutineStay {
	startMinute: number;
	endMinute: number;
	place: RoutinePlace;
}

interface PlaceInterval {
	place: RoutinePlace;
	interval: TimeInterval;
}

const NO_PLACE = -1;

function buildPlaceKey(place: RoutinePlace): string {
	return `${place.lon},${place.lat},${place.h}`;
}

function measureMinutesSinceStart(minute: number, interval: TimeInterval): number {
	return (minute - interval.startMinute + MINUTES_PER_DAY) % MINUTES_PER_DAY;
}

/**
 * Doba postaci jako ciąg pobytów bez luk i nakładania. Minuta objęta kilkoma przedziałami należy do pobytu
 * o najpóźniejszym początku, a minuta bez żadnego przedziału zostaje przy ostatnim znanym miejscu.
 */
export class CharacterTimeline {
	private constructor(readonly stays: readonly RoutineStay[]) {}

	static build(places: readonly RoutinePlace[]): CharacterTimeline | null {
		const candidates: PlaceInterval[] = places.flatMap((place) =>
			place.properties.timeRanges.flatMap((range) => {
				const interval = parseTimeInterval(range);
				return interval ? [{ place, interval }] : [];
			})
		);
		if (candidates.length === 0) return null;
		const placeOfMinute = CharacterTimeline.choosePlaceOfEveryMinute(candidates);
		return new CharacterTimeline(CharacterTimeline.joinMinutesIntoStays(placeOfMinute));
	}

	findStayIndexAt(minute: number): number {
		const minuteOfDay =
			((Math.floor(minute) % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
		let found = this.stays.length - 1;
		for (let index = 0; index < this.stays.length; index++) {
			if (this.stays[index].startMinute <= minuteOfDay) found = index;
		}
		return found;
	}

	private static choosePlaceOfEveryMinute(candidates: readonly PlaceInterval[]): RoutinePlace[] {
		const chosen: (RoutinePlace | null)[] = [];
		for (let minute = 0; minute < MINUTES_PER_DAY; minute++) {
			let best: PlaceInterval | null = null;
			let bestDistance = Number.POSITIVE_INFINITY;
			for (const candidate of candidates) {
				if (!isMinuteWithinInterval(minute, candidate.interval)) continue;
				const distance = measureMinutesSinceStart(minute, candidate.interval);
				if (distance < bestDistance) {
					best = candidate;
					bestDistance = distance;
				}
			}
			chosen.push(best ? best.place : null);
		}
		const firstCovered = chosen.findIndex((place) => place !== null);
		for (let offset = 1; offset < MINUTES_PER_DAY; offset++) {
			const minute = (firstCovered + offset) % MINUTES_PER_DAY;
			if (chosen[minute] === null)
				chosen[minute] = chosen[(minute - 1 + MINUTES_PER_DAY) % MINUTES_PER_DAY];
		}
		return chosen.flatMap((place) => (place ? [place] : []));
	}

	private static joinMinutesIntoStays(placeOfMinute: readonly RoutinePlace[]): RoutineStay[] {
		const keys = placeOfMinute.map(buildPlaceKey);
		const firstBoundary = keys.findIndex(
			(key, minute) => key !== keys[(minute - 1 + MINUTES_PER_DAY) % MINUTES_PER_DAY]
		);
		if (firstBoundary === NO_PLACE) {
			return [{ startMinute: 0, endMinute: 0, place: placeOfMinute[0] }];
		}
		const stays: RoutineStay[] = [];
		let runStart = firstBoundary;
		for (let offset = 1; offset <= MINUTES_PER_DAY; offset++) {
			const minute = (firstBoundary + offset) % MINUTES_PER_DAY;
			if (
				offset === MINUTES_PER_DAY ||
				keys[minute] !== keys[(minute - 1 + MINUTES_PER_DAY) % MINUTES_PER_DAY]
			) {
				stays.push({ startMinute: runStart, endMinute: minute, place: placeOfMinute[runStart] });
				runStart = minute;
			}
		}
		return stays.sort((first, second) => first.startMinute - second.startMinute);
	}
}
