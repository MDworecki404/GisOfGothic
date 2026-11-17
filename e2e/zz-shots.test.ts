import { expect, test } from './support/test.js';

const OUT =
	'C:/Users/marek/AppData/Local/Temp/claude/16d8c0675b745744/483cee95-4cf4-4db2-b39c-6d67aef54305/scratchpad';
test('zrzuty', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	const open = async (query: string, name: string) => {
		await page.goto('/g2nk/khorinis?' + query);
		await expect(page.getByTestId('map')).toHaveAttribute('data-world-status', 'ready', {
			timeout: 30_000
		});
		await page.waitForTimeout(1500);
		await page.screenshot({ path: OUT + '/' + name + '.png' });
	};
	await open('narzedzie=layers', 'prod-layers');
	await open('narzedzie=time', 'prod-time');
	await open('narzedzie=zamkniete&wpis=character:VLK_412_HARAD', 'prod-card');
	await open('narzedzie=search&wpis=character:VLK_412_HARAD', 'prod-book');
	await page.setViewportSize({ width: 390, height: 844 });
	await open('narzedzie=layers', 'prod-mobile-layers');
});
