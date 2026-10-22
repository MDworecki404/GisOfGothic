import { afterEach, describe, expect, it } from 'vitest';
import { describeCategory, guildNameBook } from './category-names.js';

describe('describeCategory', () => {
	afterEach(() => guildNameBook.useGuildNames(undefined));

	it('zamienia kod gildii na nazwę z danych świata', () => {
		guildNameBook.useGuildNames({ GRD: 'Strażnik', HUMAN: 'Magnat' });
		expect(describeCategory('GRD')).toBe('Strażnik');
		expect(describeCategory('HUMAN')).toBe('Magnat');
	});

	it('nazwa zależy od świata: ten sam kod ma inną nazwę po zmianie danych', () => {
		guildNameBook.useGuildNames({ HUMAN: 'Paladyn' });
		expect(describeCategory('HUMAN')).toBe('Paladyn');
		guildNameBook.useGuildNames({ HUMAN: 'Magnat' });
		expect(describeCategory('HUMAN')).toBe('Magnat');
	});

	it('kategorię przedmiotu albo nieznany kod zostawia bez zmian', () => {
		guildNameBook.useGuildNames({ GRD: 'Strażnik' });
		expect(describeCategory('Rośliny')).toBe('Rośliny');
		expect(describeCategory('XYZ')).toBe('XYZ');
	});

	it('brak kategorii i brak gildii mają własne etykiety', () => {
		guildNameBook.useGuildNames({ NONE: 'Brak przyn.' });
		expect(describeCategory(null)).toBe('Bez kategorii');
		expect(describeCategory('NONE')).toBe('Bez gildii');
	});
});
