import { isPerformancePreference, type PerformancePreference } from './performance-profiles.js';

export type PerformanceStorage = Pick<Storage, 'getItem' | 'setItem'>;

const STORAGE_KEY = 'gisofgothic:performance:v1';

/** Wybór ustawień wydajności w `localStorage`; gdy pamięć jest niedostępna, działa tryb automatyczny. */
export class PerformancePreferenceStore {
	constructor(private readonly storage: PerformanceStorage | null) {}

	static forBrowser(): PerformancePreferenceStore {
		try {
			return new PerformancePreferenceStore(
				typeof localStorage === 'undefined' ? null : localStorage
			);
		} catch {
			return new PerformancePreferenceStore(null);
		}
	}

	load(): PerformancePreference {
		try {
			const value = this.storage?.getItem(STORAGE_KEY);
			return isPerformancePreference(value) ? value : 'auto';
		} catch {
			return 'auto';
		}
	}

	save(preference: PerformancePreference): void {
		try {
			this.storage?.setItem(STORAGE_KEY, preference);
		} catch {
			return;
		}
	}
}
