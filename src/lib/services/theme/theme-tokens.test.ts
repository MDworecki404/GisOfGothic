import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ColorContrastCalculator } from './color-contrast-calculator.js';

const appCss = readFileSync(new URL('../../../app.css', import.meta.url), 'utf-8');
const calculator = new ColorContrastCalculator();

type ThemeMode = 'dark' | 'light';

const PALETTE_BLOCK_START: Record<ThemeMode, string> = {
	dark: '\n:root {',
	light: "\n:root[data-theme='light'] {"
};

function readPaletteBlock(mode: ThemeMode): string {
	const start = appCss.indexOf(PALETTE_BLOCK_START[mode]);
	if (start < 0) throw new Error(`Brak bloku palety trybu ${mode} w app.css`);
	return appCss.slice(start, appCss.indexOf('\n}', start));
}

function readColorToken(name: string, mode: ThemeMode): string {
	const match = new RegExp('--' + name + ': *(#[0-9a-fA-F]{6});').exec(readPaletteBlock(mode));
	if (!match) throw new Error(`Brak tokenu koloru --${name} w trybie ${mode}`);
	return match[1];
}

function readContrast(foregroundToken: string, backgroundToken: string, mode: ThemeMode): number {
	return calculator.calculateContrastRatio(
		readColorToken(foregroundToken, mode),
		readColorToken(backgroundToken, mode)
	);
}

describe.each<ThemeMode>(['dark', 'light'])('tokeny motywu „Atlas”, tryb %s', (mode) => {
	it('popiół na łupku i na wodzie ma kontrast co najmniej 7', () => {
		expect(readContrast('popiol', 'lupek', mode)).toBeGreaterThanOrEqual(7);
		expect(readContrast('popiol', 'woda', mode)).toBeGreaterThanOrEqual(7);
	});

	it('mgła, żar, bariera i krew na łupku mają kontrast co najmniej 4,5', () => {
		for (const token of ['mgla', 'zar', 'bariera', 'krew']) {
			expect(readContrast(token, 'lupek', mode), token).toBeGreaterThanOrEqual(4.5);
		}
	});

	it('żar i bariera na wodzie mają kontrast co najmniej 3 (elementy graficzne na mapie)', () => {
		expect(readContrast('zar', 'woda', mode)).toBeGreaterThanOrEqual(3);
		expect(readContrast('bariera', 'woda', mode)).toBeGreaterThanOrEqual(3);
	});

	it('tekst na żarze (na-zarze) ma kontrast co najmniej 4,5', () => {
		expect(readContrast('na-zarze', 'zar', mode)).toBeGreaterThanOrEqual(4.5);
	});

	it('ramka pól (żelazo) na łupku ma kontrast co najmniej 3', () => {
		expect(readContrast('zelazo', 'lupek', mode)).toBeGreaterThanOrEqual(3);
	});

	it('tryb definiuje wszystkie tokeny palety, które ma drugi tryb', () => {
		const otherMode: ThemeMode = mode === 'dark' ? 'light' : 'dark';
		const readNames = (block: string) =>
			[...block.matchAll(/--([a-z-]+):/g)].map((match) => match[1]);
		const paletteNames = readNames(readPaletteBlock('light'));
		const definedHere = new Set(readNames(readPaletteBlock(mode)));
		const definedThere = new Set(readNames(readPaletteBlock(otherMode)));
		for (const name of paletteNames.filter((token) => definedThere.has(token))) {
			expect(definedHere.has(name), name).toBe(true);
		}
	});
});

describe('pismo i tryby', () => {
	it('app.css nie importuje starych paczek pisma', () => {
		expect(appCss).not.toMatch(/grenze|alegreya|barlow/i);
		expect(appCss).not.toMatch(/uncial-antiqua|lexend/i);
		expect(appCss).toMatch(/@fontsource-variable\/cormorant\//);
		expect(appCss).toMatch(/@fontsource-variable\/inter\//);
	});

	it('jasny tryb jest pod atrybutem data-theme, a ciemny jest domyślny', () => {
		expect(appCss).toContain("[data-theme='light']");
		expect(appCss).toMatch(/:root \{\s*color-scheme: dark;/);
		expect(appCss).toMatch(/\[data-theme='light'\] \{\s*color-scheme: light;/);
	});
});

describe('klasy materiałów', () => {
	function readRuleBlock(selector: string): string {
		const selectorIndex = appCss.indexOf(selector);
		if (selectorIndex < 0) throw new Error(`Brak reguły ${selector} w app.css`);
		const blockStart = appCss.indexOf('{', selectorIndex);
		return appCss.slice(blockStart, appCss.indexOf('}', blockStart));
	}

	it.each(['.button-iron', '.button-ochre', '.button-quiet', '.button-ink'])(
		'przycisk %s ma widoczny fokus',
		(selector) => {
			expect(readRuleBlock(`${selector}:focus-visible`)).toContain('outline: 2px solid');
		}
	);

	it('żadna klasa nie używa backdrop-filter', () => {
		expect(appCss).not.toContain('backdrop-filter');
	});

	it('płyta ma zaokrąglone rogi i cień, a nie ścięty róg', () => {
		const plate = readRuleBlock('.material-leather,');
		expect(plate).toContain('border-radius');
		expect(plate).toContain('box-shadow');
		expect(appCss).not.toContain('clip-path');
	});

	it('klasy komponentów nie używają surowych kolorów', () => {
		const components = appCss.slice(appCss.indexOf('@layer components'));
		expect(components).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
		expect(components).not.toMatch(/rgb\(\s*\d/);
	});

	it('tło pod mapą to woda', () => {
		expect(readRuleBlock('.map-parchment {')).toContain('var(--woda)');
	});
});
