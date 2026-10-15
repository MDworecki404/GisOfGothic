import { PUBLIC_CESIUM_ION_TOKEN } from '$app/env/public';
import { GeoportalDataLoader } from '#lib/data/geoportal-data-loader.js';
import type { AppEvent } from '#lib/events/app-events.js';
import { EventBus } from '#lib/events/event-bus.js';
import { GeoportalFacade } from '#lib/services/geoportal-facade.js';
import { AppState } from '#lib/state/app-state.svelte.js';

const eventBus = new EventBus<AppEvent>();

export const geoportal = new GeoportalFacade(
	eventBus,
	(dataBaseUrl) => new GeoportalDataLoader(dataBaseUrl),
	PUBLIC_CESIUM_ION_TOKEN
);

export const appState = new AppState(eventBus);

export { worldCatalog } from '#lib/data/world-catalog.js';
