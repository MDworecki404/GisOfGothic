import { isThemePreference, type ThemePreference } from './theme-preference.js';

export type ThemeStorage = Pick<Storage, 'getItem' | 'setItem'>;

export const THEME_STORAGE_KEY = 'gisofgothic:theme:v1';

/** Wybór motywu w `localStorage`; gdy pamięć jest niedostępna, motyw podąża za systemem. */
export class ThemePreferenceStore {
	constructor(private readonly storage: ThemeStorage | null) {}

	static forBrowser(): ThemePreferenceStore {
		try {
			return new ThemePreferenceStore(typeof localStorage === 'undefined' ? null : localStorage);
		} catch {
			return new ThemePreferenceStore(null);
		}
	}

	load(): ThemePreference {
		try {
			const value = this.storage?.getItem(THEME_STORAGE_KEY);
			return isThemePreference(value) ? value : 'system';
		} catch {
			return 'system';
		}
	}

	save(preference: ThemePreference): void {
		try {
			this.storage?.setItem(THEME_STORAGE_KEY, preference);
		} catch {
			return;
		}
	}
}
