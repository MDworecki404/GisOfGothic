import { describe, expect, it } from 'vitest';
import {
	KeyboardShortcutCatalog,
	type KeyboardShortcutActions
} from './keyboard-shortcut-catalog.js';
import { KeyboardShortcutListener, type ShortcutKeyEvent } from './keyboard-shortcut-listener.js';

class FakeEventSource {
	private listener: ((event: ShortcutKeyEvent) => void) | null = null;

	addEventListener(_type: 'keydown', listener: (event: ShortcutKeyEvent) => void): void {
		this.listener = listener;
	}

	removeEventListener(): void {
		this.listener = null;
	}

	press(event: Partial<ShortcutKeyEvent>): { wasPrevented: boolean } {
		const result = { wasPrevented: false };
		this.listener?.({
			code: 'KeyP',
			ctrlKey: false,
			altKey: false,
			metaKey: false,
			shiftKey: false,
			repeat: false,
			target: null,
			preventDefault: () => {
				result.wasPrevented = true;
			},
			...event
		});
		return result;
	}
}

function createTarget(
	selectorMatches: boolean
): EventTarget & { closest(selector: string): unknown } {
	return Object.assign(new EventTarget(), {
		closest: () => (selectorMatches ? {} : null)
	});
}

function createRecordingActions(calls: string[]): KeyboardShortcutActions {
	return {
		openSearch: () => calls.push('openSearch'),
		selectTool: (toolId) => calls.push(`selectTool:${toolId}`),
		zoomIn: () => calls.push('zoomIn'),
		zoomOut: () => calls.push('zoomOut'),
		showWholeWorld: () => calls.push('showWholeWorld'),
		turnMapToNorth: () => calls.push('turnMapToNorth'),
		toggleCameraProjection: () => calls.push('toggleCameraProjection'),
		toggleViewMode: () => calls.push('toggleViewMode'),
		showTopDownView: () => calls.push('showTopDownView'),
		showObliqueView: () => calls.push('showObliqueView'),
		toggleContours: () => calls.push('toggleContours'),
		toggleGrid: () => calls.push('toggleGrid'),
		toggleStaticObjects: () => calls.push('toggleStaticObjects'),
		toggleCharactersAtTimeOfDay: () => calls.push('toggleCharactersAtTimeOfDay'),
		switchToNextCoordinateSystem: () => calls.push('switchToNextCoordinateSystem'),
		moveQuestGuideToPreviousStep: () => calls.push('moveQuestGuideToPreviousStep'),
		moveQuestGuideToNextStep: () => calls.push('moveQuestGuideToNextStep'),
		removeLastMeasurementPoint: () => calls.push('removeLastMeasurementPoint'),
		clearMeasurement: () => calls.push('clearMeasurement')
	};
}

function start(): { source: FakeEventSource; calls: string[] } {
	const calls: string[] = [];
	const source = new FakeEventSource();
	const catalog = new KeyboardShortcutCatalog(createRecordingActions(calls));
	new KeyboardShortcutListener(source, catalog.listShortcuts()).start();
	return { source, calls };
}

describe('KeyboardShortcutListener', () => {
	it('klawisz P przełącza rzut i blokuje domyślną akcję', () => {
		const { source, calls } = start();
		expect(source.press({ code: 'KeyP' }).wasPrevented).toBe(true);
		expect(calls).toEqual(['toggleCameraProjection']);
	});

	it('cyfry wybierają narzędzia w kolejności z listy narzędzi, także z klawiatury numerycznej', () => {
		const { source, calls } = start();
		source.press({ code: 'Digit1' });
		source.press({ code: 'Numpad2' });
		source.press({ code: 'Digit8' });
		expect(calls).toEqual(['selectTool:search', 'selectTool:layers', 'selectTool:bookmarks']);
	});

	it('Ctrl K i Cmd K otwierają wyszukiwarkę, a samo K przełącza poziomice', () => {
		const { source, calls } = start();
		source.press({ code: 'KeyK', ctrlKey: true });
		source.press({ code: 'KeyK', metaKey: true });
		source.press({ code: 'KeyK' });
		expect(calls).toEqual(['openSearch', 'openSearch', 'toggleContours']);
	});

	it('odróżnia T od Shift T', () => {
		const { source, calls } = start();
		source.press({ code: 'KeyT' });
		source.press({ code: 'KeyT', shiftKey: true });
		expect(calls).toEqual(['showTopDownView', 'showObliqueView']);
	});

	it('ignoruje skróty z Alt oraz Ctrl dla klawiszy bez takiego skrótu', () => {
		const { source, calls } = start();
		source.press({ code: 'KeyP', altKey: true });
		source.press({ code: 'KeyP', ctrlKey: true });
		source.press({ code: 'KeyP', metaKey: true });
		expect(calls).toEqual([]);
	});

	it('ignoruje nieznane klawisze i nie blokuje ich domyślnej akcji', () => {
		const { source, calls } = start();
		expect(source.press({ code: 'KeyZ' }).wasPrevented).toBe(false);
		expect(calls).toEqual([]);
	});

	it('pomija klawisze naciśnięte w polach, które same ich używają', () => {
		const { source, calls } = start();
		expect(source.press({ target: createTarget(true) }).wasPrevented).toBe(false);
		source.press({ code: 'Digit1', target: createTarget(true) });
		expect(calls).toEqual([]);
	});

	it('Ctrl K działa także w polu tekstowym', () => {
		const { source, calls } = start();
		source.press({ code: 'KeyK', ctrlKey: true, target: createTarget(true) });
		expect(calls).toEqual(['openSearch']);
	});

	it('powtórzenia przepuszcza tylko dla zbliżania i oddalania', () => {
		const { source, calls } = start();
		source.press({ code: 'Equal', repeat: true });
		source.press({ code: 'Minus', repeat: true });
		source.press({ code: 'KeyP', repeat: true });
		expect(calls).toEqual(['zoomIn', 'zoomOut']);
	});

	it('po zatrzymaniu nasłuchu nie reaguje', () => {
		const calls: string[] = [];
		const source = new FakeEventSource();
		const catalog = new KeyboardShortcutCatalog(createRecordingActions(calls));
		const stop = new KeyboardShortcutListener(source, catalog.listShortcuts()).start();
		stop();
		source.press({ code: 'KeyP' });
		expect(calls).toEqual([]);
	});
});

describe('KeyboardShortcutCatalog', () => {
	it('żadne dwa skróty nie dzielą tego samego klawisza z tymi samymi modyfikatorami', () => {
		const catalog = new KeyboardShortcutCatalog(createRecordingActions([]));
		const occupiedKeys = catalog
			.listShortcuts()
			.flatMap(({ trigger }) =>
				trigger.codes.map((code) => `${code}|${trigger.requiresShift}|${trigger.requiresCommand}`)
			);
		expect(new Set(occupiedKeys).size).toBe(occupiedKeys.length);
	});

	it('nie przejmuje klawiszy lotu kamerą', () => {
		const flightKeys = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ', 'KeyE'];
		const catalog = new KeyboardShortcutCatalog(createRecordingActions([]));
		const catalogKeys = catalog.listShortcuts().flatMap(({ trigger }) => trigger.codes);
		expect(catalogKeys.filter((code) => flightKeys.includes(code))).toEqual([]);
	});

	it('opisuje w ściądze lot kamerą i zamykanie okien', () => {
		const catalog = new KeyboardShortcutCatalog(createRecordingActions([]));
		const labels = catalog.listHelpEntries().map(({ keyLabel }) => keyLabel);
		expect(labels).toContain('W A S D');
		expect(labels).toContain('Esc');
	});
});
