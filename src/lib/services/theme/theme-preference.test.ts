import { describe, expect, it } from 'vitest';
import { findNextThemePreference, isThemePreference, resolveTheme } from './theme-preference.js';

describe('theme-preference', () => {
	it('rozpoznaje poprawne wybory', () => {
		expect(isThemePreference('system')).toBe(true);
		expect(isThemePreference('light')).toBe(true);
		expect(isThemePreference('dark')).toBe(true);
		expect(isThemePreference('auto')).toBe(false);
		expect(isThemePreference(null)).toBe(false);
	});

	it('„system” bierze jasny tryb tylko, gdy system o niego prosi', () => {
		expect(resolveTheme('system', true)).toBe('light');
		expect(resolveTheme('system', false)).toBe('dark');
		expect(resolveTheme('dark', true)).toBe('dark');
		expect(resolveTheme('light', false)).toBe('light');
	});

	it('kolejne wybory krążą system, jasny, ciemny', () => {
		expect(findNextThemePreference('system')).toBe('light');
		expect(findNextThemePreference('light')).toBe('dark');
		expect(findNextThemePreference('dark')).toBe('system');
	});
});
