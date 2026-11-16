import type { AppEventBus } from '#lib/events/app-events.js';
import type { ThemeDocument } from './theme-document.js';
import type { ThemePreferenceStore } from './theme-preference-store.js';
import { resolveTheme, type ResolvedTheme, type ThemePreference } from './theme-preference.js';

/**
 * Pilnuje motywu jasnego i ciemnego. Wybór „zgodny z systemem” podąża za ustawieniem systemu
 * na żywo; wybór ręczny jest zapisywany i ma pierwszeństwo.
 */
export class ThemeCoordinator {
	private preference: ThemePreference;

	constructor(
		private readonly eventBus: AppEventBus,
		private readonly themeDocument: ThemeDocument,
		private readonly preferenceStore: ThemePreferenceStore
	) {
		this.preference = preferenceStore.load();
	}

	start(): void {
		this.themeDocument.listenForSystemSchemeChange(() => {
			if (this.preference === 'system') this.applyAndPublish();
		});
		this.applyAndPublish();
	}

	selectPreference(preference: ThemePreference): void {
		this.preference = preference;
		this.preferenceStore.save(preference);
		this.applyAndPublish();
	}

	private resolveCurrentTheme(): ResolvedTheme {
		return resolveTheme(this.preference, this.themeDocument.readSystemPrefersLight());
	}

	private applyAndPublish(): void {
		const theme = this.resolveCurrentTheme();
		this.themeDocument.showTheme(theme);
		this.eventBus.publish({ type: 'theme-changed', preference: this.preference, theme });
	}
}
