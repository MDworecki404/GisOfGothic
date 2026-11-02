import type { AppEventBus } from '#lib/events/app-events.js';
import type { LocalPoint } from '#lib/services/measurement/measurement-calculator.js';
import {
	type CollectedEntry,
	type CollectibleType,
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

export interface CollectedEntryView {
	entryId: string;
	name: string;
	typeLabel: string;
}

export interface CollectionProgressView {
	type: CollectibleType;
	label: string;
	collected: number;
	total: number | null;
	percentLabel: string | null;
}

export interface NotebookView {
	pins: PinView[];
	collected: CollectedEntryView[];
	collectedEntryIds: string[];
	progress: CollectionProgressView[];
	isPlacingPin: boolean;
	hasStorageError: boolean;
}

export interface EntryTotals {
	items: number;
	quests: number;
}

export interface CollectibleEntry {
	id: string;
	name: string;
	type: CollectibleType;
}

export interface NotebookImportCounts {
	pins: number;
	collected: number;
}

const COLLECTIBLE_LABELS: Readonly<Record<CollectibleType, { plural: string; entry: string }>> = {
	item: { plural: 'Przedmioty', entry: 'przedmiot' },
	quest: { plural: 'Questy', entry: 'quest' }
};

const percentFormat = new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 1 });

function generatePinId(): string {
	return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Notatnik gracza otwartego świata: własne pinezki z opisem na mapie oraz lista „co zebrałem”
 * (przedmioty i questy). Zapis obejmuje wszystkie światy, a widok tylko bieżący. Pinezkę stawia się
 * w trybie umieszczania: kolejne kliknięcie mapy dodaje ją i kończy tryb.
 */
export class NotebookCoordinator {
	private data: NotebookData = { pins: [], collected: [] };
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

	toggleCollected(entry: CollectibleEntry): void {
		if (this.gameId === null || this.worldId === null) return;
		if (this.isCollected(entry.id)) {
			this.removeCollected(entry.id);
			return;
		}
		this.data = {
			...this.data,
			collected: [
				...this.data.collected,
				{
					gameId: this.gameId,
					worldId: this.worldId,
					entryId: entry.id,
					entryType: entry.type,
					entryName: entry.name
				}
			]
		};
		this.persistAndPublish();
	}

	removeCollected(entryId: string): void {
		this.data = {
			...this.data,
			collected: this.data.collected.filter(
				(collected) => !this.isInCurrentWorld(collected) || collected.entryId !== entryId
			)
		};
		this.persistAndPublish();
	}

	isCollected(entryId: string): boolean {
		return this.listCurrentWorldCollected().some((collected) => collected.entryId === entryId);
	}

	exportData(): NotebookData {
		return this.data;
	}

	/** Dołącza pinezki i wpisy listy, których jeszcze nie ma; zwraca, ile faktycznie dodano. */
	importData(incoming: NotebookData): NotebookImportCounts {
		const knownPinIds = new Set(this.data.pins.map((pin) => pin.id));
		const newPins = incoming.pins.filter((pin) => !knownPinIds.has(pin.id));
		const newCollected = incoming.collected.filter(
			(candidate) =>
				!this.data.collected.some(
					(known) =>
						known.gameId === candidate.gameId &&
						known.worldId === candidate.worldId &&
						known.entryId === candidate.entryId
				)
		);
		this.data = {
			pins: [...this.data.pins, ...newPins],
			collected: [...this.data.collected, ...newCollected]
		};
		this.persistAndPublish();
		return { pins: newPins.length, collected: newCollected.length };
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

	private listCurrentWorldCollected(): CollectedEntry[] {
		return this.data.collected.filter((collected) => this.isInCurrentWorld(collected));
	}

	private toMarker(pin: SavedPin): PinMarker {
		return { east: pin.east, north: pin.north, height: pin.height, label: pin.name };
	}

	private presentProgress(
		type: CollectibleType,
		collectedCount: number,
		total: number | null
	): CollectionProgressView {
		return {
			type,
			label: COLLECTIBLE_LABELS[type].plural,
			collected: collectedCount,
			total,
			percentLabel:
				total === null || total === 0
					? null
					: `${percentFormat.format((collectedCount / total) * 100)}%`
		};
	}

	private publish(): void {
		const collected = this.listCurrentWorldCollected();
		const countOf = (type: CollectibleType): number =>
			collected.filter((entry) => entry.entryType === type).length;
		this.eventBus.publish({
			type: 'notebook-changed',
			notebook: {
				pins: this.listCurrentWorldPins().map((pin) => ({
					id: pin.id,
					name: pin.name,
					note: pin.note
				})),
				collected: collected.map((entry) => ({
					entryId: entry.entryId,
					name: entry.entryName,
					typeLabel: COLLECTIBLE_LABELS[entry.entryType].entry
				})),
				collectedEntryIds: collected.map((entry) => entry.entryId),
				progress: [
					this.presentProgress('item', countOf('item'), this.totals?.items ?? null),
					this.presentProgress('quest', countOf('quest'), this.totals?.quests ?? null)
				],
				isPlacingPin: this.isPlacing,
				hasStorageError: this.hasStorageError
			}
		});
	}
}
