/**
 * Generuje ikony PWA (PNG) z `static/favicon.svg` przez przeglądarkę Playwright.
 * Uruchomienie: `node scripts/generate-pwa-icons.mjs` (wynik w `static/icons/`).
 */
import { mkdir, readFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const BACKGROUND = '#14110d';
const OUTPUT_DIRECTORY = 'static/icons';

const ICONS = [
	{ fileName: 'icon-192.png', size: 192, iconScale: 0.92, background: 'transparent' },
	{ fileName: 'icon-512.png', size: 512, iconScale: 0.92, background: 'transparent' },
	{ fileName: 'icon-maskable-512.png', size: 512, iconScale: 0.62, background: BACKGROUND },
	{ fileName: 'apple-touch-icon-180.png', size: 180, iconScale: 0.78, background: BACKGROUND }
];

const svg = await readFile('static/favicon.svg', 'utf8');
const svgDataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
await mkdir(OUTPUT_DIRECTORY, { recursive: true });

const browser = await chromium.launch();
for (const icon of ICONS) {
	const page = await browser.newPage({ viewport: { width: icon.size, height: icon.size } });
	const iconSize = Math.round(icon.size * icon.iconScale);
	await page.setContent(
		`<html><body style="margin:0;width:${icon.size}px;height:${icon.size}px;display:grid;place-items:center;background:${icon.background}">` +
			`<img src="${svgDataUrl}" width="${iconSize}" height="${iconSize}"></body></html>`
	);
	await page.screenshot({
		path: `${OUTPUT_DIRECTORY}/${icon.fileName}`,
		omitBackground: icon.background === 'transparent'
	});
	await page.close();
	console.log(`${OUTPUT_DIRECTORY}/${icon.fileName}`);
}
await browser.close();
