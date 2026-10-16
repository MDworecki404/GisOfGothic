<script lang="ts">
	import { appState } from '#lib/composition-root.js';
	import TileLoader from './TileLoader.svelte';

	const pendingTiles = $derived(appState.worldTilesPending + appState.staticObjectsTilesPending);
	const isLoadingWorld = $derived(appState.worldStatus === 'loading');
	const isVisible = $derived(isLoadingWorld || pendingTiles > 0);
	const label = $derived(isLoadingWorld ? 'Wczytuję model świata' : 'Dociągam szczegóły terenu');
</script>

{#if isVisible}
	<div
		class="panel-stone pointer-events-none fixed top-[calc(3.5rem+10px)] left-1/2 z-30 flex -translate-x-1/2 items-center gap-2.5 rounded-sm px-3 py-1.5 text-sm text-muted-foreground md:top-[calc(3.25rem+10px)]"
		aria-live="polite"
		data-testid="tiles-loading-badge"
	>
		<TileLoader {label} count={isLoadingWorld ? null : pendingTiles} />
		<span>{label}…</span>
	</div>
{/if}
