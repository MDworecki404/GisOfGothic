import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ColorContrastCalculator } from './color-contrast-calculator.js';

const appCss = readFileSync(new URL('../../../app.css', import.meta.url), 'utf-8');
const calculator = new ColorContrastCalculator();

function readColorToken(name: string): string {
	const match = new RegExp('--' + name + ': *(#[0-9a-fA-F]{6});').exec(appCss);
	if (!match) throw new Error(`Brak tokenu koloru --${name} w app.css`);
	return match[1];
}

function readContrast(foregroundToken: string, backgroundToken: string): number {
	return calculator.calculateContrastRatio(
		readColorToken(foregroundToken),
		readColorToken(backgroundToken)
	);
}

describe('tokeny motywu „latarnia w kopalni”', () => {
	it('popiół na łupku i na wodzie ma kontrast co najmniej 7', () => {
		expect(readContrast('popiol', 'lupek')).toBeGreaterThanOrEqual(7);
		expect(readContrast('popiol', 'woda')).toBeGreaterThanOrEqual(7);
	});

	it('mgła, żar, bariera i krew na łupku mają kontrast co najmniej 4,5', () => {
		for (const token of ['mgla', 'zar', 'bariera', 'krew']) {
			expect(readContrast(token, 'lupek'), token).toBeGreaterThanOrEqual(4.5);
		}
	});

	it('żar i bariera na wodzie mają kontrast co najmniej 4,5', () => {
		expect(readContrast('zar', 'woda')).toBeGreaterThanOrEqual(4.5);
		expect(readContrast('bariera', 'woda')).toBeGreaterThanOrEqual(4.5);
	});

	it('tekst na żarze (primary-foreground) ma kontrast co najmniej 4,5', () => {
		expect(readContrast('primary-foreground', 'zar')).toBeGreaterThanOrEqual(4.5);
	});

	it('ramka pól (żelazo) na łupku ma kontrast co najmniej 3', () => {
		expect(readContrast('zelazo', 'lupek')).toBeGreaterThanOrEqual(3);
	});

	it('app.css nie importuje starych paczek pisma', () => {
		expect(appCss).not.toMatch(/grenze-gotisch|alegreya/i);
		expect(appCss).toMatch(/@fontsource\/grenze\//);
		expect(appCss).toMatch(/@fontsource\/barlow-semi-condensed\//);
	});
});

describe('klasy materiałów', () => {
	function readRuleBlock(selector: string): string {
		const selectorIndex = appCss.indexOf(selector);
		if (selectorIndex < 0) throw new Error(`Brak reguły ${selector} w app.css`);
		const blockStart = appCss.indexOf('{', selectorIndex);
		return appCss.slice(blockStart, appCss.indexOf('}', blockStart));
	}

	it.each(['.button-iron', '.button-ochre', '.button-quiet'])(
		'ścięty przycisk %s ma fokus widoczny wewnątrz kształtu',
		(selector) => {
			expect(readRuleBlock(`${selector}:focus-visible`)).toContain('outline-offset: -');
		}
	);

	it('żadna klasa nie używa backdrop-filter', () => {
		expect(appCss).not.toContain('backdrop-filter');
	});

	it('kształt płyty dają warstwy ozdobne, a sam element nie jest przycinany', () => {
		expect(readRuleBlock('.material-leather::before')).toContain('clip-path');
		expect(readRuleBlock('.material-leather,')).not.toContain('clip-path');
		expect(readRuleBlock('.parchment-note::before')).toContain('clip-path');
		expect(appCss).not.toContain('.material-leather-riveted::after');
	});

	it('klasy komponentów nie używają już pergaminu, nitów ani przeszycia', () => {
		const components = appCss.slice(appCss.indexOf('@layer components'));
		expect(components).not.toContain('var(--parchment');
		expect(components).not.toContain('var(--rivet');
		expect(components).not.toContain('var(--stitch');
	});

	it('tło pod mapą to woda', () => {
		expect(readRuleBlock('.map-parchment {')).toContain('var(--woda)');
	});

	it('przycisk atramentowy też ma fokus wewnątrz kształtu', () => {
		expect(readRuleBlock('.button-ink:focus-visible')).toContain('outline-offset: -');
	});
});
