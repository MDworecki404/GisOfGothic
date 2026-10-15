import type { IndexCounts } from '#lib/data/types.js';
import { EventBus } from './event-bus.js';

export type AppEvent =
	| { type: 'world-opened'; worldName: string }
	| { type: 'world-load-started' }
	| { type: 'world-loaded' }
	| { type: 'world-load-failed'; message: string }
	| { type: 'search-index-load-started' }
	| { type: 'search-index-loaded'; counts: IndexCounts }
	| { type: 'search-index-load-failed'; message: string };

export type AppEventBus = EventBus<AppEvent>;
