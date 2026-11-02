import type { AppEventBus } from '#lib/events/app-events.js';
import type { LocalPoint } from '#lib/services/measurement/measurement-calculator.js';
import {
	createEmptyNotebookData,
	type CollectedPlace,
	type CollectedQuest,
	type NotebookData,
	type NotebookStore,
	type SavedPin
} from './notebook-store.js';

export interface PinMarker extends LocalPoint {
	label: string;
}

export interface NotebookDisplay {
	showPins(pins: readonly PinMarker[]): void;
	flyToPin(index: number): void;
}

export interface PinView {
	id: string;
	name: string;
	note: string;
}

export interface CollectedQuestView {
	questId: string;
	name: string;
}

/** Przedmiot z co najmniej jednym odhaczonym miejscem i liczba tych miejsc. */
export interface CollectedItemView {
	entryId: string;
	name: string;
	placeCount: number;
}

export interface CollectedPlaceView {
	entryId: string;
	placeKey: string;
}

export interface CollectionProgressView {
	kind: 'places' | 'quests';
	label: string;
	collected: number;
	total: number | null;
	percentLabel: string | null;
}

export interface NotebookView {
	pins: PinView[];
	collectedQuests: CollectedQuestView[];
	collectedQuestIds: string[];
	collectedItems: CollectedItemView[];
	collectedPlaces: CollectedPlaceView[];
	progress: CollectionProgressView[];
	isPlacingPin: boolean;
	hasStorageError: boolean;
}

export interface EntryTotals {
	itemPlaces: number;
	quests: number;
}

export interface EntryReference {
	id: string;
	name: string;
}

export interface NotebookImportCounts {
	pins: number;
	collected: number;
}

const percentFormat = new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 1 });

function generatePinId(): string {
	return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Notatnik gracza otwartego świata: własne pinezki z opisem na mapie oraz lista „co zebrałem”
 * (wykonane questy i zebrane miejsca przedmiotów). Przedmiot występuje w wielu miejscach (bełtów
 * bywa tysiąc), więc odhacza się pojedyncze miejsca, nie cały przedmiot. Zapis obejmuje wszystkie
 * światy, a widok tylko bieżący. Pinezkę stawia się w trybie umieszczania: kolejne kliknięcie mapy
 * dodaje ją i kończy tryb.
 */
export class NotebookCoordinator {
	private data: NotebookData = createEmptyNotebookData();
	private gameId: string | null = null;
	private worldId: string | null = null;
	private totals: EntryTotals | null = null;
	private isPlacing = false;
	private hasStorageError = false;

	constructor(
		private readonly eventBus: AppEventBus,
		private readonly store: NotebookStore,
		private readonly getDisplay: () => NotebookDisplay | null,
		private readonly now: () => Date = () => new Date(),
		private readonly generateId: () => string = generatePinId
	) {}

	get isPlacingPin(): boolean {
		return this.isPlacing;
	}

	useWorld(gameId: string, worldId: string): void {
		this.gameId = gameId;
		this.worldId = worldId;
		this.data = this.store.load();
		this.totals = null;
		this.isPlacing = false;
		this.hasStorageError = false;
		this.getDisplay()?.showPins([]);
		this.publish();
	}

	useEntryTotals(totals: EntryTotals | null): void {
		this.totals = totals;
		this.publish();
	}

	showOnMap(): void {
		this.getDisplay()?.showPins(this.listCurrentWorldPins().map((pin) => this.toMarker(pin)));
	}

	startPlacingPin(): void {
		this.isPlacing = true;
		this.publish();
	}

	cancelPlacingPin(): void {
		if (!this.isPlacing) return;
		this.isPlacing = false;
		this.publish();
	}

	addPin(position: LocalPoint): void {
		if (this.gameId === null || this.worldId === null) return;
		this.isPlacing = false;
		this.data = {
			...this.data,
			pins: [
				...this.data.pins,
				{
					id: this.generateId(),
					gameId: this.gameId,
					worldId: this.worldId,
					name: `Pinezka ${this.listCurrentWorldPins().length + 1}`,
					note: '',
					east: position.east,
					north: position.north,
					height: position.height,
					createdAt: this.now().toISOString()
				}
			]
		};
		this.persistAndPublish();
	}

	renamePin(pinId: string, name: string): void {
		const trimmedName = name.trim();
		if (trimmedName === '') {
			this.publish();
			return;
		}
		this.changePin(pinId, { name: trimmedName });
	}

	changePinNote(pinId: string, note: string): void {
		this.changePin(pinId, { note: note.trim() });
	}

	removePin(pinId: string): void {
		this.data = { ...this.data, pins: this.data.pins.filter((pin) => pin.id !== pinId) };
		this.persistAndPublish();
	}

	flyToPin(pinId: string): void {
		const index = this.listCurrentWorldPins().findIndex((pin) => pin.id === pinId);
		if (index >= 0) this.getDisplay()?.flyToPin(index);
	}

	toggleQuestCollected(quest: EntryReference): void {
		if (this.gameId === null || this.worldId === null) return;
		if (this.isQuestCollected(quest.id)) {
			this.removeCollectedQuest(quest.id);
			return;
		}
		this.data = {
			...this.data,
			collectedQuests: [
				...this.data.collectedQuests,
				{ gameId: this.gameId, worldId: this.worldId, questId: quest.id, questName: quest.name }
			]
		};
		this.persistAndPublish();
	}

	removeCollectedQuest(questId: string): void {
		this.data = {
			...this.data,
			collectedQuests: this.data.collectedQuests.filter(
				(collected) => !this.isInCurrentWorld(collected) || collected.questId !== questId
			)
		};
		this.persistAndPublish();
	}

	isQuestCollected(questId: string): boolean {
		return this.listCurrentWorldQuests().some((collected) => collected.questId === questId);
	}

	toggleCollectedPlace(entry: EntryReference, placeKey: string): void {
		const isCollected = this.listCollectedPlaceKeys(entry.id).has(placeKey);
		this.setPlacesCollected(entry, [placeKey], !isCollected);
	}

	/** Odhacza albo cofa odhaczenie wszystkich podanych miejsc przedmiotu jednym zapisem. */
	setPlacesCollected(
		entry: EntryReference,
		placeKeys: readonly string[],
		isCollected: boolean
	): void {
		const { gameId, worldId } = this;
		if (gameId === null || worldId === null) return;
		const keysToChange = new Set(placeKeys);
		const remaining = this.data.collectedPlaces.filter(
			(place) =>
				!this.isInCurrentWorld(place) ||
				place.entryId !== entry.id ||
				!keysToChange.has(place.placeKey)
		);
		const added: CollectedPlace[] = isCollected
			? [...keysToChange].map((placeKey) => ({
					gameId,
					worldId,
					entryId: entry.id,
					entryName: entry.name,
					placeKey
				}))
			: [];
		this.data = { ...this.data, collectedPlaces: [...remaining, ...added] };
		this.persistAndPublish();
	}

	/** Cofa odhaczenie wszystkich miejsc jednego przedmiotu. */
	removeCollectedItem(entryId: string): void {
		this.data = {
			...this.data,
			collectedPlaces: this.data.collectedPlaces.filter(
				(place) => !this.isInCurrentWorld(place) || place.entryId !== entryId
			)
		};
		this.persistAndPublish();
	}

	listCollectedPlaceKeys(entryId: string): ReadonlySet<string> {
		return new Set(
			this.listCurrentWorldPlaces()
				.filter((place) => place.entryId === entryId)
				.map((place) => place.placeKey)
		);
	}

	exportData(): NotebookData {
		return this.data;
	}

	/** Dołącza pinezki i odhaczenia, których jeszcze nie ma; zwraca, ile faktycznie dodano. */
	importData(incoming: NotebookData): NotebookImportCounts {
		const knownPinIds = new Set(this.data.pins.map((pin) => pin.id));
		const newPins = incoming.pins.filter((pin) => !knownPinIds.has(pin.id));
		const newQuests = incoming.collectedQuests.filter(
			(candidate) =>
				!this.data.collectedQuests.some(
					(known) =>
						known.gameId === candidate.gameId &&
						known.worldId === candidate.worldId &&
						known.questId === candidate.questId
				)
		);
		const knownPlaceKeys = new Set(
			this.data.collectedPlaces.map((place) => this.identifyPlace(place))
		);
		const newPlaces = incoming.collectedPlaces.filter((candidate) => {
			const identity = this.identifyPlace(candidate);
			if (knownPlaceKeys.has(identity)) return false;
			knownPlaceKeys.add(identity);
			return true;
		});
		this.data = {
			pins: [...this.data.pins, ...newPins],
			collectedQuests: [...this.data.collectedQuests, ...newQuests],
			collectedPlaces: [...this.data.collectedPlaces, ...newPlaces]
		};
		this.persistAndPublish();
		return { pins: newPins.length, collected: newQuests.length + newPlaces.length };
	}

	private identifyPlace(place: CollectedPlace): string {
		return JSON.stringify([place.gameId, place.worldId, place.entryId, place.placeKey]);
	}

	private changePin(pinId: string, change: Partial<Pick<SavedPin, 'name' | 'note'>>): void {
		this.data = {
			...this.data,
			pins: this.data.pins.map((pin) => (pin.id === pinId ? { ...pin, ...change } : pin))
		};
		this.persistAndPublish();
	}

	private persistAndPublish(): void {
		this.hasStorageError = !this.store.save(this.data);
		this.showOnMap();
		this.publish();
	}

	private isInCurrentWorld(entry: { gameId: string; worldId: string }): boolean {
		return entry.gameId === this.gameId && entry.worldId === this.worldId;
	}

	private listCurrentWorldPins(): SavedPin[] {
		return this.data.pins.filter((pin) => this.isInCurrentWorld(pin));
	}

	private listCurrentWorldQuests(): CollectedQuest[] {
		return this.data.collectedQuests.filter((quest) => this.isInCurrentWorld(quest));
	}

	private listCurrentWorldPlaces(): CollectedPlace[] {
		return this.data.collectedPlaces.filter((place) => this.isInCurrentWorld(place));
	}

	private toMarker(pin: SavedPin): PinMarker {
		return { east: pin.east, north: pin.north, height: pin.height, label: pin.name };
	}

	private presentProgress(
		kind: CollectionProgressView['kind'],
		label: string,
		collectedCount: number,
		total: number | null
	): CollectionProgressView {
		return {
			kind,
			label,
			collected: collectedCount,
			total,
			percentLabel:
				total === null || total === 0
					? null
					: `${percentFormat.format((collectedCount / total) * 100)}%`
		};
	}

	private summarizeCollectedItems(places: readonly CollectedPlace[]): CollectedItemView[] {
		const byEntry = new Map<string, CollectedItemView>();
		for (const place of places) {
			const known = byEntry.get(place.entryId);
			if (known) known.placeCount++;
			else
				byEntry.set(place.entryId, {
					entryId: place.entryId,
					name: place.entryName,
					placeCount: 1
				});
		}
		return [...byEntry.values()];
	}

	private publish(): void {
		const quests = this.listCurrentWorldQuests();
		const places = this.listCurrentWorldPlaces();
		this.eventBus.publish({
			type: 'notebook-changed',
			notebook: {
				pins: this.listCurrentWorldPins().map((pin) => ({
					id: pin.id,
					name: pin.name,
					note: pin.note
				})),
				collectedQuests: quests.map((quest) => ({ questId: quest.questId, name: quest.questName })),
				collectedQuestIds: quests.map((quest) => quest.questId),
				collectedItems: this.summarizeCollectedItems(places),
				collectedPlaces: places.map((place) => ({
					entryId: place.entryId,
					placeKey: place.placeKey
				})),
				progress: [
					this.presentProgress(
						'places',
						'Miejsca przedmiotów',
						places.length,
						this.totals?.itemPlaces ?? null
					),
					this.presentProgress('quests', 'Questy', quests.length, this.totals?.quests ?? null)
				],
				isPlacingPin: this.isPlacing,
				hasStorageError: this.hasStorageError
			}
		});
	}
}
