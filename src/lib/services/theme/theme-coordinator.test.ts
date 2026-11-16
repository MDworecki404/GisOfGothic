import { describe, expect, it } from 'vitest';
import type { AppEvent } from '#lib/events/app-events.js';
import { EventBus } from '#lib/events/event-bus.js';
import type { ThemeDocument } from './theme-document.js';
import { ThemeCoordinator } from './theme-coordinator.js';
import { ThemePreferenceStore, THEME_STORAGE_KEY } from './theme-preference-store.js';
import type { ResolvedTheme } from './theme-preference.js';

class FakeThemeDocument implements ThemeDocument {
	shownThemes: ResolvedTheme[] = [];
	private onSystemSchemeChange: (() => void) | null = null;

	constructor(public systemPrefersLight: boolean) {}

	readSystemPrefersLight(): boolean {
		return this.systemPrefersLight;
	}

	listenForSystemSchemeChange(onChange: () => void): void {
		this.onSystemSchemeChange = onChange;
	}

	showTheme(theme: ResolvedTheme): void {
		this.shownThemes.push(theme);
	}

	changeSystemScheme(prefersLight: boolean): void {
		this.systemPrefersLight = prefersLight;
		this.onSystemSchemeChange?.();
	}
}

function createStorage(initial: Record<string, string> = {}) {
	const values = new Map(Object.entries(initial));
	return {
		values,
		getItem: (key: string) => values.get(key) ?? null,
		setItem: (key: string, value: string) => void values.set(key, value)
	};
}

function createCoordinator(options: { saved?: string; systemPrefersLight: boolean }) {
	const storage = createStorage(options.saved ? { [THEME_STORAGE_KEY]: options.saved } : {});
	const themeDocument = new FakeThemeDocument(options.systemPrefersLight);
	const eventBus = new EventBus<AppEvent>();
	const published: AppEvent[] = [];
	eventBus.subscribe('theme-changed', (event) => published.push(event));
	const coordinator = new ThemeCoordinator(
		eventBus,
		themeDocument,
		new ThemePreferenceStore(storage)
	);
	return { coordinator, themeDocument, published, storage };
}

describe('ThemeCoordinator', () => {
	it('bez zapisanego wyboru podąża za systemem', () => {
		const { coordinator, themeDocument, published } = createCoordinator({
			systemPrefersLight: true
		});
		coordinator.start();
		expect(themeDocument.shownThemes).toEqual(['light']);
		expect(published).toEqual([{ type: 'theme-changed', preference: 'system', theme: 'light' }]);
	});

	it('zmiana ustawienia systemu przełącza motyw, dopóki wybór to „system”', () => {
		const { coordinator, themeDocument } = createCoordinator({ systemPrefersLight: false });
		coordinator.start();
		themeDocument.changeSystemScheme(true);
		expect(themeDocument.shownThemes).toEqual(['dark', 'light']);
	});

	it('ręczny wybór jest zapisywany i ignoruje zmiany systemu', () => {
		const { coordinator, themeDocument, storage } = createCoordinator({
			systemPrefersLight: false
		});
		coordinator.start();
		coordinator.selectPreference('light');
		themeDocument.changeSystemScheme(false);
		themeDocument.changeSystemScheme(true);
		expect(themeDocument.shownThemes).toEqual(['dark', 'light']);
		expect(storage.values.get(THEME_STORAGE_KEY)).toBe('light');
	});

	it('wczytuje zapisany wybór przy starcie', () => {
		const { coordinator, themeDocument } = createCoordinator({
			saved: 'dark',
			systemPrefersLight: true
		});
		coordinator.start();
		expect(themeDocument.shownThemes).toEqual(['dark']);
	});

	it('ignoruje zepsuty zapis i wraca do systemu', () => {
		const { coordinator, published } = createCoordinator({
			saved: 'fioletowy',
			systemPrefersLight: false
		});
		coordinator.start();
		expect(published[0]).toMatchObject({ preference: 'system', theme: 'dark' });
	});
});
