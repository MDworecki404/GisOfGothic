import type { AppEventBus } from '#lib/events/app-events.js';

export type StaticObjectsStatus = 'hidden' | 'loading' | 'visible' | 'error';

export interface StaticObjectsDisplay {
	showStaticObjectsTilesets(tilesetUrls: readonly string[]): Promise<void>;
	hideStaticObjectsTileset(): void;
}

function describeError(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}

/**
 * Warstwa statycznych obiektów świata (voby: drzewa, budynki, rekwizyty, także przedmioty
 * leżące na ziemi). Jest wyłączona po otwarciu świata i wczytuje się dopiero po włączeniu.
 */
export class StaticObjectsCoordinator {
	private tilesetUrls: readonly string[] = [];
	private status: StaticObjectsStatus = 'hidden';
	private request = 0;

	constructor(
		private readonly eventBus: AppEventBus,
		private readonly getDisplay: () => StaticObjectsDisplay | null
	) {}

	useWorld(tilesetUrls: readonly string[]): void {
		this.request++;
		this.getDisplay()?.hideStaticObjectsTileset();
		this.tilesetUrls = tilesetUrls;
		this.setStatus('hidden');
	}

	async toggle(): Promise<void> {
		if (this.status === 'loading') return;
		if (this.status === 'visible') {
			this.request++;
			this.getDisplay()?.hideStaticObjectsTileset();
			this.setStatus('hidden');
			return;
		}
		await this.show();
	}

	/** Po ponownym wczytaniu modelu świata (np. nowa mapa) przywraca włączoną warstwę. */
	restoreOnMap(): void {
		if (this.status === 'visible') void this.show();
	}

	private async show(): Promise<void> {
		const display = this.getDisplay();
		const tilesetUrls = this.tilesetUrls;
		if (!display) return;
		if (tilesetUrls.length === 0) {
			this.setStatus('error', 'Obiekty tego świata nie są jeszcze dostępne');
			return;
		}
		const request = ++this.request;
		this.setStatus('loading');
		try {
			await display.showStaticObjectsTilesets(tilesetUrls);
			if (request === this.request) this.setStatus('visible');
		} catch (error) {
			if (request !== this.request) return;
			console.error(error);
			this.setStatus('error', describeError(error));
		}
	}

	private setStatus(status: StaticObjectsStatus, errorMessage: string | null = null): void {
		this.status = status;
		this.eventBus.publish({ type: 'static-objects-changed', status, errorMessage });
	}
}
