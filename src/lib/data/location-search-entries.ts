import { LOCATION_KIND_LABELS } from './location-kinds.js';
import type { LocationEntry, SearchEntry } from './types.js';

/** Zamienia lokację na wpis wyszukiwarki: jedno miejsce w środku lokacji, kategoria to rodzaj lokacji. */
export function buildSearchEntryFromLocation(location: LocationEntry): SearchEntry {
	const kindLabel = LOCATION_KIND_LABELS[location.kind];
	return {
		id: location.id,
		type: 'location',
		code: location.code ?? location.id,
		name: location.name,
		category: kindLabel,
		location,
		places: [
			{
				kind: 'location',
				lon: location.center.lon,
				lat: location.center.lat,
				h: location.center.h,
				label: kindLabel,
				extent: { radiusMetres: location.radiusMetres, polygon: location.polygon }
			}
		]
	};
}
