import BookmarkIcon from '@lucide/svelte/icons/bookmark';
import ClockIcon from '@lucide/svelte/icons/clock';
import GlobeIcon from '@lucide/svelte/icons/globe';
import LayersIcon from '@lucide/svelte/icons/layers';
import MapIcon from '@lucide/svelte/icons/map';
import RulerIcon from '@lucide/svelte/icons/ruler';
import ScrollTextIcon from '@lucide/svelte/icons/scroll-text';
import SearchIcon from '@lucide/svelte/icons/search';
import type { Component } from 'svelte';
import type { ToolId } from '../state/mockup-state.svelte.js';
import type { ViewId } from '../state/router.svelte.js';

export type NavigationAction =
	{ kind: 'view'; view: ViewId } | { kind: 'tool'; tool: ToolId } | { kind: 'search' };

export interface NavigationItem {
	id: string;
	label: string;
	icon: Component;
	action: NavigationAction;
	group: 'map' | 'book';
	onPhoneBar: boolean;
}

export const NAVIGATION_ITEMS: readonly NavigationItem[] = [
	{
		id: 'map',
		label: 'Mapa',
		icon: MapIcon,
		action: { kind: 'view', view: 'atlas' },
		group: 'map',
		onPhoneBar: true
	},
	{
		id: 'search',
		label: 'Szukaj',
		icon: SearchIcon,
		action: { kind: 'search' },
		group: 'map',
		onPhoneBar: true
	},
	{
		id: 'layers',
		label: 'Warstwy',
		icon: LayersIcon,
		action: { kind: 'tool', tool: 'layers' },
		group: 'map',
		onPhoneBar: true
	},
	{
		id: 'time',
		label: 'Czas',
		icon: ClockIcon,
		action: { kind: 'tool', tool: 'time' },
		group: 'map',
		onPhoneBar: false
	},
	{
		id: 'measure',
		label: 'Pomiary',
		icon: RulerIcon,
		action: { kind: 'tool', tool: 'measure' },
		group: 'map',
		onPhoneBar: false
	},
	{
		id: 'saved',
		label: 'Zakładki',
		icon: BookmarkIcon,
		action: { kind: 'tool', tool: 'saved' },
		group: 'map',
		onPhoneBar: false
	},
	{
		id: 'quests',
		label: 'Zadania',
		icon: ScrollTextIcon,
		action: { kind: 'view', view: 'quests' },
		group: 'book',
		onPhoneBar: true
	},
	{
		id: 'worlds',
		label: 'Światy',
		icon: GlobeIcon,
		action: { kind: 'view', view: 'worlds' },
		group: 'book',
		onPhoneBar: false
	}
];
