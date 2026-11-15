import type { LocationKind } from './types.js';

export const LOCATION_KIND_LABELS: Readonly<Record<LocationKind, string>> = {
	camp: 'Obóz',
	town: 'Miasto lub osada',
	district: 'Dzielnica',
	building: 'Budynek',
	cave: 'Jaskinia lub loch',
	region: 'Region',
	landmark: 'Punkt orientacyjny',
	passage: 'Przejście do innego świata'
};

export const LOCATION_NAME_SOURCE_NOTES = {
	game: null,
	derived: 'robocza, nadana w projekcie',
	code: 'tylko kod z gry'
} as const;
