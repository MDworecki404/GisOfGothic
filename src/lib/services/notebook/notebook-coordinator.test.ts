import { describe, expect, it } from 'vitest';
import type { AppEvent } from '#lib/events/app-events.js';
import { EventBus } from '#lib/events/event-bus.js';
import {
	NotebookCoordinator,
	type NotebookDisplay,
	type NotebookView,
	type PinMarker
} from './notebook-coordinator.js';
import { NotebookStore, type NotebookStorage } from './notebook-store.js';

class FakeStorage implements NotebookStorage {
	readonly values = new Map<string, string>();

	getItem(key: string): string | null {
		return this.values.get(key) ?? null;
	}

	setItem(key: string, value: string): void {
		this.values.set(key, value);
	}
}

class FakeDisplay implements NotebookDisplay {
	pins: PinMarker[] = [];
	flownToIndex: number | null = null;

	showPins(pins: readonly PinMarker[]): void {
		this.pins = [...pins];
	}

	flyToPin(index: number): void {
		this.flownToIndex = index;
	}
}

const position = { east: 100, north: 200, height: 30 };

function createCoordinator(storage = new FakeStorage()): {
	coordinator: NotebookCoordinator;
	storage: FakeStorage;
	display: FakeDisplay;
	latest: () => NotebookView;
} {
	const eventBus = new EventBus<AppEvent>();
	let view: NotebookView | null = null;
	eventBus.subscribe('notebook-changed', (event) => {
		view = event.notebook;
	});
	const display = new FakeDisplay();
	let nextId = 0;
	const coordinator = new NotebookCoordinator(
		eventBus,
		new NotebookStore(storage),
		() => display,
		() => new Date('2026-11-02T10:00:00.000Z'),
		() => `pin-${++nextId}`
	);
	return {
		coordinator,
		storage,
		display,
		latest: () => {
			if (!view) throw new Error('Notatnik nie opublikował jeszcze stanu');
			return view;
		}
	};
}

describe('NotebookCoordinator: pinezki', () => {
	it('dodaje pinezkę z domyślną nazwą i pokazuje ją na mapie', () => {
		const { coordinator, display, latest } = createCoordinator();
		coordinator.useWorld('g2nk', 'khorinis');
		coordinator.addPin(position);
		coordinator.addPin(position);
		expect(latest().pins.map((pin) => pin.name)).toEqual(['Pinezka 1', 'Pinezka 2']);
		expect(display.pins[0]).toEqual({ ...position, label: 'Pinezka 1' });
	});

	it('tryb stawiania kończy się po dodaniu pinezki albo po anulowaniu', () => {
		const { coordinator, latest } = createCoordinator();
		coordinator.useWorld('g2nk', 'khorinis');
		coordinator.startPlacingPin();
		expect(coordinator.isPlacingPin).toBe(true);
		expect(latest().isPlacingPin).toBe(true);
		coordinator.addPin(position);
		expect(coordinator.isPlacingPin).toBe(false);
		coordinator.startPlacingPin();
		coordinator.cancelPlacingPin();
		expect(latest().isPlacingPin).toBe(false);
	});

	it('zmienia nazwę i notatkę, a pustej nazwy nie przyjmuje', () => {
		const { coordinator, display, latest } = createCoordinator();
		coordinator.useWorld('g2nk', 'khorinis');
		coordinator.addPin(position);
		coordinator.renamePin('pin-1', '  Kuźnia  ');
		coordinator.changePinNote('pin-1', ' Tu kupię rudę ');
		coordinator.renamePin('pin-1', '   ');
		expect(latest().pins).toEqual([{ id: 'pin-1', name: 'Kuźnia', note: 'Tu kupię rudę' }]);
		expect(display.pins[0].label).toBe('Kuźnia');
	});

	it('usuwa pinezkę, a lot kamery wskazuje jej numer na liście świata', () => {
		const { coordinator, display, latest } = createCoordinator();
		coordinator.useWorld('g2nk', 'khorinis');
		coordinator.addPin(position);
		coordinator.addPin(position);
		coordinator.flyToPin('pin-2');
		expect(display.flownToIndex).toBe(1);
		coordinator.removePin('pin-1');
		expect(latest().pins.map((pin) => pin.id)).toEqual(['pin-2']);
	});

	it('pinezki są osobne dla każdego świata i przeżywają ponowne otwarcie', () => {
		const first = createCoordinator();
		first.coordinator.useWorld('g2nk', 'khorinis');
		first.coordinator.addPin(position);
		first.coordinator.useWorld('g1', 'gornicza-dolina');
		expect(first.latest().pins).toEqual([]);
		expect(first.display.pins).toEqual([]);

		const reopened = createCoordinator(first.storage);
		reopened.coordinator.useWorld('g2nk', 'khorinis');
		expect(reopened.latest().pins).toHaveLength(1);
		reopened.coordinator.showOnMap();
		expect(reopened.display.pins).toHaveLength(1);
	});

	it('zgłasza błąd, gdy pamięci przeglądarki nie da się zapisać', () => {
		const eventBus = new EventBus<AppEvent>();
		let hasStorageError = false;
		eventBus.subscribe('notebook-changed', (event) => {
			hasStorageError = event.notebook.hasStorageError;
		});
		const coordinator = new NotebookCoordinator(eventBus, new NotebookStore(null), () => null);
		coordinator.useWorld('g2nk', 'khorinis');
		coordinator.addPin(position);
		expect(hasStorageError).toBe(true);
	});
});

describe('NotebookCoordinator: co zebrałem', () => {
	const bolts = { id: 'item:ITRW_BOLT', name: 'Bełt' };
	const quest = { id: 'quest:Q1', name: 'Zadanie' };

	it('odhacza pojedyncze miejsca przedmiotu, a nie cały przedmiot', () => {
		const { coordinator, latest } = createCoordinator();
		coordinator.useWorld('g3', 'myrtana');
		coordinator.toggleCollectedPlace(bolts, 'ground:item-1');
		coordinator.toggleCollectedPlace(bolts, 'ground:item-2');
		expect([...coordinator.listCollectedPlaceKeys(bolts.id)]).toEqual([
			'ground:item-1',
			'ground:item-2'
		]);
		expect(latest().collectedItems).toEqual([{ entryId: bolts.id, name: 'Bełt', placeCount: 2 }]);
		coordinator.toggleCollectedPlace(bolts, 'ground:item-1');
		expect(latest().collectedPlaces).toEqual([{ entryId: bolts.id, placeKey: 'ground:item-2' }]);
	});

	it('odhacza i cofa wszystkie podane miejsca jednym zapisem, bez duplikatów', () => {
		const { coordinator, latest } = createCoordinator();
		coordinator.useWorld('g3', 'myrtana');
		const keys = ['ground:item-1', 'ground:item-2', 'ground:item-3'];
		coordinator.toggleCollectedPlace(bolts, 'ground:item-1');
		coordinator.setPlacesCollected(bolts, keys, true);
		expect(latest().collectedPlaces).toHaveLength(3);
		coordinator.setPlacesCollected(bolts, keys, false);
		expect(latest().collectedPlaces).toEqual([]);
	});

	it('usuwa z listy wszystkie miejsca jednego przedmiotu, nie ruszając innych', () => {
		const { coordinator, latest } = createCoordinator();
		coordinator.useWorld('g3', 'myrtana');
		coordinator.toggleCollectedPlace(bolts, 'ground:item-1');
		coordinator.toggleCollectedPlace({ id: 'item:ROSA', name: 'Rosa' }, 'ground:item-9');
		coordinator.removeCollectedItem(bolts.id);
		expect(latest().collectedItems.map((item) => item.entryId)).toEqual(['item:ROSA']);
	});

	it('odhacza i cofa odhaczenie questa', () => {
		const { coordinator, latest } = createCoordinator();
		coordinator.useWorld('g2nk', 'khorinis');
		coordinator.toggleQuestCollected(quest);
		expect(coordinator.isQuestCollected(quest.id)).toBe(true);
		expect(latest().collectedQuestIds).toEqual([quest.id]);
		expect(latest().collectedQuests).toEqual([{ questId: quest.id, name: 'Zadanie' }]);
		coordinator.toggleQuestCollected(quest);
		expect(latest().collectedQuests).toEqual([]);
	});

	it('liczy postęp względem liczby miejsc przedmiotów i questów świata', () => {
		const { coordinator, latest } = createCoordinator();
		coordinator.useWorld('g2nk', 'khorinis');
		coordinator.useEntryTotals({ itemPlaces: 8, quests: 4 });
		coordinator.toggleCollectedPlace(bolts, 'ground:item-1');
		coordinator.toggleQuestCollected(quest);
		expect(latest().progress).toEqual([
			{
				kind: 'places',
				label: 'Miejsca przedmiotów',
				collected: 1,
				total: 8,
				percentLabel: '12,5%'
			},
			{ kind: 'quests', label: 'Questy', collected: 1, total: 4, percentLabel: '25%' }
		]);
	});

	it('bez znanej liczby wpisów nie podaje procentu', () => {
		const { coordinator, latest } = createCoordinator();
		coordinator.useWorld('g2nk', 'khorinis');
		coordinator.toggleCollectedPlace(bolts, 'ground:item-1');
		expect(latest().progress[0]).toMatchObject({ total: null, percentLabel: null });
	});

	it('to samo miejsce w innym świecie liczy się osobno', () => {
		const { coordinator, latest } = createCoordinator();
		coordinator.useWorld('g2nk', 'khorinis');
		coordinator.toggleCollectedPlace(bolts, 'ground:item-1');
		coordinator.useWorld('g1', 'gornicza-dolina');
		expect(coordinator.listCollectedPlaceKeys(bolts.id).size).toBe(0);
		coordinator.toggleCollectedPlace(bolts, 'ground:item-1');
		coordinator.removeCollectedItem(bolts.id);
		coordinator.useWorld('g2nk', 'khorinis');
		expect(latest().collectedPlaces).toHaveLength(1);
	});
});

describe('NotebookCoordinator: import', () => {
	it('dołącza tylko to, czego jeszcze nie ma', () => {
		const { coordinator, latest } = createCoordinator();
		coordinator.useWorld('g2nk', 'khorinis');
		coordinator.addPin(position);
		coordinator.toggleQuestCollected({ id: 'quest:A', name: 'A' });
		coordinator.toggleCollectedPlace({ id: 'item:A', name: 'A' }, 'ground:item-1');
		const exported = coordinator.exportData();

		const counts = coordinator.importData({
			pins: [
				...exported.pins,
				{ ...exported.pins[0], id: 'inny', gameId: 'g1', worldId: 'gornicza-dolina' }
			],
			collectedQuests: [
				...exported.collectedQuests,
				{ gameId: 'g1', worldId: 'gornicza-dolina', questId: 'quest:B', questName: 'B' }
			],
			collectedPlaces: [
				...exported.collectedPlaces,
				...exported.collectedPlaces,
				{
					gameId: 'g1',
					worldId: 'gornicza-dolina',
					entryId: 'item:B',
					entryName: 'B',
					placeKey: 'ground:item-7'
				}
			]
		});
		expect(counts).toEqual({ pins: 1, collected: 2 });
		expect(latest().pins).toHaveLength(1);
		expect(coordinator.exportData().pins).toHaveLength(2);
		expect(coordinator.exportData().collectedPlaces).toHaveLength(2);
	});
});
