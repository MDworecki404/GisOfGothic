import { describe, expect, it } from 'vitest';
import { TOOL_DEFINITIONS } from './tool-definitions.js';

describe('TOOL_DEFINITIONS: grupy i pasek telefonu', () => {
	it('kolejność i grupy zgadzają się z makietą docka', () => {
		expect(TOOL_DEFINITIONS.map((tool) => `${tool.group}:${tool.id}`)).toEqual([
			'find:search',
			'find:layers',
			'measure:measure',
			'measure:analysis',
			'measure:sizes',
			'time:time',
			'time:notebook',
			'time:bookmarks'
		]);
	});

	it('na pasku telefonu są cztery narzędzia: Szukaj, Warstwy, Pomiary, Czas', () => {
		expect(TOOL_DEFINITIONS.filter((tool) => tool.isOnPhoneBar).map((tool) => tool.id)).toEqual([
			'search',
			'layers',
			'measure',
			'time'
		]);
	});

	it('narzędzia spoza paska telefonu trafiają do menu „Inne”', () => {
		expect(TOOL_DEFINITIONS.filter((tool) => !tool.isOnPhoneBar).map((tool) => tool.id)).toEqual([
			'analysis',
			'sizes',
			'notebook',
			'bookmarks'
		]);
	});

	it('identyfikatory są unikalne', () => {
		const identifiers = TOOL_DEFINITIONS.map((tool) => tool.id);
		expect(new Set(identifiers).size).toBe(identifiers.length);
	});

	it('tylko Szukaj otwiera Księgę, pozostałe narzędzia mają panel', () => {
		const book = TOOL_DEFINITIONS.filter((tool) => tool.presentation === 'book');
		expect(book.map((tool) => tool.id)).toEqual(['search']);
		expect(TOOL_DEFINITIONS.filter((tool) => tool.presentation === 'panel')).toHaveLength(
			TOOL_DEFINITIONS.length - 1
		);
	});
});
