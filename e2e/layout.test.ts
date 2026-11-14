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

test('otwarty panel narzędzia nie zasłania doku ani nagłówka', async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 720 });
	await page.goto('/g2nk/khorinis?narzedzie=measure');
	const panel = await page.getByRole('region', { name: 'Pomiary' }).boundingBox();
	const dock = await page.getByRole('navigation', { name: 'Narzędzia' }).boundingBox();
	if (!panel || !dock) throw new Error('Brak panelu albo doku');
	expect(intersects(panel, dock), 'panel nakłada się na dok').toBe(false);
	for (const testId of HEADER_PLATES) {
		const plate = await page.getByTestId(testId).boundingBox();
		if (!plate) throw new Error(`Brak płyty ${testId}`);
		expect(intersects(panel, plate), `panel nakłada się na ${testId}`).toBe(false);
	}
});

test('odczyt współrzędnych to płyta w prawym dolnym rogu ze stanem', async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 720 });
	await page.goto('/g2nk/khorinis');
	const readout = page.locator('footer[aria-label="Pozycja kursora, skala i stan"]');
	const box = await readout.boundingBox();
	if (!box) throw new Error('Brak płyty odczytu');
	expect(1280 - (box.x + box.width)).toBeLessThanOrEqual(40);
	expect(720 - (box.y + box.height)).toBeLessThanOrEqual(40);
	await expect(readout.getByTestId('status-bar')).toBeVisible();
	await expect(page.locator('[data-testid="status-bar"]')).toContainText(/Przedmioty: \d+/, {
		timeout: 90_000
	});
});

test('podpis praw autorskich do świata gry jest widoczny', async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 720 });
	await page.goto('/g2nk/khorinis');
	await expect(page.locator('.map-attribution')).toContainText('Piranha Bytes');
});

for (const viewport of [
	{ width: 800, height: 600 },
	{ width: 1280, height: 720 }
]) {
	test(`płyta odczytu nie nachodzi na otwarty panel ani dok na ${viewport.width}×${viewport.height}`, async ({
		page
	}) => {
		await page.setViewportSize(viewport);
		await page.goto('/g2nk/khorinis?narzedzie=measure');
		const readout = await page
			.locator('footer[aria-label="Pozycja kursora, skala i stan"]')
			.boundingBox();
		const panel = await page.getByRole('region', { name: 'Pomiary' }).boundingBox();
		const dock = await page.getByRole('navigation', { name: 'Narzędzia' }).boundingBox();
		if (!readout || !panel || !dock) throw new Error('Brak płyty odczytu, panelu albo doku');
		expect(intersects(readout, panel), 'odczyt nakłada się na panel').toBe(false);
		expect(intersects(readout, dock), 'odczyt nakłada się na dok').toBe(false);
		expect(readout.x + readout.width, 'odczyt wychodzi poza ekran').toBeLessThanOrEqual(
			viewport.width
		);
		expect(dock.y + dock.height, 'dok jest rozciągnięty do dołu ekranu').toBeLessThan(
			viewport.height - 80
		);
	});
}
