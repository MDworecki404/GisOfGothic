import { describe, expect, it } from 'vitest';
import { guildNameBook } from '#lib/data/category-names.js';
import type { SearchEntry } from '#lib/data/types.js';
import { SearchEntryPresenter } from './search-entry-presenter.js';
import { normalizeSearchTerm, SearchService } from './search-service.js';

function createItem(id: string, name: string, category: string, total: number): SearchEntry {
	return {
		id: `item:${id}`,
		type: 'item',
		code: id,
		name,
		category,
		total,
		places: [
			{ kind: 'ground', lon: 0, lat: 0, h: 1, label: 'na ziemi', amount: 1 },
			{
				kind: 'npc',
				lon: 0,
				lat: 0,
				h: 1,
				label: 'u NPC: Baltram',
				amount: 2,
				certainty: 'possible'
			}
		]
	};
}

const harad: SearchEntry = {
	id: 'character:VLK_412_HARAD',
	type: 'character',
	code: 'VLK_412_HARAD',
	name: 'Harad',
	category: 'VLK',
	level: 30,
	places: [{ kind: 'routine', lon: 0, lat: 0, h: 0, label: '07:00–21:30', routine: 'START' }]
};

guildNameBook.useGuildNames({ VLK: 'Mieszczanin' });

const hodgesQuest: SearchEntry = {
	id: 'quest:TOPIC_RESCUEBENNET',
	type: 'quest',
	code: 'TOPIC_RESCUEBENNET',
	name: 'Bennet siedzi w więzieniu',
	category: 'Misja',
	giver: 'Hodges',
	chapter: 3,
	places: [
		{ kind: 'spawn', lon: 0, lat: 0, h: 1, label: 'pojawia się (BIGFARM)', role: 'giver' },
		{ kind: 'routine', lon: 0, lat: 0, h: 1, label: '07:00–19:00', role: 'target' }
	]
};

const service = new SearchService({
	version: 1,
	entries: [
		createItem('ITPL_HEALTH_HERB_02', 'Ziele lecznicze', 'Rośliny', 132),
		createItem('ITPL_HEALTH_HERB_01', 'Roślina lecznicza', 'Rośliny', 328),
		createItem('ITMI_KEY', 'Klucz do kufra', 'Różne', 1),
		createItem('ITWR_STRSTONEPLATE1_ADDON', 'Kamienna tablica siły I', 'Dokumenty', 2),
		createItem('ITWR_DEXSTONEPLATE1_ADDON', 'Kamienna tablica zręczności I', 'Dokumenty', 1),
		createItem(
			'ITWR_ONEHSTONEPLATE1_ADDON',
			'Kamienna tablica walki bronią jednoręczną I',
			'Dokumenty',
			2
		),
		harad,
		hodgesQuest
	]
});

function findNames(
	query: string,
	filter: 'all' | 'item' | 'character' | 'quest' = 'all'
): string[] {
	return service.search(query, filter).map((entry) => entry.name);
}

describe('SearchService', () => {
	it('zdejmuje polskie znaki i wielkie litery', () => {
		expect(normalizeSearchTerm('Łowca Smoków')).toBe('lowca smokow');
	});

	it('znajduje po początku słowa i bez polskich znaków', () => {
		expect(findNames('leczn')).toEqual(
			expect.arrayContaining(['Ziele lecznicze', 'Roślina lecznicza'])
		);
		expect(findNames('roslina')[0]).toBe('Roślina lecznicza');
	});

	it('wybacza literówkę w dłuższym słowie', () => {
		expect(findNames('lecznicza')).toContain('Roślina lecznicza');
		expect(findNames('kluscz')).toContain('Klucz do kufra');
	});

	it('szuka postaci po nazwie gildii i filtruje rodzaj', () => {
		expect(findNames('mieszczanin')).toEqual(['Harad']);
		expect(findNames('harad', 'item')).toEqual([]);
	});

	it('znajduje kamienną tablicę po atrybucie w mianowniku', () => {
		expect(findNames('siła')).toEqual(['Kamienna tablica siły I']);
		expect(findNames('zrecznosc')).toEqual(['Kamienna tablica zręczności I']);
		expect(findNames('jednoreczna')).toEqual(['Kamienna tablica walki bronią jednoręczną I']);
		expect(findNames('tablica')).toHaveLength(3);
	});

	it('znajduje quest po nazwie i po zleceniodawcy, a filtr rodzaju go wyodrębnia', () => {
		expect(findNames('bennet', 'quest')).toEqual(['Bennet siedzi w więzieniu']);
		expect(findNames('hodges')).toEqual(['Bennet siedzi w więzieniu']);
	});

	it('pusty tekst nie daje wyników', () => {
		expect(findNames('   ')).toEqual([]);
	});
});

describe('SearchEntryPresenter', () => {
	const presenter = new SearchEntryPresenter();

	it('składa logiczną ścieżkę podglądu z przestrzeni świata i pola model', () => {
		const withModel = { ...createItem('X', 'Ziele', 'Rośliny', 1), model: 'previews/ziele.glb' };
		expect(presenter.presentDetails(withModel, 'g2nk/khorinis').modelPath).toBe(
			'g2nk/khorinis/previews/ziele.glb'
		);
		expect(
			presenter.presentDetails(createItem('Y', 'Łuk', 'Broń', 1), 'g2nk/khorinis').modelPath
		).toBeNull();
	});

	it('opisuje przedmiot: liczba sztuk i rozkład według miejsc', () => {
		const details = presenter.presentDetails(
			createItem('X', 'Ziele lecznicze', 'Rośliny', 3),
			'g2nk/khorinis'
		);
		expect(details.facts).toEqual([
			{ label: 'sztuk w świecie', value: '3' },
			{ label: 'na ziemi', value: '1' },
			{ label: 'u postaci', value: '2' }
		]);
		expect(details.places[1]).toMatchObject({ description: 'U NPC: Baltram', isUncertain: true });
	});

	it('daje link do Gothicpedii tylko dla postaci', () => {
		expect(presenter.presentDetails(harad, 'g2nk/khorinis').encyclopediaUrl).toBe(
			'https://gothic.fandom.com/pl/wiki/Special:Search?query=Harad'
		);
		expect(
			presenter.presentDetails(createItem('X', 'Ziele', 'Rośliny', 1), 'g2nk/khorinis')
				.encyclopediaUrl
		).toBeNull();
	});

	it('opisuje quest: zleceniodawca, rozdział i role miejsc', () => {
		const details = presenter.presentDetails(hodgesQuest, 'g2nk/khorinis');
		expect(details.facts).toEqual([
			{ label: 'zleceniodawca', value: 'Hodges' },
			{ label: 'rozdział', value: '3' }
		]);
		expect(details.places.map((place) => place.kindLabel)).toEqual(['Zleceniodawca', 'Cel questa']);
		expect(details.encyclopediaUrl).toContain('Bennet+siedzi');
		expect(presenter.presentResult(hodgesQuest)).toMatchObject({
			categoryLabel: 'Misja',
			summary: 'rozdz. 3'
		});
	});

	it('zamienia kod gildii postaci na nazwę', () => {
		expect(presenter.presentResult(harad)).toMatchObject({
			categoryLabel: 'Mieszczanin',
			summary: 'poz. 30'
		});
	});
});
