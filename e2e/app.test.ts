import { expect, test } from '@playwright/test';

test('strona się ładuje: mapa Cesium, panel wyszukiwania, brak błędów w konsoli', async ({
	page
}) => {
	const errors: string[] = [];
	page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
	page.on('pageerror', (e) => errors.push(e.message));

	await page.goto('/');
	await expect(page).toHaveURL(/\/g2nk\/khorinis$/);
	await expect(page).toHaveTitle('Khorinis — GIS of Gothic');

	await expect(page.locator('[data-testid="map"] canvas')).toBeVisible({ timeout: 30_000 });
	await expect(page.getByPlaceholder('Szukaj przedmiotu lub postaci…')).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Wyszukiwarka' })).toBeVisible();
	await expect(page.getByRole('navigation', { name: 'Narzędzia' })).toBeVisible();
	await expect(page.getByTestId('status-bar')).toContainText(/Przedmioty: \d+ · Postacie: \d+/, {
		timeout: 90_000
	});

	expect(errors).toEqual([]);
});

test('nieznany świat pokazuje stronę błędu z linkiem do Khorinis', async ({ page }) => {
	await page.goto('/g3/myrtana');
	await expect(page.getByText('Nie ma takiego świata.')).toBeVisible();
	await page.getByRole('link', { name: 'Otwórz Khorinis' }).click();
	await expect(page).toHaveURL(/\/g2nk\/khorinis$/);
});

test('szyna narzędzi przełącza i zamyka panele', async ({ page }) => {
	await page.goto('/g2nk/khorinis');
	const tools = page.getByRole('navigation', { name: 'Narzędzia' });
	await tools.getByRole('button', { name: 'Pomiary' }).click();
	await expect(page.getByRole('heading', { name: 'Pomiary' })).toBeVisible();
	await expect(tools.getByRole('button', { name: 'Pomiary' })).toHaveAttribute(
		'aria-pressed',
		'true'
	);
	await page.keyboard.press('Escape');
	await expect(page.getByRole('heading', { name: 'Pomiary' })).toBeHidden();
	await page.keyboard.press('Control+k');
	await expect(page.getByRole('heading', { name: 'Wyszukiwarka' })).toBeVisible();
});

test('wyszukiwarka znajduje przedmiot bez polskich znaków i zapisuje wpis w adresie', async ({
	page
}) => {
	await page.goto('/g2nk/khorinis');
	await page.getByRole('searchbox').fill('szczaw krolewski');
	await page.getByRole('button', { name: /Szczaw królewski/ }).click();
	await expect(page.getByRole('heading', { name: 'Szczaw królewski' })).toBeVisible();
	await expect(page).toHaveURL(/wpis=item%3AITPL_PERM_HERB/);
	await expect(page.getByText('sztuk w świecie')).toBeVisible();
	await expect(page.getByRole('link', { name: /Pokaż model 3D/ })).toHaveAttribute(
		'href',
		/gisofgothicmodels\.dworecki\.dev\/g2nk\/khorinis\/models\/previews\/itpl_perm_herb\.glb$/
	);
});

test('analiza „Najbliższe” pozwala wybrać przedmiot jako temat', async ({ page }) => {
	await page.goto('/g2nk/khorinis');
	await page
		.getByRole('navigation', { name: 'Narzędzia' })
		.getByRole('button', { name: 'Analizy' })
		.click();
	await expect(page.getByRole('heading', { name: 'Analizy' })).toBeVisible();
	await page.getByLabel('Temat analizy').fill('szczaw krolewski');
	await page.getByRole('button', { name: /Szczaw królewski/ }).click();
	await expect(page.getByText('miejsc w świecie')).toBeVisible();
	await expect(page.getByText('Kliknij punkt na mapie.')).toBeVisible();
});

test('analiza „Zasięg” pokazuje promień i prosi o punkt na mapie', async ({ page }) => {
	await page.goto('/g2nk/khorinis');
	await page
		.getByRole('navigation', { name: 'Narzędzia' })
		.getByRole('button', { name: 'Analizy' })
		.click();
	await page.getByRole('button', { name: /Zasięg/ }).click();
	await expect(page.getByLabel('Promień zasięgu w metrach')).toBeVisible();
	await page.getByLabel('Promień zasięgu w metrach').fill('200');
	await expect(page.getByText('200 m', { exact: true })).toBeVisible();
	await expect(page.getByText('Kliknij punkt na mapie.')).toBeVisible();
});

test('analiza „Zagęszczenie” rysuje siatkę i pokazuje legendę', async ({ page }) => {
	await page.goto('/g2nk/khorinis');
	await page
		.getByRole('navigation', { name: 'Narzędzia' })
		.getByRole('button', { name: 'Analizy' })
		.click();
	await page.getByRole('button', { name: /Zagęszczenie/ }).click();
	await page.getByLabel('Temat analizy').fill('roslina lecznicza');
	await page
		.getByRole('button', { name: /Roślina lecznicza/ })
		.first()
		.click();
	await expect(page.getByLabel('Legenda zagęszczenia')).toBeVisible();
	await expect(page.getByText(/Komórek z wynikiem: \d+/)).toBeVisible();
	await page.getByRole('button', { name: 'Kwadraty' }).click();
	await expect(page.getByRole('button', { name: 'Kwadraty' })).toHaveAttribute(
		'aria-pressed',
		'true'
	);
});

test('pomiar pola prosi o wierzchołki wielokąta', async ({ page }) => {
	await page.goto('/g2nk/khorinis');
	await page
		.getByRole('navigation', { name: 'Narzędzia' })
		.getByRole('button', { name: 'Pomiary' })
		.click();
	await page.getByRole('button', { name: /^Pole/ }).click();
	await expect(page.getByRole('button', { name: /^Pole/ })).toHaveAttribute('aria-pressed', 'true');
	await expect(page.getByText(/Od trzeciego policzymy pole i obwód/)).toBeVisible();
});

test('zakładki zapisują widok, przeżywają odświeżenie i dają się usunąć', async ({ page }) => {
	await page.goto('/g2nk/khorinis');
	await page
		.getByRole('navigation', { name: 'Narzędzia' })
		.getByRole('button', { name: 'Zakładki' })
		.click();
	await page.getByLabel('Nazwa zakładki').fill('Widok testowy');
	await page.getByRole('button', { name: 'Zapisz widok' }).click();
	await expect(page.getByRole('list', { name: 'Zapisane widoki' })).toContainText('Widok testowy');

	await page.reload();
	await expect(page.getByRole('list', { name: 'Zapisane widoki' })).toContainText('Widok testowy');
	await page.getByRole('button', { name: /Usuń zakładkę „Widok testowy”/ }).click();
	await expect(page.getByText('Nic jeszcze nie zapisano.')).toBeVisible();
});

test('link z narzędziem otwiera panel, a uszkodzona kamera jest ignorowana', async ({ page }) => {
	await page.goto('/g2nk/khorinis?widok=zepsute&narzedzie=measure');
	await expect(page.getByRole('heading', { name: 'Pomiary' })).toBeVisible();
	await expect(page).toHaveURL(/narzedzie=measure/);
	await expect(page).not.toHaveURL(/widok=/);
});

test('link z wpisem otwiera kartę postaci', async ({ page }) => {
	await page.goto('/g2nk/khorinis?wpis=character:VLK_412_HARAD');
	await expect(page.getByRole('heading', { name: 'Harad' })).toBeVisible({ timeout: 30_000 });
	await expect(page.getByText('Mieszczanin')).toBeVisible();
	await expect(page).toHaveTitle('Harad · Khorinis — GIS of Gothic');
});
