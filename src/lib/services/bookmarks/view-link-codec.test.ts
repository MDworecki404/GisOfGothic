import { describe, expect, it } from 'vitest';
import { ViewLinkCodec } from './view-link-codec.js';

const codec = new ViewLinkCodec();
const camera = { east: 10, north: 20, height: 300, headingDegrees: 90, pitchDegrees: -45 };

describe('ViewLinkCodec', () => {
	it('domyślny widok daje pusty adres', () => {
		expect(codec.buildQuery({ entryId: null, camera: null, toolId: 'search', chapter: null })).toBe(
			''
		);
	});

	it('zapisuje wpis, kamerę i narzędzie, a odczyt je odtwarza', () => {
		const state = {
			entryId: 'item:ITPL_PERM_HERB',
			camera,
			toolId: 'measure',
			chapter: 3
		} as const;
		const query = codec.buildQuery(state);
		expect(query).toBe(
			'?wpis=item%3AITPL_PERM_HERB&widok=10_20_300_90_-45&narzedzie=measure&rozdzial=3'
		);
		expect(codec.parseQuery(query)).toEqual(state);
	});

	it('zamknięty panel to osobna wartość', () => {
		const query = codec.buildQuery({ entryId: null, camera: null, toolId: null, chapter: null });
		expect(query).toBe('?narzedzie=zamkniete');
		expect(codec.parseQuery(query).toolId).toBeNull();
	});

	it('brak parametrów daje wyszukiwarkę i brak kamery', () => {
		expect(codec.parseQuery('')).toEqual({
			entryId: null,
			camera: null,
			toolId: 'search',
			chapter: null
		});
	});

	it('ignoruje uszkodzoną kamerę i nieznane narzędzie, zostawiając resztę', () => {
		expect(codec.parseQuery('?wpis=a&widok=zepsute&narzedzie=hologram')).toEqual({
			entryId: 'a',
			camera: null,
			toolId: 'search',
			chapter: null
		});
	});

	it('ignoruje rozdział spoza zakresu 1–6', () => {
		expect(codec.parseQuery('?rozdzial=9').chapter).toBeNull();
		expect(codec.parseQuery('?rozdzial=abc').chapter).toBeNull();
		expect(codec.parseQuery('?rozdzial=6').chapter).toBe(6);
	});
});
