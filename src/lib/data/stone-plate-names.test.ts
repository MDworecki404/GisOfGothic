import { describe, expect, it } from 'vitest';
import { StonePlateNameResolver } from './stone-plate-names.js';

const resolver = new StonePlateNameResolver();

describe('StonePlateNameResolver', () => {
	it('dopisuje atrybut i stopień do nazwy kamiennej tablicy', () => {
		expect(resolver.resolveDisplayName('ITWR_STRSTONEPLATE1_ADDON', 'Kamienna tablica')).toBe(
			'Kamienna tablica siły I'
		);
		expect(resolver.resolveDisplayName('ITWR_DEXSTONEPLATE2_ADDON', 'Kamienna tablica')).toBe(
			'Kamienna tablica zręczności II'
		);
		expect(resolver.resolveDisplayName('ITWR_ONEHSTONEPLATE2_ADDON', 'Kamienna tablica')).toBe(
			'Kamienna tablica walki bronią jednoręczną II'
		);
		expect(resolver.resolveDisplayName('ITWR_TWOHSTONEPLATE1_ADDON', 'Kamienna tablica')).toBe(
			'Kamienna tablica walki bronią dwuręczną I'
		);
		expect(resolver.resolveDisplayName('ITWR_BOWSTONEPLATE2_ADDON', 'Kamienna tablica')).toBe(
			'Kamienna tablica walki łukiem II'
		);
		expect(resolver.resolveDisplayName('ITWR_CRSBOWSTONEPLATE1_ADDON', 'Kamienna tablica')).toBe(
			'Kamienna tablica walki kuszą I'
		);
		expect(resolver.resolveDisplayName('ITWR_HITPOINTSTONEPLATE3_ADDON', 'Kamienna tablica')).toBe(
			'Kamienna tablica życia III'
		);
		expect(resolver.resolveDisplayName('ITWR_MANASTONEPLATE3_ADDON', 'Kamienna tablica')).toBe(
			'Kamienna tablica many III'
		);
	});

	it('zostawia inne przedmioty i starą tablicę bez zmian', () => {
		expect(
			resolver.resolveDisplayName('ITWR_STONEPLATECOMMON_ADDON', 'Stara kamienna tablica')
		).toBe('Stara kamienna tablica');
		expect(resolver.resolveDisplayName('ITMW_1H_SWORD', 'Miecz')).toBe('Miecz');
	});

	it('podaje słowa kluczowe w mianowniku do wyszukiwania', () => {
		expect(resolver.describeSearchKeywords('ITWR_STRSTONEPLATE1_ADDON')).toContain('siła');
		expect(resolver.describeSearchKeywords('ITWR_ONEHSTONEPLATE1_ADDON')).toContain('jednoręczna');
		expect(resolver.describeSearchKeywords('ITMW_1H_SWORD')).toBe('');
	});
});
