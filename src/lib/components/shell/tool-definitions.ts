import ClockIcon from '@lucide/svelte/icons/clock';
import LayersIcon from '@lucide/svelte/icons/layers';
import RadarIcon from '@lucide/svelte/icons/radar';
import RulerIcon from '@lucide/svelte/icons/ruler';
import SearchIcon from '@lucide/svelte/icons/search';
import type { Component } from 'svelte';
import type { ToolId } from '#lib/services/tools/tool-id.js';

export interface ToolDefinition {
	id: ToolId;
	label: string;
	panelTitle: string;
	icon: Component;
}

export const TOOL_DEFINITIONS: readonly ToolDefinition[] = [
	{ id: 'search', label: 'Szukaj', panelTitle: 'Wyszukiwarka', icon: SearchIcon },
	{ id: 'layers', label: 'Warstwy', panelTitle: 'Warstwy', icon: LayersIcon },
	{ id: 'measure', label: 'Pomiary', panelTitle: 'Pomiary', icon: RulerIcon },
	{ id: 'analysis', label: 'Analizy', panelTitle: 'Analizy', icon: RadarIcon },
	{ id: 'time', label: 'Czas', panelTitle: 'Czas i rozdział', icon: ClockIcon }
];
