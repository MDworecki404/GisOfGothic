import { describe, expect, it } from 'vitest';
import { ViewLinkCodec } from './view-link-codec.js';

const codec = new ViewLinkCodec();
const camera = { east: 10, north: 20, height: 300, headingDegrees: 90, pitchDegrees: -45 };

describe('ViewLinkCodec', () => {
	it('domyślny widok daje pusty adres', () => {
		expect(
			codec.buildQuery({
				entryId: null,
				camera: null,
				toolId: 'search',
				chapter: null,
				projection: null
			})
		).toBe('');
	});

	it('zapisuje wpis, kamerę i narzędzie, a odczyt je odtwarza', () => {
		const state = {
			entryId: 'item:ITPL_PERM_HERB',
			camera,
			toolId: 'measure',
			chapter: 3,
			projection: null
		} as const;
		const query = codec.buildQuery(state);
		expect(query).toBe(
			'?wpis=item%3AITPL_PERM_HERB&widok=10_20_300_90_-45&narzedzie=measure&rozdzial=3'
		);
		expect(codec.parseQuery(query)).toEqual(state);
	});

	it('zamknięty panel to osobna wartość', () => {
		const query = codec.buildQuery({
			entryId: null,
			camera: null,
			toolId: null,
			chapter: null,
			projection: null
		});
		expect(query).toBe('?narzedzie=zamkniete');
		expect(codec.parseQuery(query).toolId).toBeNull();
	});

	it('brak parametrów daje wyszukiwarkę i brak kamery', () => {
		expect(codec.parseQuery('')).toEqual({
			entryId: null,
			camera: null,
			toolId: 'search',
			chapter: null,
			projection: null
		});
	});

	it('ignoruje uszkodzoną kamerę i nieznane narzędzie, zostawiając resztę', () => {
		expect(codec.parseQuery('?wpis=a&widok=zepsute&narzedzie=hologram')).toEqual({
			entryId: 'a',
			camera: null,
			toolId: 'search',
			chapter: null,
			projection: null
		});
	});

	it('ignoruje rozdział spoza zakresu 1–6', () => {
		expect(codec.parseQuery('?rozdzial=9').chapter).toBeNull();
		expect(codec.parseQuery('?rozdzial=abc').chapter).toBeNull();
		expect(codec.parseQuery('?rozdzial=6').chapter).toBe(6);
	});

	describe('rzut kamery', () => {
		const base = { entryId: null, camera: null, toolId: 'search', chapter: null } as const;

		it('rzut ortogonalny i perspektywa z niedomyślnym FOV trafiają do adresu', () => {
			expect(codec.buildQuery({ ...base, projection: { kind: 'orthographic' } })).toBe('?rzut=o');
			expect(
				codec.buildQuery({ ...base, projection: { kind: 'perspective', fovDegrees: 75 } })
			).toBe('?rzut=p_75');
		});

		it('rzut domyślny i brak rzutu nie dodają parametru', () => {
			expect(codec.buildQuery({ ...base, projection: null })).toBe('');
			expect(
				codec.buildQuery({ ...base, projection: { kind: 'perspective', fovDegrees: 60 } })
			).toBe('');
		});

		it('odczytuje rzut z adresu', () => {
			expect(codec.parseQuery('?rzut=o').projection).toEqual({ kind: 'orthographic' });
			expect(codec.parseQuery('?rzut=p_75').projection).toEqual({
				kind: 'perspective',
				fovDegrees: 75
			});
		});

		it('uszkodzony rzut jest ignorowany, a reszta widoku odtworzona', () => {
			const state = codec.parseQuery('?widok=10_20_300_90_-45&rzut=p_5');
			expect(state.projection).toBeNull();
			expect(state.camera).toEqual(camera);
		});

		it('stary link bez rzutu daje rzut domyślny', () => {
			expect(codec.parseQuery('?widok=10_20_300_90_-45').projection).toBeNull();
		});
	});
});
