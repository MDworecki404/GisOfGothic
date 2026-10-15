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
	| 'person';

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

/** Ikona przedmiotu na mapie wynika z jego kategorii; nieznana albo „Różne” dostaje worek rzeczy. */
export function pickItemIcon(category: string | null): MapIconId {
	return (category !== null ? ICON_BY_ITEM_CATEGORY.get(category) : undefined) ?? 'misc';
}
