import { describe, expect, it } from 'vitest';
import { QuestPlaceLocator } from './quest-place-locator.js';

function routinePlace(
	characterCode: string,
	waypoint: string,
	lon: number,
	times: string[],
	isDefault = true
) {
	return {
		type: 'Feature',
		geometry: { type: 'Point', coordinates: [lon, 0.002, 12] },
		properties: {
			id: `${characterCode}:START:${waypoint}`,
			npc_code: characterCode,
			npc_name: characterCode,
			routine: 'START',
			is_default: isDefault,
			waypoint,
			times,
			actions: []
		}
	};
}

function createLocator() {
	return QuestPlaceLocator.fromRoutinePlacesFile({
		type: 'FeatureCollection',
		features: [
			routinePlace('PAL_200_HAGEN', 'NW_CITY_HAGEN', 0.001, ['08:00–20:00']),
			routinePlace('VLK_1_SLEEPER', 'NW_CITY_BED', 0.002, ['20:00–08:00']),
			routinePlace('VLK_1_SLEEPER', 'NW_CITY_MARKET', 0.003, ['08:00–20:00']),
			routinePlace('VLK_2_NIGHT', 'NW_CITY_GATE', 0.004, ['20:00–08:00']),
			routinePlace('VLK_3_QUEST', 'NW_CITY_QUEST', 0.005, ['08:00–20:00'], false)
		]
	});
}

describe('QuestPlaceLocator', () => {
	it('wskazuje miejsce z domyślnej rutyny postaci', () => {
		expect(createLocator().locateUsualPlaceOf('PAL_200_HAGEN')).toEqual({
			lon: 0.001,
			lat: 0.002,
			h: 12,
			waypoint: 'NW_CITY_HAGEN'
		});
	});

	it('przy kilku miejscach wybiera to, w którym postać jest w południe', () => {
		expect(createLocator().locateUsualPlaceOf('VLK_1_SLEEPER')?.waypoint).toBe('NW_CITY_MARKET');
	});

	it('gdy żadne miejsce nie obejmuje południa, bierze pierwsze', () => {
		expect(createLocator().locateUsualPlaceOf('VLK_2_NIGHT')?.waypoint).toBe('NW_CITY_GATE');
	});

	it('pomija rutyny niedomyślne i nieznane postacie', () => {
		const locator = createLocator();
		expect(locator.locateUsualPlaceOf('VLK_3_QUEST')).toBeNull();
		expect(locator.locateUsualPlaceOf('NIEZNANY')).toBeNull();
	});
});
