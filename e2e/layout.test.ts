import { expect, test } from './support/test.js';

interface Box {
	x: number;
	y: number;
	width: number;
	height: number;
}

function intersects(first: Box, second: Box): boolean {
	return (
		first.x < second.x + second.width &&
		second.x < first.x + first.width &&
		first.y < second.y + second.height &&
		second.y < first.y + first.height
	);
}

const HEADER_PLATES = ['header-title', 'header-search', 'header-actions'] as const;

for (const viewport of [
	{ width: 360, height: 740 },
	{ width: 1280, height: 720 }
]) {
	test(`płyty nagłówka nie nakładają się na szerokości ${viewport.width}`, async ({ page }) => {
		await page.setViewportSize(viewport);
		await page.goto('/g2nk/khorinis');
		const boxes: Box[] = [];
		for (const testId of HEADER_PLATES) {
			const box = await page.getByTestId(testId).boundingBox();
			if (!box) throw new Error(`Brak płyty ${testId}`);
			expect(box.x, testId).toBeGreaterThanOrEqual(0);
			expect(box.x + box.width, testId).toBeLessThanOrEqual(viewport.width);
			boxes.push(box);
		}
		for (let first = 0; first < boxes.length; first++) {
			for (let second = first + 1; second < boxes.length; second++) {
				expect(
					intersects(boxes[first], boxes[second]),
					`${HEADER_PLATES[first]} nakłada się na ${HEADER_PLATES[second]}`
				).toBe(false);
			}
		}
	});
}

test('płyty nagłówka zgłaszają się jako elementy zasłaniające mapę', async ({ page }) => {
	await page.goto('/g2nk/khorinis');
	for (const testId of HEADER_PLATES) {
		await expect(page.locator(`[data-testid="${testId}"][data-map-obstacle]`)).toHaveCount(1);
	}
});

test('na telefonie menu „Inne” otwiera narzędzie spoza paska', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/g2nk/khorinis');
	const tools = page.getByRole('navigation', { name: 'Narzędzia' });
	await expect(tools.getByRole('button')).toHaveCount(5);
	await tools.getByRole('button', { name: 'Inne' }).click();
	await page.getByRole('menuitem', { name: 'Analizy' }).click();
	await expect(page.getByRole('heading', { name: 'Analizy' })).toBeVisible();
	await expect(tools.getByRole('button', { name: 'Inne' })).toHaveAttribute('aria-pressed', 'true');
});

test('dok narzędzi na desktopie ma osiem przycisków i znacznik aktywnego', async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 720 });
	await page.goto('/g2nk/khorinis?narzedzie=time');
	const tools = page.getByRole('navigation', { name: 'Narzędzia' });
	await expect(tools.getByRole('button')).toHaveCount(8);
	await expect(tools.getByRole('button', { name: 'Czas' })).toHaveAttribute('aria-pressed', 'true');
});
