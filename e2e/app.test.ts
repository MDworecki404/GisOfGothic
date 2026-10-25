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
	await expect(page.getByRole('img', { name: 'Podgląd 3D: Szczaw królewski' })).toBeVisible();
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

test('panel Warstwy pokazuje legendę ikon kategorii', async ({ page }) => {
	await page.goto('/g2nk/khorinis');
	await page
		.getByRole('navigation', { name: 'Narzędzia' })
		.getByRole('button', { name: 'Warstwy' })
		.click();
	const itemIcons = page.getByLabel('Ikony: Przedmioty w świecie');
	await expect(itemIcons).toContainText('Rośliny');
	await expect(itemIcons).toContainText('Broń biała');
	await expect(page.getByLabel('Ikony: Skrzynie')).toContainText('Skrzynia');
});

test('link z wpisem otwiera kartę postaci', async ({ page }) => {
	await page.goto('/g2nk/khorinis?wpis=character:VLK_412_HARAD');
	await expect(page.getByRole('heading', { name: 'Harad' })).toBeVisible({ timeout: 30_000 });
	await expect(page.getByText('Obywatel')).toBeVisible();
	await expect(page).toHaveTitle('Harad · Khorinis — GIS of Gothic');
});

test('link z wpisem otwiera kartę questa ze zleceniodawcą i rozdziałem', async ({ page }) => {
	await page.goto('/g2nk/khorinis?wpis=quest:TOPIC_RESCUEBENNET');
	await expect(page.getByRole('heading', { name: 'Bennet siedzi w więzieniu' })).toBeVisible({
		timeout: 30_000
	});
	await expect(page.getByText('Misja')).toBeVisible();
	await expect(page.getByText('rozdział', { exact: true })).toBeVisible();
});

test('karta questa pokazuje etapy dziennika i prowadzi do karty postaci', async ({ page }) => {
	await page.goto('/g2nk/khorinis?wpis=quest:TOPIC_BALTRAM');
	await expect(page.getByRole('heading', { name: 'Etapy dziennika' })).toBeVisible({
		timeout: 30_000
	});
	await expect(page.getByText('Nagroda:')).toBeVisible();
	await page.getByRole('button', { name: /^Akil/ }).click();
	await expect(page.getByRole('heading', { name: 'Akil', level: 3 })).toBeVisible();
	await expect(page).toHaveURL(/wpis=character/);
});

test('karta postaci wymienia jej questy i prowadzi do karty questa', async ({ page }) => {
	await page.goto('/g2nk/khorinis?wpis=character:SLD_809_BENNET');
	await expect(page.getByRole('heading', { name: /^Questy \(\d+\)$/ })).toBeVisible({
		timeout: 30_000
	});
	await page.getByRole('button', { name: /^Bennet siedzi w więzieniu/ }).click();
	await expect(page).toHaveURL(/wpis=quest/);
	await expect(page.getByRole('heading', { name: 'Etapy dziennika' })).toBeVisible();
});

test('zamknięcie wyszukiwarki usuwa wybraną postać z mapy i z adresu', async ({ page }) => {
	await page.goto('/g2nk/khorinis?wpis=character:VLK_412_HARAD');
	await expect(page.getByRole('heading', { name: 'Harad' })).toBeVisible({ timeout: 30_000 });
	await expect(page).toHaveURL(/wpis=/);
	await page.getByRole('button', { name: 'Zamknij panel' }).click();
	await expect(page).not.toHaveURL(/wpis=/);
	await expect(page).toHaveTitle('Khorinis — GIS of Gothic');
});

test('rozdział z linku zaznacza przycisk w panelu Czas i trafia do adresu', async ({ page }) => {
	await page.goto('/g2nk/khorinis?narzedzie=time&rozdzial=3');
	await expect(page.getByRole('button', { name: 'III', exact: true })).toHaveAttribute(
		'aria-pressed',
		'true'
	);
	await page.getByRole('button', { name: 'Wszystkie', exact: true }).click();
	await expect(page).not.toHaveURL(/rozdzial=/);
});

test('arkusz mobilny zmienia stan z klawiatury, a Esc zamyka panel', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/g2nk/khorinis');
	const handle = page.getByRole('slider', { name: /Wysokość panelu/ });
	await expect(handle).toHaveAttribute('aria-valuetext', 'zwinięty');
	await handle.focus();
	await page.keyboard.press('ArrowUp');
	await expect(handle).toHaveAttribute('aria-valuetext', 'połowa ekranu');
	await page.keyboard.press('ArrowUp');
	await expect(handle).toHaveAttribute('aria-valuetext', 'pełny ekran');
	await page.keyboard.press('Home');
	await expect(handle).toHaveAttribute('aria-valuetext', 'zwinięty');
	await page.keyboard.press('Escape');
	await expect(handle).toHaveCount(0);
});

test('na telefonie pole wyszukiwania rozwija arkusz, a okna otwiera menu „Więcej”', async ({
	page
}) => {
	await page.setViewportSize({ width: 360, height: 780 });
	await page.goto('/g2nk/khorinis');
	const handle = page.getByRole('slider', { name: /Wysokość panelu/ });
	await expect(handle).toHaveAttribute('aria-valuetext', 'zwinięty');
	await page.getByRole('searchbox').click();
	await expect(handle).toHaveAttribute('aria-valuetext', 'połowa ekranu');
	await page.getByRole('button', { name: 'Więcej' }).click();
	await page.getByRole('button', { name: 'O projekcie' }).click();
	await expect(page.getByRole('dialog')).toContainText('Trójwymiarowa wikipedia');
	await page.keyboard.press('Escape');
	await expect(page.getByRole('dialog')).toBeHidden();
	await expect(handle).toBeVisible();
});

test('mapa pokazuje atrybucję Cesium ion i praw do świata gry', async ({ page }) => {
	await page.goto('/g2nk/khorinis');
	const attribution = page.getByRole('complementary', { name: 'Źródła i prawa autorskie' });
	await expect(attribution).toContainText('Piranha Bytes');
	await expect(attribution.getByRole('img', { name: 'Cesium ion' })).toBeVisible({
		timeout: 30_000
	});
});

test('analiza „Widoczność” prosi o punkt na mapie i ma suwak promienia', async ({ page }) => {
	await page.goto('/g2nk/khorinis?narzedzie=analysis');
	await page.getByRole('button', { name: /^Widoczność/ }).click();
	await expect(page.getByText('Kliknij punkt na mapie.')).toBeVisible();
	await expect(page.getByLabel('Promień widoczności w metrach')).toBeVisible();
});

test('przełącznik światów przenosi do Górniczej Doliny z jej danymi', async ({ page }) => {
	await page.goto('/g2nk/khorinis');
	await expect(page.getByText(/312 przedmiotów/)).toBeVisible({ timeout: 30_000 });
	await page.getByTitle('Zmień świat').click();
	await page
		.getByRole('navigation', { name: 'Światy' })
		.getByRole('link', { name: 'Górnicza Dolina' })
		.click();
	await expect(page).toHaveURL(/\/g2nk\/gornicza-dolina(\?|$)/);
	await expect(page).toHaveTitle('Górnicza Dolina — GIS of Gothic');
	await expect(page.getByText(/214 przedmiotów/)).toBeVisible({ timeout: 30_000 });
});

test('warstwa obiektów świata wczytuje tileset voba z bramki', async ({ page }) => {
	const tilesetRequests: string[] = [];
	page.on('request', (request) => {
		if (/\/ion\/6045068\/tileset\.json/.test(request.url())) tilesetRequests.push(request.url());
	});
	await page.goto('/g2nk/khorinis');
	await expect(page.getByText(/312 przedmiotów/)).toBeVisible({ timeout: 30_000 });
	await page
		.getByRole('navigation', { name: 'Narzędzia' })
		.getByRole('button', { name: 'Warstwy' })
		.click();
	const checkbox = page.getByRole('checkbox', { name: /Obiekty świata/ });
	await expect(checkbox).not.toBeChecked();
	await checkbox.check();
	await expect(checkbox).toBeChecked({ timeout: 60_000 });
	expect(tilesetRequests.length).toBeGreaterThan(0);
});
