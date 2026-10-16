import type { IndexCounts } from '#lib/data/types.js';
import type { ChapterNumber } from '#lib/services/chapters/chapter-filter.js';
import type { CoordinateSystemId } from '#lib/services/geodesy/coordinate-formatter.js';
import type { WorldPosition } from '#lib/services/geodesy/world-frame.js';
import type {
	SearchEntryDetails,
	SearchResult
} from '#lib/services/search/search-entry-presenter.js';
import type { SearchTypeFilter } from '#lib/services/search/search-service.js';
import type { AnalysisView } from '#lib/services/analysis/analysis-coordinator.js';
import type { BookmarkView } from '#lib/services/bookmarks/bookmarks-coordinator.js';
import type { CameraView } from '#lib/services/bookmarks/camera-view-codec.js';
import type { FeatureIdentification } from '#lib/services/layers/data-layer-catalog.js';
import type { DataLayerView } from '#lib/services/layers/data-layers-coordinator.js';
import type { MeasurementView } from '#lib/services/measurement/measurement-coordinator.js';
import type { RoutineLayerStatus, ShadowSettings } from '#lib/services/time/time-coordinator.js';
import type { ToolId } from '#lib/services/tools/tool-id.js';
import { EventBus } from './event-bus.js';

export type AppEvent =
	| { type: 'world-opened'; worldName: string }
	| { type: 'world-load-started' }
	| { type: 'world-loaded' }
	| { type: 'world-load-failed'; message: string }
	| { type: 'search-index-load-started' }
	| { type: 'search-index-loaded'; counts: IndexCounts }
	| { type: 'search-index-load-failed'; message: string }
	| { type: 'cursor-moved'; position: WorldPosition | null }
	| { type: 'camera-heading-changed'; headingDegrees: number }
	| { type: 'map-scale-changed'; metresPerPixel: number | null }
	| { type: 'tool-selected'; toolId: ToolId | null }
	| { type: 'coordinate-system-changed'; systemId: CoordinateSystemId }
	| {
			type: 'search-results-changed';
			query: string;
			typeFilter: SearchTypeFilter;
			results: SearchResult[];
	  }
	| { type: 'search-entry-selected'; details: SearchEntryDetails | null }
	| { type: 'data-layers-changed'; layers: DataLayerView[] }
	| { type: 'data-layer-load-failed'; layerName: string; message: string }
	| { type: 'feature-identified'; identification: FeatureIdentification | null }
	| { type: 'measurement-changed'; measurement: MeasurementView }
	| { type: 'analysis-changed'; analysis: AnalysisView }
	| { type: 'camera-view-changed'; view: CameraView | null }
	| { type: 'chapter-changed'; chapter: ChapterNumber | null }
	| { type: 'bookmarks-changed'; bookmarks: BookmarkView[]; hasStorageError: boolean }
	| {
			type: 'time-of-day-changed';
			minuteOfDay: number;
			routineLayerStatus: RoutineLayerStatus;
			charactersOnMap: number | null;
			shadows: ShadowSettings;
	  }
	| { type: 'app-installability-changed'; canInstall: boolean };

export type AppEventBus = EventBus<AppEvent>;
