interface StonePlateAttribute {
	genitiveLabel: string;
	searchKeywords: string;
}

const STONE_PLATE_CODE = /^ITWR_([A-Z]+)STONEPLATE(\d+)_ADDON$/;

const ATTRIBUTES_BY_CODE_PART: Readonly<Record<string, StonePlateAttribute>> = {
	STR: { genitiveLabel: 'siły', searchKeywords: 'siła siły' },
	DEX: { genitiveLabel: 'zręczności', searchKeywords: 'zręczność zręczności' },
	ONEH: {
		genitiveLabel: 'walki bronią jednoręczną',
		searchKeywords: 'jednoręczna jednoręczną broń walka walki'
	},
	TWOH: {
		genitiveLabel: 'walki bronią dwuręczną',
		searchKeywords: 'dwuręczna dwuręczną broń walka walki'
	},
	BOW: { genitiveLabel: 'walki łukiem', searchKeywords: 'łuk łukiem walka walki' },
	CRSBOW: { genitiveLabel: 'walki kuszą', searchKeywords: 'kusza kuszą walka walki' },
	HITPOINT: { genitiveLabel: 'życia', searchKeywords: 'życie życia punkty' },
	MANA: { genitiveLabel: 'many', searchKeywords: 'mana many' }
};

const ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V'];

/**
 * Kamienne tablice z dodatku w danych gry mają jedną nazwę („Kamienna tablica”),
 * a atrybut i stopień wynikają tylko z kodu (np. `ITWR_STRSTONEPLATE2_ADDON`).
 * Klasa składa z kodu nazwę widoczną w aplikacji i słowa kluczowe dla wyszukiwarki.
 */
export class StonePlateNameResolver {
	resolveDisplayName(code: string, originalName: string): string {
		const plate = this.parseStonePlate(code);
		if (!plate) return originalName;
		const grade = ROMAN_NUMERALS[plate.grade - 1] ?? String(plate.grade);
		return `${originalName} ${plate.attribute.genitiveLabel} ${grade}`;
	}

	describeSearchKeywords(code: string): string {
		return this.parseStonePlate(code)?.attribute.searchKeywords ?? '';
	}

	private parseStonePlate(code: string): { attribute: StonePlateAttribute; grade: number } | null {
		const match = STONE_PLATE_CODE.exec(code);
		if (!match) return null;
		const attribute = ATTRIBUTES_BY_CODE_PART[match[1]];
		if (!attribute) return null;
		return { attribute, grade: Number(match[2]) };
	}
}

export const stonePlateNameResolver = new StonePlateNameResolver();
