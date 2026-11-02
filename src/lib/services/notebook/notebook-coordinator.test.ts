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
	const sword = { id: 'item:ITMW_1H_SWORD', name: 'Miecz', type: 'item' } as const;
	const quest = { id: 'quest:Q1', name: 'Zadanie', type: 'quest' } as const;

	it('odhacza i cofa odhaczenie wpisu', () => {
		const { coordinator, latest } = createCoordinator();
		coordinator.useWorld('g2nk', 'khorinis');
		coordinator.toggleCollected(sword);
		expect(coordinator.isCollected(sword.id)).toBe(true);
		expect(latest().collectedEntryIds).toEqual([sword.id]);
		expect(latest().collected).toEqual([
			{ entryId: sword.id, name: 'Miecz', typeLabel: 'przedmiot' }
		]);
		coordinator.toggleCollected(sword);
		expect(latest().collected).toEqual([]);
	});

	it('liczy postęp względem liczby wpisów świata', () => {
		const { coordinator, latest } = createCoordinator();
		coordinator.useWorld('g2nk', 'khorinis');
		coordinator.useEntryTotals({ items: 8, quests: 4 });
		coordinator.toggleCollected(sword);
		coordinator.toggleCollected(quest);
		expect(latest().progress).toEqual([
			{ type: 'item', label: 'Przedmioty', collected: 1, total: 8, percentLabel: '12,5%' },
			{ type: 'quest', label: 'Questy', collected: 1, total: 4, percentLabel: '25%' }
		]);
	});

	it('bez znanej liczby wpisów nie podaje procentu', () => {
		const { coordinator, latest } = createCoordinator();
		coordinator.useWorld('g2nk', 'khorinis');
		coordinator.toggleCollected(sword);
		expect(latest().progress[0]).toMatchObject({ total: null, percentLabel: null });
	});

	it('ten sam wpis w innym świecie liczy się osobno', () => {
		const { coordinator, latest } = createCoordinator();
		coordinator.useWorld('g2nk', 'khorinis');
		coordinator.toggleCollected(sword);
		coordinator.useWorld('g1', 'gornicza-dolina');
		expect(coordinator.isCollected(sword.id)).toBe(false);
		coordinator.toggleCollected(sword);
		coordinator.removeCollected(sword.id);
		coordinator.useWorld('g2nk', 'khorinis');
		expect(latest().collectedEntryIds).toEqual([sword.id]);
	});
});

describe('NotebookCoordinator: import', () => {
	it('dołącza tylko to, czego jeszcze nie ma', () => {
		const { coordinator, latest } = createCoordinator();
		coordinator.useWorld('g2nk', 'khorinis');
		coordinator.addPin(position);
		coordinator.toggleCollected({ id: 'item:A', name: 'A', type: 'item' });
		const exported = coordinator.exportData();

		const counts = coordinator.importData({
			pins: [
				...exported.pins,
				{ ...exported.pins[0], id: 'inny', gameId: 'g1', worldId: 'gornicza-dolina' }
			],
			collected: [
				...exported.collected,
				{
					gameId: 'g1',
					worldId: 'gornicza-dolina',
					entryId: 'item:B',
					entryType: 'item',
					entryName: 'B'
				}
			]
		});
		expect(counts).toEqual({ pins: 1, collected: 1 });
		expect(latest().pins).toHaveLength(1);
		expect(coordinator.exportData().pins).toHaveLength(2);
	});
});
