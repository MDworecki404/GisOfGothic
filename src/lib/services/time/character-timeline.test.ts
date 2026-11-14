import { describe, expect, it } from 'vitest';
import type { PointFeature } from '#lib/data/layer-features.js';
import type { RoutinePlaceProperties } from '#lib/data/routine-places.js';
import { CharacterTimeline } from './character-timeline.js';

type RoutinePlace = PointFeature<RoutinePlaceProperties>;

function createPlace(id: string, timeRanges: string[], lon = 0, lat = 0): RoutinePlace {
	return {
		lon,
		lat,
		h: 0,
		properties: {
			id,
			characterCode: 'NPC_TEST',
			characterName: 'Test',
			isDefaultRoutine: true,
			routineName: 'START',
			waypoint: id,
			timeRanges,
			actions: []
		}
	};
}

function minute(hours: number, minutes = 0): number {
	return hours * 60 + minutes;
}

function readWaypoints(timeline: CharacterTimeline): string[] {
	return timeline.stays.map((stay) => stay.place.properties.waypoint);
}

describe('CharacterTimeline', () => {
	it('jedno miejsce całą dobę daje jeden pobyt', () => {
		const timeline = CharacterTimeline.build([createPlace('A', ['00:00–00:00'])]);
		expect(timeline?.stays).toEqual([expect.objectContaining({ startMinute: 0, endMinute: 0 })]);
		expect(timeline?.findStayIndexAt(minute(13, 5))).toBe(0);
	});

	it('przedział, w którym początek równa się końcowi, to cała doba', () => {
		const timeline = CharacterTimeline.build([createPlace('A', ['08:00–08:00'])]);
		expect(timeline?.stays).toHaveLength(1);
		expect(timeline?.findStayIndexAt(minute(3))).toBe(0);
	});

	it('dwa miejsca dzielą dobę, a pobyt przez północ ma koniec przed początkiem', () => {
		const timeline = CharacterTimeline.build([
			createPlace('DAY', ['07:20–01:20'], 1),
			createPlace('NIGHT', ['01:20–07:20'], 2)
		]);
		if (!timeline) throw new Error('oczekiwano osi czasu');
		expect(readWaypoints(timeline)).toEqual(['NIGHT', 'DAY']);
		expect(timeline.stays[0]).toMatchObject({
			startMinute: minute(1, 20),
			endMinute: minute(7, 20)
		});
		expect(timeline.stays[1]).toMatchObject({
			startMinute: minute(7, 20),
			endMinute: minute(1, 20)
		});
		expect(timeline.findStayIndexAt(0)).toBe(1);
		expect(timeline.findStayIndexAt(minute(1, 19))).toBe(1);
		expect(timeline.findStayIndexAt(minute(1, 20))).toBe(0);
		expect(timeline.findStayIndexAt(minute(7, 19))).toBe(0);
		expect(timeline.findStayIndexAt(minute(7, 20))).toBe(1);
		expect(timeline.findStayIndexAt(1439)).toBe(1);
	});

	it('luka zostawia postać w ostatnim miejscu do początku następnego pobytu', () => {
		const timeline = CharacterTimeline.build([
			createPlace('A', ['08:00–10:00'], 1),
			createPlace('B', ['12:00–14:00'], 2)
		]);
		if (!timeline) throw new Error('oczekiwano osi czasu');
		expect(timeline.stays[0]).toMatchObject({ startMinute: minute(8), endMinute: minute(12) });
		expect(timeline.stays[1]).toMatchObject({ startMinute: minute(12), endMinute: minute(8) });
		expect(timeline.findStayIndexAt(minute(11))).toBe(0);
		expect(timeline.findStayIndexAt(minute(3))).toBe(1);
	});

	it('nakładanie wygrywa pobyt o późniejszym początku', () => {
		const timeline = CharacterTimeline.build([
			createPlace('A', ['08:00–12:00'], 1),
			createPlace('B', ['10:00–14:00'], 2)
		]);
		if (!timeline) throw new Error('oczekiwano osi czasu');
		expect(readWaypoints(timeline)).toEqual(['A', 'B']);
		expect(timeline.stays[0]).toMatchObject({ startMinute: minute(8), endMinute: minute(10) });
	});

	it('sąsiednie przedziały tego samego miejsca łączą się w jeden pobyt', () => {
		const timeline = CharacterTimeline.build([createPlace('A', ['06:00–12:00', '12:00–06:00'], 1)]);
		expect(timeline?.stays).toHaveLength(1);
	});

	it('brak parsowalnych przedziałów albo miejsc zwraca null', () => {
		expect(CharacterTimeline.build([])).toBeNull();
		expect(CharacterTimeline.build([createPlace('A', ['kiedyś'])])).toBeNull();
		expect(CharacterTimeline.build([createPlace('A', [])])).toBeNull();
	});
});
