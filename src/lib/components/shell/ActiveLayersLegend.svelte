<script lang="ts">
	import { appState, geoportal, mobileSheet } from '#lib/composition-root.js';
	import TileLoader from './TileLoader.svelte';

	const shownLayers = $derived(
		appState.dataLayers.filter((layer) => layer.status === 'visible' || layer.status === 'loading')
	);

	function openLayersPanel(): void {
		if (appState.activeToolId === 'layers') mobileSheet.expandIfCollapsed();
		else geoportal.selectTool('layers');
	}
</script>

{#if shownLayers.length > 0}
	<button
		class="material-leather fixed bottom-[calc(var(--bottom-nav-height)+var(--sheet-occupied-height)+var(--gutter)+2.25rem)] left-(--gutter) z-10 flex min-h-11 max-w-[calc(100vw-2*var(--gutter)-var(--map-controls-width))] flex-col gap-0.5 rounded-md px-3 py-2 text-left text-caption hover:shadow-[var(--shadow-panel),var(--glow-torch)] md:bottom-[calc(var(--status-bar-height)+var(--gutter)+2.25rem)] md:left-[calc(var(--rail-width)+var(--panel-occupied-width)+var(--gutter))]"
		title="Otwórz panel Warstwy"
		onclick={openLayersPanel}
	>
		<span class="sr-only">Legenda włączonych warstw (otwiera panel Warstwy):</span>
		{#each shownLayers as layer (layer.id)}
			<span class="flex items-center gap-2">
				<span class="size-2.5 shrink-0 rounded-full" style:background-color={layer.color}></span>
				<span class="truncate">{layer.name}</span>
				<span class="ml-auto pl-2 text-muted-foreground tabular-nums">
					{#if layer.status === 'loading'}
						<TileLoader label="Wczytuję warstwę {layer.name}" />
					{:else}
						{layer.featureCount ?? ''}
					{/if}
				</span>
			</span>
		{/each}
	</button>
{/if}
