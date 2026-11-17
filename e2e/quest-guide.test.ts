import { BOOK_URL, expect, test } from './support/test.js';

test.use({ serviceWorkers: 'block' });

interface StubbedStage {
	place: unknown;
	alternative_group?: string | null;
}

interface StubbedQuest {
	id: string;
	stages: StubbedStage[];
}

function isStubbedCatalog(value: unknown): value is { quests: StubbedQuest[] } {
	return typeof value === 'object' && value !== null && 'quests' in value;
}

test.beforeEach(async ({ page }) => {
	await page.route('**/g2nk/khorinis/quests.json', async (route) => {
		const response = await route.fetch();
		const catalog: unknown = await response.json();
		if (isStubbedCatalog(catalog)) {
			const quest = catalog.quests.find(
				(candidate) => candidate.id === 'quest:TOPIC_ADDON_BALTRAMSKIPTRADE'
			);
			const placedStages = quest?.stages.filter((stage) => stage.place) ?? [];
			placedStages.slice(1, 3).forEach((stage) => (stage.alternative_group = 'GROUP_TEST'));
		}
		await route.fulfill({ response, json: catalog });
	});
});

test('przewodnik po queście pokazuje trasę i przechodzi po przystankach', async ({ page }) => {
	await page.goto(BOOK_URL);
	await page.getByRole('searchbox', { name: /Szukaj/ }).fill('Piracki handel');
	await page.getByRole('button', { name: /^Piracki handel/ }).click();
	await page.getByRole('button', { name: 'Otwórz w Księdze' }).click();
	await expect(page.getByRole('heading', { name: 'Przewodnik' })).toBeVisible();
	await expect(page.getByText('jedna z możliwych dróg').first()).toBeVisible();

	await page.getByRole('button', { name: 'Pokaż trasę na mapie' }).click();
	await expect(page.getByText(/Przewodnik · krok 1 z \d+/)).toBeVisible();
	await page.getByRole('button', { name: 'Dalej' }).click();
	await expect(page.getByText(/Przewodnik · krok 2 z \d+/)).toBeVisible();
	await page.getByRole('button', { name: 'Ukryj trasę' }).click();
	await expect(page.getByText(/Przewodnik · krok/)).toHaveCount(0);
});
