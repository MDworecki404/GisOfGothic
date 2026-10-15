<script lang="ts">
	import XIcon from '@lucide/svelte/icons/x';
	import { appState, geoportal } from '#lib/composition-root.js';
	import LayersPanel from '#lib/components/panels/LayersPanel.svelte';
	import MeasurePanel from '#lib/components/panels/MeasurePanel.svelte';
	import SearchPanel from '#lib/components/panels/SearchPanel.svelte';
	import TimePanel from '#lib/components/panels/TimePanel.svelte';
	import { TOOL_DEFINITIONS } from './tool-definitions.js';

	const activeTool = $derived(TOOL_DEFINITIONS.find((tool) => tool.id === appState.activeToolId));

	function closePanelOnEscape(event: KeyboardEvent): void {
		if (event.key === 'Escape' && activeTool) geoportal.closeActiveTool();
	}
</script>

<svelte:window onkeydown={closePanelOnEscape} />

{#if activeTool}
	<section
		class="panel-stone fixed inset-x-0 bottom-15 z-20 flex h-[52dvh] flex-col overflow-hidden rounded-t-xl md:top-[calc(3.25rem+10px)] md:right-auto md:bottom-[calc(2.25rem+10px)] md:left-[calc(4rem+10px)] md:h-auto md:w-92 md:rounded-sm"
		aria-label={activeTool.panelTitle}
	>
		<div class="mx-auto mt-2 h-1 w-10 rounded-full bg-[var(--forged-edge)] md:hidden"></div>
		<div class="flex items-center justify-between border-b border-border px-3.5 py-2.5">
			<h2 class="text-[15px] font-semibold text-primary">{activeTool.panelTitle}</h2>
			<button
				class="grid size-8 place-items-center rounded-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
				aria-label="Zamknij panel"
				onclick={() => geoportal.closeActiveTool()}
			>
				<XIcon class="size-4" />
			</button>
		</div>
		<div class="flex-1 overflow-y-auto px-3.5 pt-3 pb-4">
			{#if activeTool.id === 'search'}
				<SearchPanel />
			{:else if activeTool.id === 'layers'}
				<LayersPanel />
			{:else if activeTool.id === 'measure'}
				<MeasurePanel />
			{:else}
				<TimePanel />
			{/if}
		</div>
	</section>
{/if}
