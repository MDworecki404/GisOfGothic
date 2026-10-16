import { describe, expect, it } from 'vitest';
import type { AppEvent } from '#lib/events/app-events.js';
import { EventBus } from '#lib/events/event-bus.js';
import { AppInstallation, isInstallPromptEvent } from './app-installation.js';

function createInstallPromptEvent(onPrompt: () => void) {
	return Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
		prompt: async () => onPrompt(),
		userChoice: Promise.resolve({ outcome: 'accepted' as const })
	});
}

describe('AppInstallation', () => {
	it('rozpoznaje zdarzenie instalacji po metodzie prompt', () => {
		expect(isInstallPromptEvent(createInstallPromptEvent(() => undefined))).toBe(true);
		expect(isInstallPromptEvent(new Event('beforeinstallprompt'))).toBe(false);
	});

	it('zatrzymuje okno przeglądarki i pokazuje je dopiero na prośbę użytkownika', async () => {
		const bus = new EventBus<AppEvent>();
		const availability: boolean[] = [];
		bus.subscribe('app-installability-changed', ({ canInstall }) => availability.push(canInstall));
		const target = new EventTarget();
		const installation = new AppInstallation(bus, target);
		installation.listenForInstallability();

		let promptCount = 0;
		const event = createInstallPromptEvent(() => promptCount++);
		target.dispatchEvent(event);
		expect(event.defaultPrevented).toBe(true);
		expect(availability).toEqual([true]);

		await installation.promptInstallation();
		expect(promptCount).toBe(1);
		expect(availability).toEqual([true, false]);

		await installation.promptInstallation();
		expect(promptCount).toBe(1);
	});
});
