import { describe, expect, it } from 'vitest';
import { CharacterNowPresenter } from './character-now-presenter.js';
import type { PlaceSummary } from './search-entry-presenter.js';

function buildRoutinePlace(timeRanges: string[], actions: string[]): PlaceSummary {
	return {
		index: 0,
		key: 'k',
		isCollectible: false,
		description: '',
		kindLabel: 'Rutyna dnia',
		color: '#000',
		quantity: null,
		isUncertain: false,
		isRandomLoot: false,
		routineSlot: { timeRanges, actions }
	};
}

describe('CharacterNowPresenter', () => {
	const presenter = new CharacterNowPresenter();
	const places = [
		buildRoutinePlace(['22:10–08:00'], ['TA_SLEEP']),
		buildRoutinePlace(['08:00–09:00', '10:00–22:10'], ['TA_RAKE_FP'])
	];

	it('opisuje czynność z przedziału obejmującego godzinę, także po północy', () => {
		expect(presenter.describeAt(places, 23 * 60)).toEqual({
			activity: 'śpi',
			timeRange: '22:10–08:00'
		});
		expect(presenter.describeAt(places, 12 * 60)?.activity).toBe('grabi');
	});

	it('zwraca null poza przedziałami i traktuje „cały dzień” jako brak ograniczenia', () => {
		expect(presenter.describeAt(places, 9 * 60 + 30)).toBeNull();
		const allDay = [buildRoutinePlace(['cały dzień'], [])];
		expect(presenter.describeAt(allDay, 3 * 60)).toEqual({
			activity: 'przebywa tutaj',
			timeRange: null
		});
	});
});
