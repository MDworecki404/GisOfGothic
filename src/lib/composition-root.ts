import { browser } from '$app/env';
import { PUBLIC_MODEL_KEY } from '$app/env/public';
import { GeoportalDataLoader } from '#lib/data/geoportal-data-loader.js';
import type { AppEvent } from '#lib/events/app-events.js';
import { EventBus } from '#lib/events/event-bus.js';
import { BookmarkStore } from '#lib/services/bookmarks/bookmark-store.js';
import { GeoportalFacade } from '#lib/services/geoportal-facade.js';
import { ProtectedModelLoader } from '#lib/services/models/protected-model-loader.js';
import { PerformancePreferenceStore } from '#lib/services/performance/performance-preference-store.js';
import { AppInstallation } from '#lib/services/pwa/app-installation.js';
import { AppState } from '#lib/state/app-state.svelte.js';
import { MobileSheetState } from '#lib/state/mobile-sheet-state.svelte.js';

const eventBus = new EventBus<AppEvent>();

export const geoportal = new GeoportalFacade(
	eventBus,
	(dataBaseUrl) => new GeoportalDataLoader(dataBaseUrl),
	BookmarkStore.forBrowser(),
	PUBLIC_MODEL_KEY ? new ProtectedModelLoader(PUBLIC_MODEL_KEY) : null,
	PerformancePreferenceStore.forBrowser()
);

export const appState = new AppState(eventBus);

export const mobileSheet = new MobileSheetState(eventBus);

const appInstallation = new AppInstallation(eventBus, globalThis);
if (browser) appInstallation.listenForInstallability();

export function installApp(): Promise<void> {
	return appInstallation.promptInstallation();
}

export { worldCatalog } from '#lib/data/world-catalog.js';
