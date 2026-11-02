import type { SearchEntry, SearchIndex } from '#lib/data/types.js';
import type { QuestLinkView } from './quest-presenter.js';

/** Grupa powiązanych wpisów w karcie: nagłówek, najważniejsze linki i liczba pominiętych. */
export interface RelatedGroupView {
	heading: string;
	links: QuestLinkView[];
	hiddenCount: number;
}

interface Relation {
	name: string;
	entryId: string | null;
	amount: number;
	isUncertain: boolean;
}

const MAXIMUM_LINKS_PER_GROUP = 40;
const CARRIER_LABEL_PREFIX = /^u NPC:\s*/;

/**
 * Powiązania przedmiotów z postaciami, które je mają przy sobie. Łączy je identyfikator obiektu w warstwie GeoJSON
 * (`ref`): miejsce przedmiotu „u NPC” ma ten sam `ref` co miejsce pojawienia się postaci. Postaci spoza indeksu
 * (zwykłe wilki, mieszczanie) nie mają wpisu, więc pojawiają się jako zwykły tekst bez linku.
 */
export class EntryRelationFinder {
	private readonly carriersByItemId = new Map<string, Relation[]>();
	private readonly itemsByCharacterId = new Map<string, Relation[]>();

	constructor(index: SearchIndex) {
		const charactersByPlaceRef = this.mapCharactersByPlaceRef(index.entries);
		for (const entry of index.entries) {
			if (entry.type === 'item') this.collectCarriers(entry, charactersByPlaceRef);
		}
	}

	describeRelations(entry: SearchEntry): RelatedGroupView[] {
		if (entry.type === 'item') {
			return this.describeGroup('Ma go przy sobie', this.carriersByItemId.get(entry.id));
		}
		if (entry.type === 'character') {
			return this.describeGroup('Ma przy sobie', this.itemsByCharacterId.get(entry.id));
		}
		return [];
	}

	private mapCharactersByPlaceRef(entries: readonly SearchEntry[]): Map<string, SearchEntry> {
		const charactersByPlaceRef = new Map<string, SearchEntry>();
		for (const entry of entries) {
			if (entry.type !== 'character') continue;
			for (const place of entry.places) {
				if (place.ref && !charactersByPlaceRef.has(place.ref)) {
					charactersByPlaceRef.set(place.ref, entry);
				}
			}
		}
		return charactersByPlaceRef;
	}

	private collectCarriers(item: SearchEntry, charactersByPlaceRef: Map<string, SearchEntry>): void {
		const carriers = new Map<string, Relation>();
		for (const place of item.places) {
			if (place.kind !== 'npc') continue;
			const character = place.ref ? charactersByPlaceRef.get(place.ref) : undefined;
			const name = character?.name ?? place.label.replace(CARRIER_LABEL_PREFIX, '');
			const key = character?.id ?? `name:${name}`;
			const isUncertain = place.certainty === 'possible';
			const known = carriers.get(key);
			if (known) {
				known.amount += place.amount ?? 1;
				known.isUncertain = known.isUncertain && isUncertain;
			} else {
				carriers.set(key, {
					name,
					entryId: character?.id ?? null,
					amount: place.amount ?? 1,
					isUncertain
				});
			}
			if (character) this.addCarriedItem(character.id, item, place.amount ?? 1, isUncertain);
		}
		if (carriers.size > 0) this.carriersByItemId.set(item.id, [...carriers.values()]);
	}

	private addCarriedItem(
		characterId: string,
		item: SearchEntry,
		amount: number,
		isUncertain: boolean
	): void {
		const carried = this.itemsByCharacterId.get(characterId) ?? [];
		const known = carried.find((relation) => relation.entryId === item.id);
		if (known) {
			known.amount += amount;
			known.isUncertain = known.isUncertain && isUncertain;
		} else {
			carried.push({ name: item.name, entryId: item.id, amount, isUncertain });
		}
		this.itemsByCharacterId.set(characterId, carried);
	}

	/** Najpierw wpisy z linkiem, potem te bez; w obu grupach od najliczniejszych i alfabetycznie. */
	private describeGroup(
		heading: string,
		relations: readonly Relation[] | undefined
	): RelatedGroupView[] {
		if (!relations || relations.length === 0) return [];
		const sorted = [...relations].sort(
			(first, second) =>
				Number(second.entryId !== null) - Number(first.entryId !== null) ||
				second.amount - first.amount ||
				first.name.localeCompare(second.name, 'pl')
		);
		return [
			{
				heading,
				links: sorted.slice(0, MAXIMUM_LINKS_PER_GROUP).map((relation) => ({
					name: relation.name,
					description: relation.amount > 1 ? `×${relation.amount}` : '',
					isUncertain: relation.isUncertain,
					entryId: relation.entryId
				})),
				hiddenCount: Math.max(0, sorted.length - MAXIMUM_LINKS_PER_GROUP)
			}
		];
	}
}
