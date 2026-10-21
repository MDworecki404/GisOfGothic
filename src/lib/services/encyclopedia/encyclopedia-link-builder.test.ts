import { describe, expect, it } from 'vitest';
import { EncyclopediaLinkBuilder } from './encyclopedia-link-builder.js';

describe('EncyclopediaLinkBuilder', () => {
	const builder = new EncyclopediaLinkBuilder();

	it('kieruje do wyszukiwarki Gothicpedii z nazwą hasła', () => {
		expect(builder.buildSearchUrl('Harad')).toBe(
			'https://gothic.fandom.com/pl/wiki/Special:Search?query=Harad'
		);
	});

	it('zamienia spacje i polskie znaki na bezpieczny zapis', () => {
		expect(builder.buildSearchUrl('Pan cienia Inubis')).toBe(
			'https://gothic.fandom.com/pl/wiki/Special:Search?query=Pan+cienia+Inubis'
		);
		expect(builder.buildSearchUrl('Żwirek & Muchomorek')).toContain(
			'query=%C5%BBwirek+%26+Muchomorek'
		);
	});
});
