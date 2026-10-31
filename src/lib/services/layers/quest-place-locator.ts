import { parsePointFeatures, type PointFeature } from '#lib/data/layer-features.js';
import {
	parseRoutinePlaceProperties,
	type RoutinePlaceProperties
} from '#lib/data/routine-places.js';
import { isMinuteWithinInterval, parseTimeInterval } from '#lib/services/time/daily-schedule.js';

export interface RoutineLocation {
	lon: number;
	lat: number;
	h: number;
	waypoint: string;
}

const ROUTINE_FILE_NAME = 'character_places.geojson';
const NOON_MINUTE_OF_DAY = 12 * 60;

/**
 * Wskazuje, gdzie postać zwykle przebywa, na podstawie jej domyślnej rutyny dnia. Miejsce wstawienia postaci
 * do świata (`spawn`) bywa tylko punktem startowym, z którego postać idzie do swojego stałego miejsca,
 * więc dla questów lepiej pokazać miejsce z rutyny. Gdy rutyna ma kilka miejsc, wybieramy to aktywne w południe,
 * a gdy żadne nie obejmuje południa, pierwsze z listy.
 */
export class QuestPlaceLocator {
	private readonly placesByCharacterCode = new Map<
		string,
		PointFeature<RoutinePlaceProperties>[]
	>();

	constructor(routinePlaces: readonly PointFeature<RoutinePlaceProperties>[]) {
		for (const place of routinePlaces) {
			if (!place.properties.isDefaultRoutine) continue;
			const places = this.placesByCharacterCode.get(place.properties.characterCode) ?? [];
			places.push(place);
			this.placesByCharacterCode.set(place.properties.characterCode, places);
		}
	}

	static fromRoutinePlacesFile(json: unknown): QuestPlaceLocator {
		return new QuestPlaceLocator(
			parsePointFeatures(json, ROUTINE_FILE_NAME, parseRoutinePlaceProperties)
		);
	}

	locateUsualPlaceOf(characterCode: string): RoutineLocation | null {
		const places = this.placesByCharacterCode.get(characterCode);
		if (!places || places.length === 0) return null;
		const place = places.find((candidate) => this.isActiveAtNoon(candidate)) ?? places[0];
		return {
			lon: place.lon,
			lat: place.lat,
			h: place.h,
			waypoint: place.properties.waypoint
		};
	}

	private isActiveAtNoon(place: PointFeature<RoutinePlaceProperties>): boolean {
		return place.properties.timeRanges.some((range) => {
			const interval = parseTimeInterval(range);
			return interval !== null && isMinuteWithinInterval(NOON_MINUTE_OF_DAY, interval);
		});
	}
}
