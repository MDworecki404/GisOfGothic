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

	it('pomija wpis bez nazwy i bez kodu, a wpis z samym kodem zostawia', () => {
		const nameless = { ...searchIndexJson.entries[0], id: 'item:', code: '', name: '' };
		const codeOnly = { ...searchIndexJson.entries[0], id: 'item:Z', code: 'Z', name: '' };
		const { entries } = parseSearchIndex({ version: 1, entries: [nameless, codeOnly] });
		expect(entries.map((entry) => entry.code)).toEqual(['Z']);
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

describe('parseMetadata', () => {
	it('czyta prędkości ruchu bohatera i zwraca je w m/s', () => {
		const speeds = { walk: 1.43, run: 3.45, sneak: 0.77, walk_armed: 1.95 };
		const metadata = parseMetadata({ ...metadataJson, movement_speeds_m_s: speeds });
		expect(metadata.movement_speeds_m_s).toEqual({
			walk: 1.43,
			run: 3.45,
			sneak: 0.77,
			walkArmed: 1.95
		});
	});

	it('czyta nazwy gildii świata i pomija wpisy niebędące tekstem', () => {
		const metadata = parseMetadata({
			...metadataJson,
			guild_names: { GRD: 'Strażnik', STT: 'Cień', BROKEN: 5 }
		});
		expect(metadata.guild_names).toEqual({ GRD: 'Strażnik', STT: 'Cień' });
		expect(parseMetadata(metadataJson).guild_names).toBeUndefined();
	});

	it('starsza paczka bez prędkości albo z niepełnymi prędkościami nie ma pola', () => {
		expect(parseMetadata(metadataJson).movement_speeds_m_s).toBeUndefined();
		const incomplete = { ...metadataJson, movement_speeds_m_s: { walk: 1.43 } };
		expect(parseMetadata(incomplete).movement_speeds_m_s).toBeUndefined();
	});
});

function createLoaderServingFiles(files: Record<string, unknown>): GeoportalDataLoader {
	return new GeoportalDataLoader('/data/test', async (url) => {
		const body = files[url.slice('/data/test/'.length)];
		return body === undefined
			? new Response('', { status: 404 })
			: new Response(JSON.stringify(body), { status: 200 });
	});
}

const locationsJson = {
	version: 1,
	locations: [
		{
			id: 'location:OC',
			kind: 'camp',
			name: 'Stary Obóz',
			name_source: 'derived',
			code: 'OC',
			center: [0.001, 0.002, 5],
			radius_m: 50,
			waypoint: null
		}
	]
};

describe('GeoportalDataLoader', () => {
	it('dokłada lokacje do indeksu wyszukiwania i liczy je osobno', async () => {
		const loader = createLoaderServingFiles({
			'search_index.json': searchIndexJson,
			'locations.json': locationsJson
		});
		const index = await loader.loadSearchIndex();
		expect(loader.countEntriesByType(index)).toEqual({
			items: 1,
			characters: 1,
			quests: 0,
			locations: 1
		});
		expect(index.entries.at(-1)).toMatchObject({ id: 'location:OC', type: 'location' });
	});

	it('wczytuje indeks świata bez pliku lokacji', async () => {
		const loader = createLoaderServingFiles({ 'search_index.json': searchIndexJson });
		expect((await loader.loadSearchIndex()).entries).toHaveLength(2);
	});

	it('wczytuje metadata i indeks oraz liczy wpisy według typu', async () => {
		const loader = createLoaderServingFiles({ 'search_index.json': searchIndexJson });
		const index = await loader.loadSearchIndex();
		expect(loader.countEntriesByType(index)).toEqual({
			items: 1,
			characters: 1,
			quests: 0,
			locations: 0
		});
		expect((await createLoaderServing(metadataJson).loadMetadata()).world).toBe('NEWWORLD');
	});

	it('zgłasza błąd HTTP', async () => {
		await expect(createLoaderServing({}, 404).loadSearchIndex()).rejects.toThrow(/404/);
	});
});

describe('GeoportalDataLoader: sieć waypointów', () => {
	const networkJson = {
		version: 1,
		game: 'g2nk',
		world: 'NEWWORLD',
		nodes: [
			['A', 0, 0, 0, 0],
			['B', 0.001, 0, 0, 0]
		],
		edges: [[0, 1]]
	};

	it('ładuje sieć z waypoints.json', async () => {
		const requestedUrls: string[] = [];
		const loader = new GeoportalDataLoader('/data/test', async (url) => {
			requestedUrls.push(url);
			return new Response(JSON.stringify(networkJson));
		});
		const network = await loader.loadWaypointNetwork();
		expect(requestedUrls).toEqual(['/data/test/waypoints.json']);
		expect(network?.nodes).toHaveLength(2);
	});

	it('zwraca null przy HTTP 404 (świat bez sieci)', async () => {
		await expect(createLoaderServing({}, 404).loadWaypointNetwork()).resolves.toBeNull();
	});

	it('rzuca błąd przy HTTP 500', async () => {
		await expect(createLoaderServing({}, 500).loadWaypointNetwork()).rejects.toThrow(/500/);
	});
});
