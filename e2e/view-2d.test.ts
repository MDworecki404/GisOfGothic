import type { Page } from '@playwright/test';
import { expect, test } from './support/test.js';

const SEEN_FROM_ABOVE_ISLAND_LINK = '/g2nk/khorinis?widok=72.7_13.3_800_0_-45&narzedzie=zamkniete';
const FLAT_MAP_BUTTON = 'Widok 2D';
const NEARLY_VERTICAL_PITCH_DEGREES = -89;

async function waitForMapToSettle(page: Page): Promise<void> {
	await expect(page.locator('[data-testid="map"] canvas')).toBeVisible({ timeout: 30_000 });
	await expect(page.getByTestId('map')).toHaveAttribute('data-world-status', 'ready', {
		timeout: 30_000
	});
	await expect(page.getByTestId('tiles-loading-badge')).toBeHidden({ timeout: 30_000 });
}

function collectPageErrors(page: Page): string[] {
	const errors: string[] = [];
	page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
	page.on('pageerror', (error) => errors.push(error.message));
	return errors;
}

function readCameraAnglesFromAddress(page: Page): { headingDegrees: number; pitchDegrees: number } {
	const camera = new URL(page.url()).searchParams.get('widok');
	const parts = camera?.split('_').map(Number) ?? [];
	return { headingDegrees: parts[3] ?? Number.NaN, pitchDegrees: parts[4] ?? Number.NaN };
}

function readCameraPlaceFromAddress(page: Page): { east: number; north: number } {
	const camera = new URL(page.url()).searchParams.get('widok');
	const parts = camera?.split('_').map(Number) ?? [];
	return { east: parts[0] ?? Number.NaN, north: parts[1] ?? Number.NaN };
}

async function openCameraSettings(page: Page): Promise<void> {
	await page.getByRole('button', { name: 'Rzut kamery' }).click();
	await expect(page.getByRole('group', { name: 'Widok kamery' })).toBeVisible();
}

async function holdKey(page: Page, key: string): Promise<void> {
	await page.keyboard.down(key);
	await page.waitForTimeout(800);
	await page.keyboard.up(key);
	await page.waitForTimeout(500);
}

async function dragOverMap(page: Page, withControlKey: boolean): Promise<void> {
	if (withControlKey) await page.keyboard.down('Control');
	await page.mouse.move(640, 400);
	await page.mouse.down();
	await page.mouse.move(640, 300, { steps: 8 });
	await page.mouse.up();
	if (withControlKey) await page.keyboard.up('Control');
}

test('przycisk włącza widok 2D: adres, status, brak kompasu, brak błędów', async ({ page }) => {
	const errors = collectPageErrors(page);
	await page.goto(SEEN_FROM_ABOVE_ISLAND_LINK);
	await waitForMapToSettle(page);

	const button = page.getByRole('button', { name: FLAT_MAP_BUTTON });
	await expect(button).toHaveAttribute('aria-pressed', 'false');
	await expect(page.getByRole('button', { name: 'Obróć mapę na północ' })).toBeVisible();

	await button.click();
	await expect(button).toHaveAttribute('aria-pressed', 'true');
	await expect(page).toHaveURL(/tryb=2d/);
	await expect(page.getByText('widok 2D', { exact: true })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Obróć mapę na północ' })).toBeHidden();

	await button.click();
	await expect(button).toHaveAttribute('aria-pressed', 'false');
	await expect(page).not.toHaveURL(/tryb=|ciecie=|rzut=/);
	await expect(page.getByRole('button', { name: 'Obróć mapę na północ' })).toBeVisible();
	expect(errors).toEqual([]);
});

test('w 2D kamera patrzy w dół, a przechył i obrót klawiszami jej nie zmieniają (w 3D zmieniają)', async ({
	page
}) => {
	await page.goto(SEEN_FROM_ABOVE_ISLAND_LINK);
	await waitForMapToSettle(page);

	await expect(async () => {
		if (readCameraAnglesFromAddress(page).pitchDegrees <= -44) await holdKey(page, 'ArrowUp');
		expect(readCameraAnglesFromAddress(page).pitchDegrees).toBeGreaterThan(-44);
	}).toPass({ timeout: 30_000 });

	await page.getByRole('button', { name: FLAT_MAP_BUTTON }).click();
	await expect
		.poll(() => readCameraAnglesFromAddress(page).pitchDegrees, { timeout: 20_000 })
		.toBeLessThan(NEARLY_VERTICAL_PITCH_DEGREES);

	await holdKey(page, 'ArrowUp');
	await holdKey(page, 'ArrowRight');
	await dragOverMap(page, true);
	await dragOverMap(page, false);
	await page.waitForTimeout(1_000);
	const angles = readCameraAnglesFromAddress(page);
	expect(angles.pitchDegrees).toBeLessThan(NEARLY_VERTICAL_PITCH_DEGREES);
	expect(Math.abs(Math.sin((angles.headingDegrees * Math.PI) / 180))).toBeLessThan(0.02);
});

test('w 2D przeciągnięcie po pustym tle przesuwa mapę i nie obraca ani nie pochyla kamery', async ({
	page
}) => {
	await page.goto(`${SEEN_FROM_ABOVE_ISLAND_LINK}&tryb=2d`);
	await waitForMapToSettle(page);
	await expect
		.poll(() => readCameraAnglesFromAddress(page).pitchDegrees, { timeout: 20_000 })
		.toBeLessThan(NEARLY_VERTICAL_PITCH_DEGREES);
	await page.waitForTimeout(1_000);
	const before = readCameraPlaceFromAddress(page);

	for (const [deltaX, deltaY] of [
		[240, 0],
		[-120, 160],
		[0, -200],
		[180, 140]
	]) {
		await page.mouse.move(640, 400);
		await page.mouse.down();
		await page.mouse.move(640 + deltaX, 400 + deltaY, { steps: 10 });
		await page.mouse.up();
		await page.waitForTimeout(600);
	}
	await page.waitForTimeout(1_000);

	const angles = readCameraAnglesFromAddress(page);
	expect(angles.pitchDegrees).toBeLessThan(NEARLY_VERTICAL_PITCH_DEGREES);
	expect(Math.abs(Math.sin((angles.headingDegrees * Math.PI) / 180))).toBeLessThan(0.02);
	const after = readCameraPlaceFromAddress(page);
	const movedMetres = Math.hypot(after.east - before.east, after.north - before.north);
	expect(movedMetres).toBeGreaterThan(1);
	expect(movedMetres).toBeLessThan(20_000);
});

test('okienko kamery w 2D ma poziom cięcia: suwak dopisuje ciecie do adresu, Bez cięcia je zdejmuje', async ({
	page
}) => {
	await page.goto(SEEN_FROM_ABOVE_ISLAND_LINK);
	await waitForMapToSettle(page);
	await page.getByRole('button', { name: FLAT_MAP_BUTTON }).click();
	await openCameraSettings(page);

	const noSlice = page.getByRole('button', { name: 'Bez cięcia' });
	await expect(noSlice).toHaveAttribute('aria-pressed', 'true');
	await expect(
		page.getByText('W widoku 2D rzut i kąt widzenia ustawiają się automatycznie.')
	).toBeVisible();

	const slider = page.getByRole('slider', { name: 'Wysokość cięcia modelu w metrach' });
	await slider.focus();
	await page.keyboard.press('ArrowRight');
	await expect(page).toHaveURL(/ciecie=-?\d/);
	await expect(noSlice).toHaveAttribute('aria-pressed', 'false');

	await noSlice.click();
	await expect(noSlice).toHaveAttribute('aria-pressed', 'true');
	await expect(page).not.toHaveURL(/ciecie=/);
});

test('przyciski −5, −1, +1 i +5 przesuwają wysokość cięcia o krok', async ({ page }) => {
	await page.goto(`${SEEN_FROM_ABOVE_ISLAND_LINK}&tryb=2d&ciecie=100`);
	await waitForMapToSettle(page);
	await openCameraSettings(page);

	await page.getByRole('button', { name: 'Podnieś cięcie o 5 m' }).click();
	await expect(page).toHaveURL(/ciecie=105(&|$)/);
	await page.getByRole('button', { name: 'Obniż cięcie o 1 m' }).click();
	await expect(page).toHaveURL(/ciecie=104(&|$)/);
	await page.getByRole('button', { name: 'Podnieś cięcie o 1 m' }).click();
	await page.getByRole('button', { name: 'Obniż cięcie o 5 m' }).click();
	await expect(page).toHaveURL(/ciecie=100(&|$)/);
});

test('link z trybem 2D i cięciem odtwarza oba, a samo cięcie jest ignorowane', async ({ page }) => {
	await page.goto(`${SEEN_FROM_ABOVE_ISLAND_LINK}&tryb=2d&ciecie=40`);
	await waitForMapToSettle(page);
	await expect(page.getByRole('button', { name: FLAT_MAP_BUTTON })).toHaveAttribute(
		'aria-pressed',
		'true'
	);
	await expect(page).toHaveURL(/tryb=2d/);
	await expect(page).toHaveURL(/ciecie=40/);

	await page.goto(`${SEEN_FROM_ABOVE_ISLAND_LINK}&ciecie=40`);
	await waitForMapToSettle(page);
	await expect(page.getByRole('button', { name: FLAT_MAP_BUTTON })).toHaveAttribute(
		'aria-pressed',
		'false'
	);
	await expect(page).not.toHaveURL(/ciecie=|tryb=/);
});

test('link z trybem 2D i pochylonym widokiem otwiera kamerę prosto w dół', async ({ page }) => {
	await page.goto(`${SEEN_FROM_ABOVE_ISLAND_LINK}&tryb=2d`);
	await waitForMapToSettle(page);
	await expect
		.poll(() => readCameraAnglesFromAddress(page).pitchDegrees, { timeout: 20_000 })
		.toBeLessThan(NEARLY_VERTICAL_PITCH_DEGREES);
});

test('wejście w 2D z kamerą patrzącą ponad horyzont ustawia widok prosto w dół', async ({
	page
}) => {
	await page.goto('/g2nk/khorinis?widok=72.7_13.3_800_0_35&narzedzie=zamkniete');
	await waitForMapToSettle(page);
	await page.getByRole('button', { name: FLAT_MAP_BUTTON }).click();
	await expect
		.poll(() => readCameraAnglesFromAddress(page).pitchDegrees, { timeout: 20_000 })
		.toBeLessThan(NEARLY_VERTICAL_PITCH_DEGREES);
});

test('przycisk Widok 2D zostaje na miejscu po włączeniu trybu', async ({ page }) => {
	await page.goto(SEEN_FROM_ABOVE_ISLAND_LINK);
	await waitForMapToSettle(page);
	const button = page.getByRole('button', { name: FLAT_MAP_BUTTON });
	const before = await button.boundingBox();
	await button.click();
	await expect(button).toHaveAttribute('aria-pressed', 'true');
	const after = await button.boundingBox();
	expect(after?.y).toBe(before?.y);
});

test('uszkodzone cięcie w linku zostawia 2D bez cięcia', async ({ page }) => {
	await page.goto(`${SEEN_FROM_ABOVE_ISLAND_LINK}&tryb=2d&ciecie=abc`);
	await waitForMapToSettle(page);
	await expect(page.getByRole('button', { name: FLAT_MAP_BUTTON })).toHaveAttribute(
		'aria-pressed',
		'true'
	);
	await expect(page).not.toHaveURL(/ciecie=/);
});

test('zakładka zachowuje tryb 2D i cięcie', async ({ page }) => {
	await page.goto(`${SEEN_FROM_ABOVE_ISLAND_LINK}&tryb=2d&ciecie=25`);
	await waitForMapToSettle(page);
	await page
		.getByRole('navigation', { name: 'Narzędzia' })
		.getByRole('button', { name: 'Zakładki' })
		.click();
	await page.getByLabel('Nazwa zakładki').fill('Plan z cięciem');
	await page.getByRole('button', { name: 'Zapisz widok' }).click();
	await expect(page.getByRole('list', { name: 'Zapisane widoki' })).toContainText('Widok 2D');

	await page.goto(SEEN_FROM_ABOVE_ISLAND_LINK);
	await waitForMapToSettle(page);
	await expect(page.getByRole('button', { name: FLAT_MAP_BUTTON })).toHaveAttribute(
		'aria-pressed',
		'false'
	);
	await page
		.getByRole('navigation', { name: 'Narzędzia' })
		.getByRole('button', { name: 'Zakładki' })
		.click();
	await page.getByRole('button', { name: /Przywróć widok „Plan z cięciem”/ }).click();
	await expect(page.getByRole('button', { name: FLAT_MAP_BUTTON })).toHaveAttribute(
		'aria-pressed',
		'true'
	);
	await expect(page).toHaveURL(/ciecie=25/);
});

test('klawisz P w 2D nie zmienia rzutu, a po wyjściu z 2D wraca do działania', async ({ page }) => {
	await page.goto(SEEN_FROM_ABOVE_ISLAND_LINK);
	await waitForMapToSettle(page);
	await page.getByRole('button', { name: FLAT_MAP_BUTTON }).click();
	await expect(page).toHaveURL(/rzut=o/);

	await page.keyboard.press('p');
	await expect(page).toHaveURL(/rzut=o/);
	await expect(page.getByRole('button', { name: FLAT_MAP_BUTTON })).toHaveAttribute(
		'aria-pressed',
		'true'
	);

	await page.getByRole('button', { name: FLAT_MAP_BUTTON }).click();
	await expect(page).not.toHaveURL(/rzut=/);
	await page.keyboard.press('p');
	await expect(page).toHaveURL(/rzut=o/);
});

for (const viewportWidth of [360, 768, 1024, 1440]) {
	test(`okienko kamery w 2D mieści się w oknie (${viewportWidth} px)`, async ({ page }) => {
		await page.setViewportSize({ width: viewportWidth, height: 800 });
		await page.goto(`${SEEN_FROM_ABOVE_ISLAND_LINK}&tryb=2d`);
		await waitForMapToSettle(page);
		await openCameraSettings(page);

		const popover = await page.getByRole('group', { name: 'Widok kamery' }).boundingBox();
		expect(popover).not.toBeNull();
		expect(popover?.x ?? -1).toBeGreaterThanOrEqual(0);
		expect((popover?.x ?? 0) + (popover?.width ?? 0)).toBeLessThanOrEqual(viewportWidth);
		const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
		expect(scrollWidth).toBeLessThanOrEqual(viewportWidth);
	});
}
