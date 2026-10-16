import type { AppEventBus } from '#lib/events/app-events.js';

export interface InstallPromptEvent extends Event {
	prompt(): Promise<void>;
	userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function isInstallPromptEvent(event: Event): event is InstallPromptEvent {
	return 'prompt' in event && typeof event.prompt === 'function' && 'userChoice' in event;
}

/**
 * Instalacja aplikacji (PWA). Przeglądarka sygnalizuje możliwość instalacji zdarzeniem
 * `beforeinstallprompt`; zatrzymujemy je i pokazujemy własny przycisk, który wywołuje okno
 * instalacji dopiero na prośbę użytkownika. Po instalacji przycisk znika.
 */
export class AppInstallation {
	private pendingPrompt: InstallPromptEvent | null = null;

	constructor(
		private readonly eventBus: AppEventBus,
		private readonly target: Pick<EventTarget, 'addEventListener'>
	) {}

	listenForInstallability(): void {
		this.target.addEventListener('beforeinstallprompt', (event) => {
			if (!isInstallPromptEvent(event)) return;
			event.preventDefault();
			this.pendingPrompt = event;
			this.publish(true);
		});
		this.target.addEventListener('appinstalled', () => {
			this.pendingPrompt = null;
			this.publish(false);
		});
	}

	async promptInstallation(): Promise<void> {
		const prompt = this.pendingPrompt;
		if (!prompt) return;
		this.pendingPrompt = null;
		this.publish(false);
		await prompt.prompt();
		await prompt.userChoice;
	}

	private publish(canInstall: boolean): void {
		this.eventBus.publish({ type: 'app-installability-changed', canInstall });
	}
}
