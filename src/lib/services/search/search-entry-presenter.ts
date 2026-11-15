import { LOCATION_NAME_SOURCE_NOTES } from '#lib/data/location-kinds.js';
import { describeCategory } from '#lib/data/category-names.js';
import { buildPlaceKey, isCollectiblePlace } from '#lib/data/place-key.js';
import { LootPresenter } from '#lib/services/loot/loot-presenter.js';
import { EncyclopediaLinkBuilder } from '#lib/services/encyclopedia/encyclopedia-link-builder.js';
import type {
	PassageDestination,
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
	routine: { label: 'Rutyna dnia', color: '#e0662f' },
	location: { label: 'Lokacja', color: '#6fb7c9' }
};

export const QUEST_ROLE_PRESENTATION: Readonly<Record<QuestPlaceRole, PlaceKindPresentation>> = {
	giver: { label: 'Zleceniodawca', color: '#c9a24a' },
	target: { label: 'Cel questa', color: '#e0662f' },
	stage: { label: 'Miejsce etapu', color: '#8aa3a0' }
};

/** Miejsca, w których przedmiot tylko może się wylosować (Gothic 3), mają osobny, przygaszony kolor. */
export const RANDOM_LOOT_COLOR = '#7d8f6a';

/** Kolor znacznika miejsca: łup losowy ma własny, questy barwi rola miejsca, pozostałe wpisy rodzaj miejsca. */
export function pickPlaceColor(place: Place): string {
	if (place.set) return RANDOM_LOOT_COLOR;
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
	/** Stały klucz miejsca (`buildPlaceKey`), pod którym zapisuje się odhaczenie. */
	key: string;
	/** Przedmiot można odhaczyć jako zebrany w tym miejscu; losowy łup i miejsca innych wpisów nie. */
	isCollectible: boolean;
	description: string;
	kindLabel: string;
	color: string;
	quantity: string | null;
	isUncertain: boolean;
	/** Miejsce zestawu losowego łupu: przedmiot może się tu wylosować, ale nie musi. */
	isRandomLoot: boolean;
	/** Miejsce domyślnej rutyny postaci: przedziały godzin i czynności z gry; inne miejsca mają `null`. */
	routineSlot: RoutineSlot | null;
}

export interface RoutineSlot {
	timeRanges: string[];
	actions: string[];
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
	/** Gothic 3: skąd przedmiot może wypaść z losowego łupu. */
	lootSources: string[];
	encyclopediaUrl: string | null;
	places: PlaceSummary[];
	/** Lokacje: przejście do innego świata w paczce; inne wpisy mają `null`. */
	passage: PassageDestination | null;
}

function capitalize(text: string): string {
	return text.charAt(0).toLocaleUpperCase('pl-PL') + text.slice(1);
}

function sumAmounts(places: readonly Place[]): number {
	return places.filter((place) => !place.set).reduce((sum, place) => sum + (place.amount ?? 1), 0);
}

/** Zamienia surowe wpisy indeksu na teksty i liczby gotowe do pokazania w UI. */
export class SearchEntryPresenter {
	private readonly encyclopediaLinkBuilder = new EncyclopediaLinkBuilder();
	private readonly lootPresenter = new LootPresenter();

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
			lootSources: this.lootPresenter.describeLootSources(entry.loot ?? []),
			encyclopediaUrl:
				entry.type !== 'item' && entry.type !== 'location'
					? this.encyclopediaLinkBuilder.buildSearchUrl(entry.name)
					: null,
			places: entry.places.map((place, index) =>
				this.presentPlace(place, index, entry.type === 'item')
			),
			passage: this.readPassage(entry)
		};
	}

	private pickResultMarkerColor(entry: SearchEntry): string {
		if (entry.type === 'item') return PLACE_KIND_PRESENTATION.ground.color;
		if (entry.type === 'quest') return QUEST_ROLE_PRESENTATION.giver.color;
		if (entry.type === 'location') return PLACE_KIND_PRESENTATION.location.color;
		return '#c9a24a';
	}

	private summarizeEntry(entry: SearchEntry): string {
		if (entry.type === 'item') {
			const total = entry.total ?? sumAmounts(entry.places);
			return total === 0 && entry.loot && entry.loot.length > 0 ? 'tylko łup' : `${total} szt.`;
		}
		if (entry.type === 'location') return '';
		if (entry.type === 'quest') {
			return entry.chapter === undefined || entry.chapter === null ? '' : `rozdz. ${entry.chapter}`;
		}
		return entry.level === undefined ? '' : `poz. ${entry.level}`;
	}

	private listFacts(entry: SearchEntry): EntryFact[] {
		if (entry.type === 'item') return this.listItemFacts(entry);
		if (entry.type === 'quest') return this.listQuestFacts(entry);
		if (entry.type === 'location') return this.listLocationFacts(entry);
		return this.listCharacterFacts(entry);
	}

	private listLocationFacts(entry: SearchEntry): EntryFact[] {
		const location = entry.location;
		if (!location) return [];
		const facts: EntryFact[] = [];
		const nameNote = LOCATION_NAME_SOURCE_NOTES[location.nameSource];
		if (nameNote) facts.push({ label: 'nazwa', value: nameNote });
		if (location.radiusMetres !== null) {
			facts.push({ label: 'zasięg', value: `ok. ${Math.round(location.radiusMetres)} m` });
		}
		if (location.waypoint) facts.push({ label: 'najbliższy punkt dróg', value: location.waypoint });
		if (location.passage && !location.passage.toWorld) {
			facts.push({ label: 'cel', value: 'poza dostępnymi światami' });
		}
		return facts;
	}

	private readPassage(entry: SearchEntry): PassageDestination | null {
		const passage = entry.location?.passage;
		if (!passage || !passage.toWorld) return null;
		return { toWorld: passage.toWorld, arrival: passage.arrival };
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
			{ label: 'Sztuki w świecie', value: String(entry.total ?? sumAmounts(entry.places)) }
		];
		const kinds: PlaceKind[] = ['ground', 'script', 'container', 'npc'];
		for (const kind of kinds) {
			const places = entry.places.filter((place) => place.kind === kind && !place.set);
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

	private readRoutineSlot(place: Place): RoutineSlot | null {
		if (place.kind !== 'routine' || place.is_default === false) return null;
		return {
			timeRanges: place.label.split(',').map((range) => range.trim()),
			actions: place.actions ?? []
		};
	}

	private presentPlace(place: Place, index: number, isItemEntry: boolean): PlaceSummary {
		const presentation = place.role
			? QUEST_ROLE_PRESENTATION[place.role]
			: PLACE_KIND_PRESENTATION[place.kind];
		return {
			index,
			key: buildPlaceKey(place),
			isCollectible: isItemEntry && isCollectiblePlace(place),
			description: capitalize(place.label),
			kindLabel: place.set ? 'Losowy łup' : presentation.label,
			color: pickPlaceColor(place),
			quantity: place.amount === undefined ? null : `${place.amount} szt.`,
			isUncertain: place.certainty === 'possible' && !place.set,
			isRandomLoot: place.set !== undefined,
			routineSlot: this.readRoutineSlot(place)
		};
	}
}
