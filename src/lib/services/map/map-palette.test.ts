import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { MAP_PALETTE } from './map-palette.js';

const appCss = readFileSync(new URL('../../../app.css', import.meta.url), 'utf-8');

function readColorToken(name: string): string {
	const match = new RegExp('--' + name + ': *(#[0-9a-fA-F]{6});').exec(appCss);
	if (!match) throw new Error(`Brak tokenu koloru --${name} w app.css`);
	return match[1].toLowerCase();
}

describe('MAP_PALETTE', () => {
	it('zgadza się z tokenami app.css', () => {
		expect(MAP_PALETTE.ember).toBe(readColorToken('zar'));
		expect(MAP_PALETTE.barrier).toBe(readColorToken('bariera'));
		expect(MAP_PALETTE.ash).toBe(readColorToken('popiol'));
		expect(MAP_PALETTE.edge).toBe(readColorToken('krawedz'));
		expect(MAP_PALETTE.water).toBe(readColorToken('woda'));
		expect(MAP_PALETTE.blood).toBe(readColorToken('krew'));
	});

	it('wszystkie kolory mają zapis #rrggbb małymi literami', () => {
		for (const color of Object.values(MAP_PALETTE)) expect(color).toMatch(/^#[0-9a-f]{6}$/);
	});
});
