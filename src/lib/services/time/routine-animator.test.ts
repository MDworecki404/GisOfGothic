import { describe, expect, it } from 'vitest';
import { CharacterTimeline, type RoutinePlace } from './character-timeline.js';
import { RoutineAnimator, type AnimatedCharacter } from './routine-animator.js';
import { WalkingLeg } from './routine-movement-planner.js';

function createPlace(waypoint: string, timeRanges: string[], lon: number): RoutinePlace {
	return {
		lon,
		lat: 0,
		h: 0,
		properties: {
			id: waypoint,
			characterCode: 'NPC_TEST',
			characterName: 'Test',
			isDefaultRoutine: true,
			routineName: 'START',
			waypoint,
			timeRanges,
			actions: []
		}
	};
}

function createLeg(fromLon: number, toLon: number, durationMinutes: number): WalkingLeg {
	return new WalkingLeg(
		[
			{ lon: fromLon, lat: 0, h: 0 },
			{ lon: toLon, lat: 0, h: 0 }
		],
		[0, 100],
		100,
		durationMinutes
	);
}

function hours(hoursValue: number, minutes = 0): number {
	return hoursValue * 60 + minutes;
}

function createCharacter(places: RoutinePlace[], legs: (WalkingLeg | null)[]): AnimatedCharacter {
	const timeline = CharacterTimeline.build(places);
	if (!timeline) throw new Error('oczekiwano osi czasu');
	return { timeline, legs };
}

describe('RoutineAnimator', () => {
	it('postać z jednym pobytem stoi cały dzień', () => {
		const animator = new RoutineAnimator([
			createCharacter([createPlace('A', ['00:00–00:00'], 5)], [null])
		]);
		for (const minute of [0, hours(12), 1439]) {
			const [frame] = animator.readFramesAt(minute);
			expect(frame.position.lon).toBe(5);
			expect(frame.activity.kind).toBe('staying');
		}
	});

	it('marsz zaczyna się o początku pobytu, także przez północ', () => {
		const night = createPlace('NIGHT', ['22:00–07:00'], 2);
		const day = createPlace('DAY', ['07:00–22:00'], 1);
		const animator = new RoutineAnimator([
			createCharacter([night, day], [null, createLeg(1, 2, 300)])
		]);
		const [walking] = animator.readFramesAt(hours(22, 30));
		expect(walking.activity).toMatchObject({ kind: 'walking', arrivalMinute: hours(22) + 300 });
		expect(walking.position.lon).toBeCloseTo(1 + (30 / 300) * 1, 6);
		const [afterMidnight] = animator.readFramesAt(hours(1));
		expect(afterMidnight.activity.kind).toBe('walking');
		expect(afterMidnight.position.lon).toBeCloseTo(1 + (180 / 300) * 1, 6);
	});

	it('po przybyciu postać stoi w miejscu docelowym, a w marszu activity zna skąd i dokąd', () => {
		const night = createPlace('NIGHT', ['22:00–07:00'], 2);
		const day = createPlace('DAY', ['07:00–22:00'], 1);
		const animator = new RoutineAnimator([
			createCharacter([night, day], [null, createLeg(1, 2, 120)])
		]);
		const [walking] = animator.readFramesAt(hours(23));
		if (walking.activity.kind !== 'walking') throw new Error('oczekiwano marszu');
		expect(walking.activity.from.properties.waypoint).toBe('DAY');
		expect(walking.activity.to.properties.waypoint).toBe('NIGHT');
		const [arrived] = animator.readFramesAt(hours(1));
		expect(arrived.activity.kind).toBe('staying');
		expect(arrived.position.lon).toBe(2);
	});

	it('bez drogi postać pojawia się w nowym miejscu o godzinie przejścia', () => {
		const night = createPlace('NIGHT', ['22:00–07:00'], 2);
		const day = createPlace('DAY', ['07:00–22:00'], 1);
		const animator = new RoutineAnimator([createCharacter([night, day], [null, null])]);
		expect(animator.readFramesAt(hours(21, 59))[0].position.lon).toBe(1);
		expect(animator.readFramesAt(hours(22))[0].position.lon).toBe(2);
	});

	it('marsz dłuższy niż pobyt: następny pobyt zaczyna się od miejsca docelowego poprzedniego', () => {
		const short = createPlace('SHORT', ['08:00–08:20'], 1);
		const rest = createPlace('REST', ['08:20–08:00'], 2);
		const animator = new RoutineAnimator([
			createCharacter([short, rest], [createLeg(2, 1, 100), createLeg(1, 2, 120)])
		]);
		const [walkingToShort] = animator.readFramesAt(hours(8, 15));
		expect(walkingToShort.activity.kind).toBe('walking');
		const [walkingToRest] = animator.readFramesAt(hours(8, 25));
		expect(walkingToRest.position.lon).toBeCloseTo(1 + (5 / 120) * 1, 6);
	});

	it('liczy postacie z drogą i bez drogi, a postaci stojących nie liczy wcale', () => {
		const withRoad = createCharacter(
			[createPlace('N', ['22:00–07:00'], 2), createPlace('D', ['07:00–22:00'], 1)],
			[null, createLeg(1, 2, 60)]
		);
		const withoutRoad = createCharacter(
			[createPlace('N', ['22:00–07:00'], 4), createPlace('D', ['07:00–22:00'], 3)],
			[null, null]
		);
		const standing = createCharacter([createPlace('A', ['00:00–00:00'], 5)], [null]);
		const animator = new RoutineAnimator([withRoad, withoutRoad, standing]);
		expect(animator.countCharactersWalkingOnRoads()).toBe(1);
		expect(animator.countCharactersWithoutRoad()).toBe(1);
	});
});
