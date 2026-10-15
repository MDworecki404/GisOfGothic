import { describe, expect, it } from 'vitest';
import { pickItemIcon } from './map-icons.js';

describe('pickItemIcon', () => {
	it('dobiera ikonę do kategorii przedmiotu', () => {
		expect(pickItemIcon('Rośliny')).toBe('plant');
		expect(pickItemIcon('Broń biała')).toBe('melee');
		expect(pickItemIcon('Runy i zwoje')).toBe('rune');
	});

	it('kategorie „Różne”, nieznane i brak kategorii dostają ikonę worka rzeczy', () => {
		expect(pickItemIcon('Różne')).toBe('misc');
		expect(pickItemIcon('Coś nowego')).toBe('misc');
		expect(pickItemIcon(null)).toBe('misc');
	});

	it('nazwa kategorii nie trafia w pola prototypu obiektu', () => {
		expect(pickItemIcon('constructor')).toBe('misc');
	});
});
