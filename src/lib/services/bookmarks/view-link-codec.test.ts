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
				toolId: null,
				chapter: null,
				projection: null,
				viewMode: 'view-3d',
				sliceHeightMetres: null,
				route: null
			})
		).toBe('');
	});

	it('zapisuje wpis, kamerę i narzędzie, a odczyt je odtwarza', () => {
		const state = {
			entryId: 'item:ITPL_PERM_HERB',
			camera,
			toolId: 'measure',
			chapter: 3,
			projection: null,
			viewMode: 'view-3d',
			sliceHeightMetres: null,
			route: null
		} as const;
		const query = codec.buildQuery(state);
		expect(query).toBe(
			'?wpis=item%3AITPL_PERM_HERB&widok=10_20_300_90_-45&narzedzie=measure&rozdzial=3'
		);
		expect(codec.parseQuery(query)).toEqual(state);
	});

	it('brak narzędzia nie dodaje parametru, a stary zamkniete nadal działa', () => {
		const query = codec.buildQuery({
			entryId: null,
			camera: null,
			toolId: null,
			chapter: null,
			projection: null,
			viewMode: 'view-3d',
			sliceHeightMetres: null,
			route: null
		});
		expect(query).toBe('');
		expect(codec.parseQuery('?narzedzie=zamkniete').toolId).toBeNull();
	});

	it('Księga (narzędzie search) zapisuje narzedzie=search i wraca z adresu', () => {
		const query = codec.buildQuery({
			entryId: null,
			camera: null,
			toolId: 'search',
			chapter: null,
			projection: null,
			viewMode: 'view-3d',
			sliceHeightMetres: null,
			route: null
		});
		expect(query).toBe('?narzedzie=search');
		expect(codec.parseQuery(query).toolId).toBe('search');
	});

	it('adres bez parametru narzedzie nie otwiera żadnego narzędzia', () => {
		expect(codec.parseQuery('?wpis=item%3AX').toolId).toBeNull();
	});

	it('brak parametrów daje brak narzędzia i brak kamery', () => {
		expect(codec.parseQuery('')).toEqual({
			entryId: null,
			camera: null,
			toolId: null,
			chapter: null,
			projection: null,
			viewMode: 'view-3d',
			sliceHeightMetres: null,
			route: null
		});
	});

	it('ignoruje uszkodzoną kamerę i nieznane narzędzie, zostawiając resztę', () => {
		expect(codec.parseQuery('?wpis=a&widok=zepsute&narzedzie=hologram')).toEqual({
			entryId: 'a',
			camera: null,
			toolId: null,
			chapter: null,
			projection: null,
			viewMode: 'view-3d',
			sliceHeightMetres: null,
			route: null
		});
	});

	it('ignoruje rozdział spoza zakresu 1–6', () => {
		expect(codec.parseQuery('?rozdzial=9').chapter).toBeNull();
		expect(codec.parseQuery('?rozdzial=abc').chapter).toBeNull();
		expect(codec.parseQuery('?rozdzial=6').chapter).toBe(6);
	});

	describe('rzut kamery', () => {
		const base = {
			entryId: null,
			camera: null,
			toolId: null,
			chapter: null,
			viewMode: 'view-3d',
			sliceHeightMetres: null,
			route: null
		} as const;

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

describe('ViewLinkCodec: widok 2D', () => {
	const base = {
		entryId: null,
		camera: null,
		toolId: null,
		chapter: null,
		projection: null,
		route: null
	} as const;

	it('2D bez cięcia daje sam parametr trybu', () => {
		expect(codec.buildQuery({ ...base, viewMode: 'view-2d', sliceHeightMetres: null })).toBe(
			'?tryb=2d'
		);
	});

	it('cięcie jest zaokrąglone do 0,1 m i odczytane z adresu', () => {
		const query = codec.buildQuery({ ...base, viewMode: 'view-2d', sliceHeightMetres: 120.46 });
		expect(query).toBe('?tryb=2d&ciecie=120.5');
		expect(codec.parseQuery(query)).toMatchObject({
			viewMode: 'view-2d',
			sliceHeightMetres: 120.5
		});
	});

	it('cięcie w 3D nie trafia do adresu', () => {
		expect(codec.buildQuery({ ...base, viewMode: 'view-3d', sliceHeightMetres: 50 })).toBe('');
	});

	it('cięcie bez trybu 2D jest ignorowane', () => {
		expect(codec.parseQuery('?ciecie=50')).toMatchObject({
			viewMode: 'view-3d',
			sliceHeightMetres: null,
			route: null
		});
		expect(codec.parseQuery('?tryb=3d&ciecie=50').viewMode).toBe('view-3d');
	});

	it('uszkodzone cięcie jest ignorowane, a tryb 2D zostaje', () => {
		for (const broken of ['abc', 'NaN', 'Infinity', '-Infinity', '']) {
			expect(codec.parseQuery(`?tryb=2d&ciecie=${broken}`)).toMatchObject({
				viewMode: 'view-2d',
				sliceHeightMetres: null,
				route: null
			});
		}
	});

	it('ujemna wysokość cięcia jest poprawna', () => {
		expect(codec.parseQuery('?tryb=2d&ciecie=-12.5').sliceHeightMetres).toBe(-12.5);
	});
});

describe('ViewLinkCodec: trasa', () => {
	const baseState = {
		entryId: null,
		camera: null,
		toolId: 'measure',
		chapter: null,
		projection: null,
		viewMode: 'view-3d',
		sliceHeightMetres: null,
		route: null
	} as const;
	const route = {
		start: { east: 10, north: 20, height: 1 },
		end: { east: 30, north: 40, height: 2 }
	};

	it('zapisuje trasę w parametrze trasa, a odczyt ją odtwarza', () => {
		const query = codec.buildQuery({ ...baseState, route });
		expect(new URLSearchParams(query).get('trasa')).toBe('10_20_1~30_40_2');
		expect(codec.parseQuery(query).route).toEqual(route);
	});

	it('pomija parametr trasa bez trasy', () => {
		expect(codec.buildQuery({ ...baseState, route: null })).not.toContain('trasa');
	});

	it('ignoruje zepsuty parametr trasa i zostawia resztę widoku', () => {
		const state = codec.parseQuery('?narzedzie=measure&trasa=NaN_1_2~3&rozdzial=2');
		expect(state.route).toBeNull();
		expect(state.toolId).toBe('measure');
		expect(state.chapter).toBe(2);
	});
});
