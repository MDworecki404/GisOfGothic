import { describe, expect, it } from 'vitest';
import { parseCharacterModelParts, parseSearchIndex } from './parsers.js';

describe('parseCharacterModelParts', () => {
	it('czyta części postaci', () => {
		expect(
			parseCharacterModelParts({
				body: null,
				head: 'characters/head.glb',
				armor: 'characters/armor.glb',
				weapon: 'previews/sword.glb'
			})
		).toEqual({
			body: null,
			head: 'characters/head.glb',
			armor: 'characters/armor.glb',
			weapon: 'previews/sword.glb'
		});
	});

	it('zwraca null dla null, tekstu i obiektu bez korpusu', () => {
		expect(parseCharacterModelParts(null)).toBeNull();
		expect(parseCharacterModelParts('previews/x.glb')).toBeNull();
		expect(
			parseCharacterModelParts({ body: null, head: null, armor: null, weapon: 'a.glb' })
		).toBeNull();
	});

	it('wpis postaci w indeksie dostaje części, a wpis przedmiotu zachowuje ścieżkę', () => {
		const index = parseSearchIndex({
			version: 1,
			entries: [
				{
					id: 'character:A',
					type: 'character',
					code: 'A',
					name: 'Abuyin',
					category: null,
					model: { body: 'characters/b.glb', head: null, armor: null, weapon: null },
					places: []
				},
				{
					id: 'item:B',
					type: 'item',
					code: 'B',
					name: 'Miecz',
					category: null,
					model: 'previews/b.glb',
					places: []
				}
			]
		});
		const [character, item] = index.entries;
		expect(character?.characterModel?.body).toBe('characters/b.glb');
		expect(item?.model).toBe('previews/b.glb');
		expect(item?.characterModel).toBeUndefined();
	});
});
