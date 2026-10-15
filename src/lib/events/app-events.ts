import type { IndexCounts } from '#lib/data/types.js';
import type { CoordinateSystemId } from '#lib/services/geodesy/coordinate-formatter.js';
import type { WorldPosition } from '#lib/services/geodesy/world-frame.js';
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
	| { type: 'coordinate-system-changed'; systemId: CoordinateSystemId };

export type AppEventBus = EventBus<AppEvent>;
