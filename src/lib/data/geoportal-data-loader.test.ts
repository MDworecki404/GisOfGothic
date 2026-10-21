import { describe, expect, it } from 'vitest';
import { GeoportalDataLoader } from './geoportal-data-loader.js';
import { parseMetadata, parseSearchIndex } from './parsers.js';

const metadataJson = {
	game: 'g2nk',
	world: 'NEWWORLD',
	anchor: { lon: 0, lat: 0, h: 0 },
	axes: { east: '+X', unit_cm: true },
	gltf_axes: 'glTF = (E, U, -N)',
	package: { version: 1, counts: { search_items: 1 }, files: ['world.glb'] }
};

const searchIndexJson = {
	version: 1,
	entries: [
		{
			id: 'item:X',
			type: 'item',
			code: 'X',
			name: 'Amulet',
			category: 'Magia',
			total: 1,
			places: [{ kind: 'ground', lon: 0.001, lat: 0.002, h: 5, label: 'na ziemi', ref: 'item-1' }]
		},
		{
			id: 'character:Y',
			type: 'character',
			code: 'Y',
			name: 'Harad',
			category: 'VLK',
			level: 30,
			places: [{ kind: 'spawn', lon: 0, lat: 0, h: 0, label: 'pojawia się', chapter: null }]
		}
	]
};

function createLoaderServing(body: unknown, status = 200): GeoportalDataLoader {
	return new GeoportalDataLoader(
		'/data/test',
		async () => new Response(JSON.stringify(body), { status })
	);
}

describe('parsery danych', () => {
	it('parsuje metadata razem z kotwicą', () => {
		expect(parseMetadata(metadataJson).anchor).toEqual({ lon: 0, lat: 0, h: 0 });
	});

	it('odrzuca metadata bez kotwicy', () => {
		expect(() => parseMetadata({ ...metadataJson, anchor: undefined })).toThrow(/anchor/);
	});

	it('parsuje indeks wyszukiwania wraz z miejscami', () => {
		const index = parseSearchIndex(searchIndexJson);
		expect(index.entries[0].places[0].kind).toBe('ground');
		expect(index.entries[1].places[0].chapter).toBeNull();
	});

	it('dopuszcza wpis bez kategorii', () => {
		const entry = { ...searchIndexJson.entries[0], category: null };
		expect(parseSearchIndex({ version: 1, entries: [entry] }).entries[0].category).toBeNull();
	});

	it('czyta wpis questa ze zleceniodawcą, rozdziałem i rolą miejsca', () => {
		const quest = {
			id: 'quest:TOPIC_X',
			type: 'quest',
			code: 'TOPIC_X',
			name: 'Piracki handel',
			category: 'Misja',
			giver: 'Skip',
			chapter: null,
			places: [{ kind: 'spawn', lon: 0, lat: 0, h: 1, label: 'pojawia się (NW)', role: 'giver' }]
		};
		const [entry] = parseSearchIndex({ version: 1, entries: [quest] }).entries;
		expect(entry).toMatchObject({ type: 'quest', giver: 'Skip', chapter: null });
		expect(entry.places[0].role).toBe('giver');
	});

	it('odrzuca wpis o nieznanym typie', () => {
		const broken = { version: 1, entries: [{ ...searchIndexJson.entries[0], type: 'monster' }] };
		expect(() => parseSearchIndex(broken)).toThrow(/wpis #0/);
	});

	it('odrzuca miejsce o nieznanym rodzaju', () => {
		const entry = { ...searchIndexJson.entries[0], places: [{ kind: 'teleport' }] };
		expect(() => parseSearchIndex({ version: 1, entries: [entry] })).toThrow(/rodzaj/);
	});
});

describe('GeoportalDataLoader', () => {
	it('wczytuje metadata i indeks oraz liczy wpisy według typu', async () => {
		const loader = createLoaderServing(searchIndexJson);
		const index = await loader.loadSearchIndex();
		expect(loader.countEntriesByType(index)).toEqual({ items: 1, characters: 1, quests: 0 });
		expect((await createLoaderServing(metadataJson).loadMetadata()).world).toBe('NEWWORLD');
	});

	it('zgłasza błąd HTTP', async () => {
		await expect(createLoaderServing({}, 404).loadSearchIndex()).rejects.toThrow(/404/);
	});
});
