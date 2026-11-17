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

test('płyty u góry i w rogu nie są raportowane jako zasłonięty brzeg mapy', async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 720 });
	await page.goto('/g2nk/khorinis');
	for (const testId of HEADER_PLATES) await expect(page.getByTestId(testId)).toBeVisible();
	await expect(page.locator('footer[aria-label="Pozycja kursora, skala i stan"]')).toBeVisible();
	for (const testId of HEADER_PLATES) {
		await expect(page.locator(`[data-testid="${testId}"][data-map-obstacle]`)).toHaveCount(0);
	}
	await expect(
		page.locator('footer[aria-label="Pozycja kursora, skala i stan"][data-map-obstacle]')
	).toHaveCount(0);
	await expect(page.getByRole('navigation', { name: 'Narzędzia' })).toHaveAttribute(
		'data-map-obstacle',
		''
	);
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

test('szyna narzędzi na desktopie ma pozycję Mapa, osiem narzędzi i znacznik aktywnego', async ({
	page
}) => {
	await page.setViewportSize({ width: 1280, height: 720 });
	await page.goto('/g2nk/khorinis?narzedzie=time');
	const rail = page.getByRole('navigation', { name: 'Narzędzia' });
	await expect(rail.getByRole('button')).toHaveCount(9);
	await expect(rail.getByRole('button', { name: 'Mapa', exact: true })).toHaveAttribute(
		'aria-pressed',
		'false'
	);
	await expect(rail.getByRole('button', { name: 'Czas', exact: true })).toHaveAttribute(
		'aria-pressed',
		'true'
	);
	await page.keyboard.press('Escape');
	await expect(rail.getByRole('button', { name: 'Czas', exact: true })).toHaveAttribute(
		'aria-pressed',
		'false'
	);
	await expect(page.getByRole('region', { name: 'Czas' })).toBeHidden();
	await expect(rail.getByRole('button', { name: 'Mapa', exact: true })).toHaveAttribute(
		'aria-pressed',
		'true'
	);
});

test('na szerokim ekranie pasek ma przełączniki warstw danych zgodne z panelem Warstwy', async ({
	page
}) => {
	await page.setViewportSize({ width: 1600, height: 800 });
	await page.goto('/g2nk/khorinis?narzedzie=zamkniete');
	const chip = page
		.getByRole('group', { name: 'Warstwy danych na mapie' })
		.getByRole('button', { name: /^Questy/ });
	await expect(chip).toHaveAttribute('aria-pressed', 'false');
	await chip.click();
	await expect(chip).toHaveAttribute('aria-pressed', 'true');
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
	});
}

test('panel narzędzia zachowuje odstęp od paska górnego i leży obok szyny', async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 720 });
	await page.goto('/g2nk/khorinis?narzedzie=measure');
	const bar = await page.getByTestId('header-bar').boundingBox();
	const rail = await page.getByRole('navigation', { name: 'Narzędzia' }).boundingBox();
	const panel = await page.getByRole('region', { name: 'Pomiary' }).boundingBox();
	if (!bar || !rail || !panel) throw new Error('Brak paska, szyny albo panelu');
	expect(rail.y, 'szyna zaczyna się pod paskiem').toBeGreaterThanOrEqual(bar.y + bar.height - 1);
	expect(panel.y - (bar.y + bar.height), 'odstęp panelu od paska').toBeGreaterThanOrEqual(8);
	expect(panel.x, 'panel obok szyny').toBeGreaterThanOrEqual(rail.x + rail.width);
});

test('atrybucja Cesium nie jest przykryta przez płytę odczytu', async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 720 });
	await page.goto('/g2nk/khorinis');
	const attribution = await page.locator('.map-attribution').boundingBox();
	const readout = await page
		.locator('footer[aria-label="Pozycja kursora, skala i stan"]')
		.boundingBox();
	if (!attribution || !readout) throw new Error('Brak atrybucji albo płyty odczytu');
	expect(intersects(attribution, readout), 'atrybucja nakłada się na odczyt').toBe(false);
});

test('płyta odczytu ma stałą szerokość, więc nie przesuwa się pod kursorem', async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 720 });
	for (const query of ['?narzedzie=zamkniete', '']) {
		await page.goto(`/g2nk/khorinis${query}`);
		const readout = page.locator('footer[aria-label="Pozycja kursora, skala i stan"]');
		const before = await readout.boundingBox();
		await page.mouse.move(640, 360);
		await page.mouse.move(700, 400);
		const after = await readout.boundingBox();
		if (!before || !after) throw new Error('Brak płyty odczytu');
		expect(after.width, query).toBe(before.width);
		expect(after.x, query).toBe(before.x);
		if (query === '?narzedzie=zamkniete') expect(before.width).toBe(896);
	}
});

test('joysticki lotu nie nachodzą na odczyt, atrybucję, zegar, szynę ani kolumnę przycisków mapy', async ({
	page
}) => {
	await page.setViewportSize({ width: 1440, height: 800 });
	await page.goto('/g2nk/khorinis');
	await page.getByRole('button', { name: 'Joysticki lotu kamerą' }).click();

	const sticks = [
		page.getByLabel('Joystick ruchu: do przodu, do tyłu i w bok'),
		page.getByLabel('Joystick rozglądania: obrót i pochylenie kamery')
	];
	const obstacles = {
		odczyt: page.locator('footer[aria-label="Pozycja kursora, skala i stan"]'),
		atrybucja: page.locator('.map-attribution'),
		zegar: page.getByRole('region', { name: 'Zegar doby' }),
		szyna: page.getByRole('navigation', { name: 'Narzędzia' }),
		'kolumna przycisków mapy': page.getByRole('button', { name: 'Przybliż' })
	};
	for (const stick of sticks) {
		const stickBox = await stick.boundingBox();
		if (!stickBox) throw new Error('Brak joysticka');
		for (const [name, obstacle] of Object.entries(obstacles)) {
			const obstacleBox = await obstacle.boundingBox();
			if (!obstacleBox) throw new Error(`Brak elementu: ${name}`);
			expect(intersects(stickBox, obstacleBox), `joystick nakłada się na: ${name}`).toBe(false);
		}
	}
});
