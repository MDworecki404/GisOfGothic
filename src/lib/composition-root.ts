import { browser } from '$app/env';
import { PUBLIC_MODEL_KEY } from '$app/env/public';
import { GeoportalDataLoader } from '#lib/data/geoportal-data-loader.js';
import type { AppEvent } from '#lib/events/app-events.js';
import { EventBus } from '#lib/events/event-bus.js';
import { BookmarkStore } from '#lib/services/bookmarks/bookmark-store.js';
import { NotebookStore } from '#lib/services/notebook/notebook-store.js';
import { GeoportalFacade } from '#lib/services/geoportal-facade.js';
import { ProtectedModelLoader } from '#lib/services/models/protected-model-loader.js';
import {
	IssueReportLinkBuilder,
	type IssueReportKind
} from '#lib/services/feedback/issue-report-link-builder.js';
import { PerformancePreferenceStore } from '#lib/services/performance/performance-preference-store.js';
import { QUALITY_LEVEL_LABELS } from '#lib/services/performance/performance-profiles.js';
import { AppInstallation } from '#lib/services/pwa/app-installation.js';
import { ThemeCoordinator } from '#lib/services/theme/theme-coordinator.js';
import { BrowserThemeDocument, NO_THEME_DOCUMENT } from '#lib/services/theme/theme-document.js';
import { ThemePreferenceStore } from '#lib/services/theme/theme-preference-store.js';
import type { ThemePreference } from '#lib/services/theme/theme-preference.js';
import { AppState } from '#lib/state/app-state.svelte.js';
import { FlightControlsState } from '#lib/state/flight-controls-state.svelte.js';
import { MobileSheetState } from '#lib/state/mobile-sheet-state.svelte.js';

const eventBus = new EventBus<AppEvent>();

export const geoportal = new GeoportalFacade(
	eventBus,
	(dataBaseUrl) => new GeoportalDataLoader(dataBaseUrl),
	BookmarkStore.forBrowser(),
	NotebookStore.forBrowser(),
	PUBLIC_MODEL_KEY ? new ProtectedModelLoader(PUBLIC_MODEL_KEY) : null,
	PerformancePreferenceStore.forBrowser()
);

export const appState = new AppState(eventBus);

const themeCoordinator = new ThemeCoordinator(
	eventBus,
	browser ? BrowserThemeDocument.forBrowser() : NO_THEME_DOCUMENT,
	ThemePreferenceStore.forBrowser()
);
if (browser) themeCoordinator.start();

export function selectTheme(preference: ThemePreference): void {
	themeCoordinator.selectPreference(preference);
}

export const mobileSheet = new MobileSheetState(eventBus);

export const flightControls = new FlightControlsState(false);

const appInstallation = new AppInstallation(eventBus, globalThis);
if (browser) appInstallation.listenForInstallability();

export function installApp(): Promise<void> {
	return appInstallation.promptInstallation();
}

const issueReportLinkBuilder = new IssueReportLinkBuilder(
	'https://github.com/MDworecki404/GisOfGothic'
);

export function buildIssueReportLink(kind: IssueReportKind): string {
	return issueReportLinkBuilder.build(kind, {
		appVersion: __APP_VERSION__,
		worldName: appState.openedWorldName,
		viewUrl: window.location.href,
		userAgent: navigator.userAgent,
		viewportSize: `${window.innerWidth}×${window.innerHeight}`,
		graphicsQualityLabel: QUALITY_LEVEL_LABELS[appState.performanceLevel]
	});
}

export { worldCatalog } from '#lib/data/world-catalog.js';
