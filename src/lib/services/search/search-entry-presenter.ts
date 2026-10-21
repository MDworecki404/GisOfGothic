import { describeCategory } from '#lib/data/category-names.js';
import { EncyclopediaLinkBuilder } from '#lib/services/encyclopedia/encyclopedia-link-builder.js';
import type {
	Place,
	PlaceKind,
	QuestPlaceRole,
	SearchEntry,
	SearchEntryType
} from '#lib/data/types.js';

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

export const QUEST_ROLE_PRESENTATION: Readonly<Record<QuestPlaceRole, PlaceKindPresentation>> = {
	giver: { label: 'Zleceniodawca', color: '#c9a24a' },
	target: { label: 'Cel questa', color: '#e0662f' },
	stage: { label: 'Miejsce etapu', color: '#8aa3a0' }
};

/** Kolor znacznika miejsca: questy barwi rola miejsca, pozostałe wpisy rodzaj miejsca. */
export function pickPlaceColor(place: Place): string {
	return place.role
		? QUEST_ROLE_PRESENTATION[place.role].color
		: PLACE_KIND_PRESENTATION[place.kind].color;
}

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
	/** Logiczna ścieżka podglądu 3D (np. `g2nk/khorinis/previews/x.glb`), nie adres pliku. */
	modelPath: string | null;
	facts: EntryFact[];
	encyclopediaUrl: string | null;
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
	private readonly encyclopediaLinkBuilder = new EncyclopediaLinkBuilder();

	presentResult(entry: SearchEntry): SearchResult {
		return {
			id: entry.id,
			type: entry.type,
			name: entry.name,
			categoryLabel: describeCategory(entry.category),
			summary: this.summarizeEntry(entry),
			markerColor: this.pickResultMarkerColor(entry)
		};
	}

	presentDetails(entry: SearchEntry, modelNamespace: string): SearchEntryDetails {
		return {
			id: entry.id,
			type: entry.type,
			name: entry.name,
			code: entry.code,
			categoryLabel: describeCategory(entry.category),
			modelPath: entry.model ? `${modelNamespace}/${entry.model}` : null,
			facts: this.listFacts(entry),
			encyclopediaUrl:
				entry.type !== 'item' ? this.encyclopediaLinkBuilder.buildSearchUrl(entry.name) : null,
			places: entry.places.map((place, index) => this.presentPlace(place, index))
		};
	}

	private pickResultMarkerColor(entry: SearchEntry): string {
		if (entry.type === 'item') return PLACE_KIND_PRESENTATION.ground.color;
		if (entry.type === 'quest') return QUEST_ROLE_PRESENTATION.giver.color;
		return '#c9a24a';
	}

	private summarizeEntry(entry: SearchEntry): string {
		if (entry.type === 'item') return `${entry.total ?? sumAmounts(entry.places)} szt.`;
		if (entry.type === 'quest') {
			return entry.chapter === undefined || entry.chapter === null ? '' : `rozdz. ${entry.chapter}`;
		}
		return entry.level === undefined ? '' : `poz. ${entry.level}`;
	}

	private listFacts(entry: SearchEntry): EntryFact[] {
		if (entry.type === 'item') return this.listItemFacts(entry);
		if (entry.type === 'quest') return this.listQuestFacts(entry);
		return this.listCharacterFacts(entry);
	}

	private listQuestFacts(entry: SearchEntry): EntryFact[] {
		const facts: EntryFact[] = [];
		if (entry.giver) facts.push({ label: 'zleceniodawca', value: entry.giver });
		if (entry.chapter !== undefined && entry.chapter !== null) {
			facts.push({ label: 'rozdział', value: String(entry.chapter) });
		}
		return facts;
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
		const presentation = place.role
			? QUEST_ROLE_PRESENTATION[place.role]
			: PLACE_KIND_PRESENTATION[place.kind];
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
