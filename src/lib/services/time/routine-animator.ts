import type { GeodeticPoint } from '#lib/services/analysis/local-projector.js';
import { MINUTES_PER_DAY } from './daily-schedule.js';
import type { CharacterTimeline, RoutinePlace } from './character-timeline.js';
import type { WalkingLeg } from './routine-movement-planner.js';

export type CharacterActivity =
	| { kind: 'staying'; untilMinute: number | null }
	| { kind: 'walking'; from: RoutinePlace; to: RoutinePlace; arrivalMinute: number };

export interface CharacterFrame {
	place: RoutinePlace;
	position: GeodeticPoint;
	activity: CharacterActivity;
}

/** Postać z osią czasu; `legs[i]` to marsz do pobytu `i` z poprzedniego pobytu, a `null` oznacza skok bez drogi. */
export interface AnimatedCharacter {
	timeline: CharacterTimeline;
	legs: readonly (WalkingLeg | null)[];
}

/** Liczy, gdzie każda postać jest w danej minucie doby: stoi w miejscu rutyny albo idzie po drodze do kolejnego. */
export class RoutineAnimator {
	constructor(private readonly characters: readonly AnimatedCharacter[]) {}

	readFramesAt(minute: number): CharacterFrame[] {
		return this.characters.map((character) => this.readFrame(character, minute));
	}

	countCharactersWalkingOnRoads(): number {
		return this.characters.filter((character) => character.legs.some((leg) => leg !== null)).length;
	}

	countCharactersWithoutRoad(): number {
		return this.characters.filter(
			(character) =>
				character.timeline.stays.length > 1 && character.legs.every((leg) => leg === null)
		).length;
	}

	private readFrame(character: AnimatedCharacter, minute: number): CharacterFrame {
		const { stays } = character.timeline;
		const minuteOfDay = ((minute % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
		const stayIndex = character.timeline.findStayIndexAt(minuteOfDay);
		const stay = stays[stayIndex];
		const leg = character.legs[stayIndex] ?? null;
		const elapsedMinutes = (minuteOfDay - stay.startMinute + MINUTES_PER_DAY) % MINUTES_PER_DAY;
		if (leg && elapsedMinutes < leg.durationMinutes) {
			return {
				place: stay.place,
				position: leg.pointAtFraction(elapsedMinutes / leg.durationMinutes),
				activity: {
					kind: 'walking',
					from: stays[(stayIndex - 1 + stays.length) % stays.length].place,
					to: stay.place,
					arrivalMinute: stay.startMinute + leg.durationMinutes
				}
			};
		}
		return {
			place: stay.place,
			position: { lon: stay.place.lon, lat: stay.place.lat, h: stay.place.h },
			activity: {
				kind: 'staying',
				untilMinute: stay.startMinute === stay.endMinute ? null : stay.endMinute
			}
		};
	}
}
