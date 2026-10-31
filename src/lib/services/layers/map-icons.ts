export type MapIconId =
	| 'plant'
	| 'misc'
	| 'food'
	| 'ammo'
	| 'melee'
	| 'potion'
	| 'document'
	| 'rune'
	| 'ranged'
	| 'magic'
	| 'armor'
	| 'chest'
	| 'person'
	| 'quest';

/** Jeden element SVG ikony: nazwa znacznika i jego atrybuty (np. `['path', { d: '…' }]`). */
export type MapIconNode = readonly [string, Readonly<Record<string, string>>];

export interface IconLegendEntry {
	label: string;
	iconId: MapIconId;
	/** Kolor wpisu legendy, gdy różni się od koloru warstwy (np. role w warstwie questów). */
	color?: string;
}

const ICON_BY_ITEM_CATEGORY: ReadonlyMap<string, MapIconId> = new Map<string, MapIconId>([
	['Rośliny', 'plant'],
	['Jedzenie', 'food'],
	['Amunicja', 'ammo'],
	['Broń biała', 'melee'],
	['Mikstury', 'potion'],
	['Dokumenty', 'document'],
	['Runy i zwoje', 'rune'],
	['Broń dystansowa', 'ranged'],
	['Magia', 'magic'],
	['Pancerze', 'armor']
]);

export const ITEM_ICON_LEGEND: readonly IconLegendEntry[] = [
	...[...ICON_BY_ITEM_CATEGORY].map(([label, iconId]) => ({ label, iconId })),
	{ label: 'Różne', iconId: 'misc' }
];

/** Ikona przedmiotu na mapie wynika z jego kategorii; nieznana albo „Różne” dostaje worek rzeczy. */
export function pickItemIcon(category: string | null): MapIconId {
	return (category !== null ? ICON_BY_ITEM_CATEGORY.get(category) : undefined) ?? 'misc';
}
