import { expect, test } from '@playwright/test';

test('manifest opisuje aplikację i ma ikony', async ({ request }) => {
	const response = await request.get('/manifest.webmanifest');
	expect(response.ok()).toBe(true);
	const manifest: unknown = await response.json();
	expect(manifest).toMatchObject({
		name: 'GIS of Gothic',
		lang: 'pl',
		display: 'standalone',
		start_url: '/'
	});
	for (const iconPath of [
		'/icons/icon-192.png',
		'/icons/icon-512.png',
		'/icons/icon-maskable-512.png'
	]) {
		expect((await request.get(iconPath)).ok()).toBe(true);
	}
});

test('service worker zapisuje aplikację i dane, więc działa bez sieci', async ({
	page,
	context
}) => {
	await page.goto('/g2nk/khorinis');
	await page.evaluate(async () => {
		await navigator.serviceWorker.ready;
	});
	await page.reload();
	await expect(page.getByTestId('status-bar')).toContainText(/Przedmioty: \d+/, {
		timeout: 30_000
	});

	await context.setOffline(true);
	await page.reload();
	await page.getByRole('searchbox').fill('szczaw');
	await expect(page.getByRole('button', { name: /Szczaw królewski/ })).toBeVisible();
	await context.setOffline(false);
});
