import { expect, test, type Page } from '@playwright/test';

const SEEN_FROM_ABOVE_ISLAND_LINK = '/g2nk/khorinis?widok=72.7_13.3_800_0_-45&narzedzie=zamkniete';

async function waitForMapToSettle(page: Page): Promise<void> {
	await expect(page.locator('[data-testid="map"] canvas')).toBeVisible({ timeout: 30_000 });
	await expect(page.getByTestId('tiles-loading-badge')).toBeVisible({ timeout: 30_000 });
	await expect(page.getByTestId('tiles-loading-badge')).toBeHidden({ timeout: 90_000 });
}

function collectPageErrors(page: Page): string[] {
	const errors: string[] = [];
	page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
	page.on('pageerror', (error) => errors.push(error.message));
	return errors;
}

async function openCameraSettings(page: Page): Promise<void> {
	await page.getByRole('button', { name: 'Rzut kamery' }).click();
	await expect(page.getByRole('group', { name: 'Widok kamery' })).toBeVisible();
}

test('przycisk i okienko przełączają rzut ortogonalny, a adres go zapamiętuje', async ({
	page
}) => {
	const errors = collectPageErrors(page);
	await page.goto(SEEN_FROM_ABOVE_ISLAND_LINK);
	await waitForMapToSettle(page);

	await openCameraSettings(page);
	await page.getByRole('button', { name: 'Ortogonalny' }).click();
	await expect(page.getByRole('button', { name: 'Rzut kamery' })).toHaveAttribute(
		'aria-pressed',
		'true'
	);
	await expect(page.getByText('rzut ortogonalny')).toBeVisible();
	await expect(page).toHaveURL(/rzut=o/);
	await expect(page.getByText('Kąt widzenia dotyczy tylko rzutu środkowego.')).toBeVisible();

	await page.getByRole('button', { name: 'Perspektywa' }).click();
	await expect(page).not.toHaveURL(/rzut=/);
	expect(errors).toEqual([]);
});

test('klawisz P przełącza rzut, a Esc zamyka okienko ustawień', async ({ page }) => {
	await page.goto(SEEN_FROM_ABOVE_ISLAND_LINK);
	await waitForMapToSettle(page);

	await page.keyboard.press('p');
	await expect(page).toHaveURL(/rzut=o/);
	await page.keyboard.press('p');
	await expect(page).not.toHaveURL(/rzut=/);

	await openCameraSettings(page);
	await page.keyboard.press('Escape');
	await expect(page.getByRole('group', { name: 'Widok kamery' })).toBeHidden();
});

test('link z rzutem ortogonalnym otwiera mapę w ortho', async ({ page }) => {
	await page.goto(`${SEEN_FROM_ABOVE_ISLAND_LINK}&rzut=o`);
	await waitForMapToSettle(page);
	await expect(page.getByRole('button', { name: 'Rzut kamery' })).toHaveAttribute(
		'aria-pressed',
		'true'
	);
});

test('uszkodzony rzut w linku jest ignorowany, a widok odtworzony', async ({ page }) => {
	const errors = collectPageErrors(page);
	await page.goto(`${SEEN_FROM_ABOVE_ISLAND_LINK}&rzut=p_5`);
	await waitForMapToSettle(page);
	await expect(page.getByRole('button', { name: 'Rzut kamery' })).toHaveAttribute(
		'aria-pressed',
		'false'
	);
	await expect(page).toHaveURL(/widok=72\.7_13\.3_800_0_-45/);
	expect(errors).toEqual([]);
});

test('widok „Z góry” w ortho daje podziałkę, która zmienia się po zbliżeniu', async ({ page }) => {
	await page.goto(`${SEEN_FROM_ABOVE_ISLAND_LINK}&rzut=o`);
	await waitForMapToSettle(page);

	await openCameraSettings(page);
	await page.getByRole('button', { name: 'Z góry' }).click();
	await expect(page).toHaveURL(/widok=[^&]*_0_-90/, { timeout: 15_000 });

	const scale = page.getByLabel(/^Skala /);
	await expect(scale).toHaveAttribute('aria-label', /Skala \d/);
	const scaleBefore = await scale.getAttribute('aria-label');
	for (let click = 0; click < 4; click++) {
		await page.getByRole('button', { name: 'Przybliż' }).click();
	}
	await expect(scale).not.toHaveAttribute('aria-label', scaleBefore ?? '', { timeout: 15_000 });
});

test('cienie włączone i dwukrotne przełączenie rzutu nie przerywają renderowania', async ({
	page
}) => {
	const errors = collectPageErrors(page);
	await page.goto('/g2nk/khorinis?widok=72.7_13.3_800_0_-45&narzedzie=time');
	await waitForMapToSettle(page);
	await page.getByRole('checkbox', { name: /^Cienie/ }).check();
	await page.getByRole('checkbox', { name: /^Cienie/ }).blur();

	await page.keyboard.press('p');
	await expect(page).toHaveURL(/rzut=o/);
	await expect(page.getByText('W rzucie ortogonalnym cienie są wyłączone.')).toBeVisible();
	await page.keyboard.press('p');
	await page.keyboard.press('p');
	await page.keyboard.press('p');
	await page.waitForTimeout(1500);

	await expect(page.getByText(/rendering has stopped/i)).toHaveCount(0);
	expect(errors).toEqual([]);
});

test('zakładka zapisana w ortho wraca z rzutem w adresie', async ({ page }) => {
	await page.goto(`${SEEN_FROM_ABOVE_ISLAND_LINK}&rzut=o`);
	await waitForMapToSettle(page);
	await page
		.getByRole('navigation', { name: 'Narzędzia' })
		.getByRole('button', { name: 'Zakładki' })
		.click();
	await page.getByLabel('Nazwa zakładki').fill('Plan z góry');
	await page.getByRole('button', { name: 'Zapisz widok' }).click();
	await expect(page.getByRole('list', { name: 'Zapisane widoki' })).toContainText(
		'Rzut ortogonalny'
	);

	await page.goto('/g2nk/khorinis?narzedzie=bookmarks');
	await page.getByRole('button', { name: /Przywróć widok „Plan z góry”/ }).click();
	await expect(page).toHaveURL(/rzut=o/, { timeout: 15_000 });
});

test('powrót do perspektywy przywraca pozycję kamery sprzed przełączenia', async ({ page }) => {
	await page.goto(SEEN_FROM_ABOVE_ISLAND_LINK);
	await waitForMapToSettle(page);

	await page.keyboard.press('p');
	await expect(page).toHaveURL(/rzut=o/);
	await page.keyboard.press('p');
	await expect(page).not.toHaveURL(/rzut=/);
	await expect(page).toHaveURL(/widok=72\.[67]_13\.[23]_(799\.\d|800)_0_-45/);
});
