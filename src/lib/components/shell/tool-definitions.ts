import BookmarkIcon from '@lucide/svelte/icons/bookmark';
import ClockIcon from '@lucide/svelte/icons/clock';
import LayersIcon from '@lucide/svelte/icons/layers';
import NotebookPenIcon from '@lucide/svelte/icons/notebook-pen';
import RadarIcon from '@lucide/svelte/icons/radar';
import RulerIcon from '@lucide/svelte/icons/ruler';
import ScalingIcon from '@lucide/svelte/icons/scaling';
import SearchIcon from '@lucide/svelte/icons/search';
import type { Component } from 'svelte';
import type { ToolId } from '#lib/services/tools/tool-id.js';

/** Grupy w doku narzędzi, oddzielone kreską: znajdowanie, mierzenie, czas i własne notatki. */
export type ToolGroup = 'find' | 'measure' | 'time';

export interface ToolDefinition {
	id: ToolId;
	label: string;
	panelTitle: string;
	icon: Component;
	group: ToolGroup;
	/** Narzędzia spoza paska telefonu są w menu „Inne”. */
	isOnPhoneBar: boolean;
	/** `book` otwiera okno Księgi, `panel` panel przy doku (albo arkusz na telefonie). */
	presentation: 'panel' | 'book';
}

export const TOOL_DEFINITIONS: readonly ToolDefinition[] = [
	{
		id: 'search',
		label: 'Szukaj',
		panelTitle: 'Wyszukiwarka',
		icon: SearchIcon,
		group: 'find',
		isOnPhoneBar: true,
		presentation: 'book'
	},
	{
		id: 'layers',
		label: 'Warstwy',
		panelTitle: 'Warstwy',
		icon: LayersIcon,
		group: 'find',
		isOnPhoneBar: true,
		presentation: 'panel'
	},
	{
		id: 'measure',
		label: 'Pomiary',
		panelTitle: 'Pomiary',
		icon: RulerIcon,
		group: 'measure',
		isOnPhoneBar: true,
		presentation: 'panel'
	},
	{
		id: 'analysis',
		label: 'Analizy',
		panelTitle: 'Analizy',
		icon: RadarIcon,
		group: 'measure',
		isOnPhoneBar: false,
		presentation: 'panel'
	},
	{
		id: 'sizes',
		label: 'Rozmiary',
		panelTitle: 'Rozmiary światów',
		icon: ScalingIcon,
		group: 'measure',
		isOnPhoneBar: false,
		presentation: 'panel'
	},
	{
		id: 'time',
		label: 'Czas',
		panelTitle: 'Czas i rozdział',
		icon: ClockIcon,
		group: 'time',
		isOnPhoneBar: true,
		presentation: 'panel'
	},
	{
		id: 'notebook',
		label: 'Notatnik',
		panelTitle: 'Notatnik',
		icon: NotebookPenIcon,
		group: 'time',
		isOnPhoneBar: false,
		presentation: 'panel'
	},
	{
		id: 'bookmarks',
		label: 'Zakładki',
		panelTitle: 'Zakładki',
		icon: BookmarkIcon,
		group: 'time',
		isOnPhoneBar: false,
		presentation: 'panel'
	}
];
