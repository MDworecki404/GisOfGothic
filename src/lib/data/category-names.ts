const GUILD_NAMES: Readonly<Record<string, string>> = {
	VLK: 'Mieszczanin',
	MIL: 'Straż miejska',
	PAL: 'Paladyn',
	SLD: 'Najemnik',
	DJG: 'Łowca smoków',
	BAU: 'Chłop',
	NOV: 'Nowicjusz',
	KDF: 'Mag Ognia',
	KDW: 'Mag Wody',
	PIR: 'Pirat',
	BDT: 'Bandyta',
	OUT: 'Spoza gildii',
	HUMAN: 'Bez gildii',
	NONE: 'Bez gildii',
	TROLL: 'Troll',
	WOLF: 'Wilk',
	STONEGOLEM: 'Kamienny golem',
	ORC: 'Ork',
	SKELETON: 'Szkielet',
	SNAPPER: 'Zębacz'
};

const UNCATEGORISED = 'Bez kategorii';

/** Kategorie przedmiotów są już po polsku; postacie mają kod gildii, który zamieniamy na nazwę. */
export function describeCategory(category: string | null): string {
	if (category === null) return UNCATEGORISED;
	return GUILD_NAMES[category] ?? category;
}
