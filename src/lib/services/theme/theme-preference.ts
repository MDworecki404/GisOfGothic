export type ThemePreference = 'system' | 'light' | 'dark';

export type ResolvedTheme = 'light' | 'dark';

export const THEME_PREFERENCES: readonly ThemePreference[] = ['system', 'light', 'dark'];

export const THEME_PREFERENCE_LABELS: Record<ThemePreference, string> = {
	system: 'Zgodny z systemem',
	light: 'Jasny',
	dark: 'Ciemny'
};

export function isThemePreference(value: unknown): value is ThemePreference {
	return value === 'system' || value === 'light' || value === 'dark';
}

export function resolveTheme(
	preference: ThemePreference,
	systemPrefersLight: boolean
): ResolvedTheme {
	if (preference === 'system') return systemPrefersLight ? 'light' : 'dark';
	return preference;
}

export function findNextThemePreference(preference: ThemePreference): ThemePreference {
	const index = THEME_PREFERENCES.indexOf(preference);
	return THEME_PREFERENCES[(index + 1) % THEME_PREFERENCES.length];
}
