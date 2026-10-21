import { describe, expect, it } from 'vitest';
import { EncyclopediaLinkBuilder } from './encyclopedia-link-builder.js';

describe('EncyclopediaLinkBuilder', () => {
	const builder = new EncyclopediaLinkBuilder();

	it('kieruje do wyszukiwarki Gothicpedii z nazwą postaci', () => {
		expect(builder.buildCharacterSearchUrl('Harad')).toBe(
			'https://gothic.fandom.com/pl/wiki/Special:Search?query=Harad'
		);
	});

	it('zamienia spacje i polskie znaki na bezpieczny zapis', () => {
		expect(builder.buildCharacterSearchUrl('Pan cienia Inubis')).toBe(
			'https://gothic.fandom.com/pl/wiki/Special:Search?query=Pan+cienia+Inubis'
		);
		expect(builder.buildCharacterSearchUrl('Żwirek & Muchomorek')).toContain(
			'query=%C5%BBwirek+%26+Muchomorek'
		);
	});
});
