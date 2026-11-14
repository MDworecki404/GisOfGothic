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
