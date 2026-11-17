import type { Category } from './types.js';

export interface CategoryDefinition {
	id: Category;
	label: string;
	labelPlural: string;
	colorVariable: string;
}

export const CATEGORY_DEFINITIONS: readonly CategoryDefinition[] = [
	{ id: 'location', label: 'Lokacja', labelPlural: 'Lokacje', colorVariable: '--kat-lokacja' },
	{ id: 'character', label: 'Postać', labelPlural: 'Postacie', colorVariable: '--kat-postac' },
	{ id: 'item', label: 'Przedmiot', labelPlural: 'Przedmioty', colorVariable: '--kat-przedmiot' },
	{ id: 'monster', label: 'Potwór', labelPlural: 'Potwory', colorVariable: '--kat-potwor' },
	{ id: 'quest', label: 'Zadanie', labelPlural: 'Zadania', colorVariable: '--kat-quest' }
];

export function findCategoryDefinition(category: Category): CategoryDefinition {
	return (
		CATEGORY_DEFINITIONS.find((definition) => definition.id === category) ?? CATEGORY_DEFINITIONS[0]
	);
}
