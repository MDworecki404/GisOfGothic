import type { IndexCounts } from '#lib/data/types.js';
import type { AppEventBus } from '#lib/events/app-events.js';
import {
	CoordinateFormatter,
	type CoordinateReading,
	type CoordinateSystem,
	type CoordinateSystemId
} from '#lib/services/geodesy/coordinate-formatter.js';
import { ScaleBarCalculator, type ScaleBar } from '#lib/services/geodesy/scale-bar-calculator.js';
import type { WorldPosition } from '#lib/services/geodesy/world-frame.js';
import type { ToolId } from '#lib/services/tools/tool-id.js';

const coordinateFormatter = new CoordinateFormatter();
const scaleBarCalculator = new ScaleBarCalculator();

export type LoadStatus = 'loading' | 'ready' | 'error';

export class AppState {
	worldStatus = $state<LoadStatus>('loading');
	worldErrorMessage = $state<string | null>(null);
	searchIndexStatus = $state<LoadStatus>('loading');
	searchIndexErrorMessage = $state<string | null>(null);
	indexCounts = $state<IndexCounts | null>(null);
	openedWorldName = $state<string | null>(null);
	activeToolId = $state<ToolId | null>('search');
	cursorPosition = $state<WorldPosition | null>(null);
	headingDegrees = $state(0);
	metresPerPixel = $state<number | null>(null);
	coordinateSystemId = $state<CoordinateSystemId>('khorinis-1992');

	constructor(eventBus: AppEventBus) {
		eventBus.subscribe('tool-selected', ({ toolId }) => {
			this.activeToolId = toolId;
		});
		eventBus.subscribe('cursor-moved', ({ position }) => {
			this.cursorPosition = position;
		});
		eventBus.subscribe('camera-heading-changed', ({ headingDegrees }) => {
			this.headingDegrees = headingDegrees;
		});
		eventBus.subscribe('map-scale-changed', ({ metresPerPixel }) => {
			this.metresPerPixel = metresPerPixel;
		});
		eventBus.subscribe('coordinate-system-changed', ({ systemId }) => {
			this.coordinateSystemId = systemId;
		});
		eventBus.subscribe('world-opened', ({ worldName }) => {
			this.openedWorldName = worldName;
			this.indexCounts = null;
		});
		eventBus.subscribe('world-load-started', () => {
			this.worldStatus = 'loading';
			this.worldErrorMessage = null;
		});
		eventBus.subscribe('world-loaded', () => {
			this.worldStatus = 'ready';
		});
		eventBus.subscribe('world-load-failed', ({ message }) => {
			this.worldStatus = 'error';
			this.worldErrorMessage = message;
		});
		eventBus.subscribe('search-index-load-started', () => {
			this.searchIndexStatus = 'loading';
			this.searchIndexErrorMessage = null;
		});
		eventBus.subscribe('search-index-loaded', ({ counts }) => {
			this.searchIndexStatus = 'ready';
			this.indexCounts = counts;
		});
		eventBus.subscribe('search-index-load-failed', ({ message }) => {
			this.searchIndexStatus = 'error';
			this.searchIndexErrorMessage = message;
		});
	}

	get statusText(): string {
		if (this.worldStatus === 'error') {
			return `Błąd wczytywania modelu świata: ${this.worldErrorMessage}`;
		}
		if (this.searchIndexStatus === 'error') {
			return `Błąd wczytywania indeksu: ${this.searchIndexErrorMessage}`;
		}
		if (this.worldStatus === 'loading') return 'Wczytywanie modelu świata…';
		if (this.indexCounts) {
			return `Przedmioty: ${this.indexCounts.items} · Postacie: ${this.indexCounts.characters}`;
		}
		return 'Wczytywanie indeksu…';
	}

	get coordinateSystem(): CoordinateSystem {
		return coordinateFormatter.findCoordinateSystem(this.coordinateSystemId);
	}

	get cursorReadings(): CoordinateReading[] | null {
		if (!this.cursorPosition) return null;
		return coordinateFormatter.formatPosition(this.cursorPosition, this.coordinateSystemId);
	}

	get scaleBar(): ScaleBar | null {
		return this.metresPerPixel === null ? null : scaleBarCalculator.calculate(this.metresPerPixel);
	}

	get hasError(): boolean {
		return this.worldStatus === 'error' || this.searchIndexStatus === 'error';
	}
}
