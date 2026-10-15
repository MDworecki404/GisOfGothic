import { describeCategory } from '#lib/data/category-names.js';
import type { Place, PlaceKind, SearchEntry, SearchEntryType } from '#lib/data/types.js';

export interface PlaceKindPresentation {
	label: string;
	color: string;
}

export const PLACE_KIND_PRESENTATION: Readonly<Record<PlaceKind, PlaceKindPresentation>> = {
	ground: { label: 'Na ziemi', color: '#e0662f' },
	script: { label: 'Wstawiane skryptem', color: '#c9a24a' },
	container: { label: 'W skrzyni', color: '#8aa3a0' },
	npc: { label: 'U postaci', color: '#b07ad0' },
	spawn: { label: 'Pojawia się', color: '#c9a24a' },
	routine: { label: 'Rutyna dnia', color: '#e0662f' }
};

export interface SearchResult {
	id: string;
	type: SearchEntryType;
	name: string;
	categoryLabel: string;
	summary: string;
	markerColor: string;
}

export interface EntryFact {
	label: string;
	value: string;
}

export interface PlaceSummary {
	index: number;
	description: string;
	kindLabel: string;
	color: string;
	quantity: string | null;
	isUncertain: boolean;
}

export interface SearchEntryDetails {
	id: string;
	type: SearchEntryType;
	name: string;
	code: string;
	categoryLabel: string;
	modelUrl: string | null;
	facts: EntryFact[];
	places: PlaceSummary[];
}

function capitalize(text: string): string {
	return text.charAt(0).toLocaleUpperCase('pl-PL') + text.slice(1);
}

function sumAmounts(places: readonly Place[]): number {
	return places.reduce((sum, place) => sum + (place.amount ?? 1), 0);
}

/** Zamienia surowe wpisy indeksu na teksty i liczby gotowe do pokazania w UI. */
export class SearchEntryPresenter {
	presentResult(entry: SearchEntry): SearchResult {
		return {
			id: entry.id,
			type: entry.type,
			name: entry.name,
			categoryLabel: describeCategory(entry.category),
			summary: this.summarizeEntry(entry),
			markerColor: entry.type === 'item' ? PLACE_KIND_PRESENTATION.ground.color : '#c9a24a'
		};
	}

	presentDetails(entry: SearchEntry, modelsBaseUrl: string): SearchEntryDetails {
		return {
			id: entry.id,
			type: entry.type,
			name: entry.name,
			code: entry.code,
			categoryLabel: describeCategory(entry.category),
			modelUrl: entry.model ? `${modelsBaseUrl}/${entry.model}` : null,
			facts: entry.type === 'item' ? this.listItemFacts(entry) : this.listCharacterFacts(entry),
			places: entry.places.map((place, index) => this.presentPlace(place, index))
		};
	}

	private summarizeEntry(entry: SearchEntry): string {
		if (entry.type === 'item') return `${entry.total ?? sumAmounts(entry.places)} szt.`;
		return entry.level === undefined ? '' : `poz. ${entry.level}`;
	}

	private listItemFacts(entry: SearchEntry): EntryFact[] {
		const facts: EntryFact[] = [
			{ label: 'sztuk w świecie', value: String(entry.total ?? sumAmounts(entry.places)) }
		];
		const kinds: PlaceKind[] = ['ground', 'script', 'container', 'npc'];
		for (const kind of kinds) {
			const places = entry.places.filter((place) => place.kind === kind);
			if (places.length === 0) continue;
			facts.push({
				label: PLACE_KIND_PRESENTATION[kind].label.toLocaleLowerCase('pl-PL'),
				value: String(sumAmounts(places))
			});
		}
		return facts;
	}

	private listCharacterFacts(entry: SearchEntry): EntryFact[] {
		const facts: EntryFact[] = [];
		if (entry.level !== undefined) facts.push({ label: 'poziom', value: String(entry.level) });
		const routines = entry.places.filter((place) => place.kind === 'routine');
		if (routines.length > 0)
			facts.push({ label: 'miejsc w rutynie', value: String(routines.length) });
		return facts;
	}

	private presentPlace(place: Place, index: number): PlaceSummary {
		const presentation = PLACE_KIND_PRESENTATION[place.kind];
		return {
			index,
			description: capitalize(place.label),
			kindLabel: presentation.label,
			color: presentation.color,
			quantity: place.amount === undefined ? null : `${place.amount} szt.`,
			isUncertain: place.certainty === 'possible'
		};
	}
}
