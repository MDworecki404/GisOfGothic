<script lang="ts">
	import FootprintsIcon from '@lucide/svelte/icons/footprints';
	import { appState, geoportal } from '#lib/composition-root.js';

	function stopWalkingOnEscape(event: KeyboardEvent): void {
		if (event.key === 'Escape' && appState.isWalking && !event.defaultPrevented) {
			geoportal.stopWalking();
		}
	}
</script>

<svelte:window onkeydown={stopWalkingOnEscape} />

{#if appState.isWalking}
	<div
		class="material-leather pointer-events-auto fixed bottom-[calc(var(--edge-inset)+4.5rem)] left-1/2 z-20 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-3 px-4 py-2.5 text-label text-muted-foreground md:bottom-(--edge-inset)"
		role="status"
		data-map-obstacle
	>
		<FootprintsIcon class="size-4 shrink-0 text-primary" />
		<span class="min-w-0"
			>Spacer: <kbd class="font-sans text-foreground">W A S D</kbd> idź,
			<kbd class="font-sans text-foreground">Shift</kbd> biegnij, przeciągnij, by się rozejrzeć</span
		>
		<button
			class="min-h-9 shrink-0 rounded-sm px-2.5 text-foreground hover:bg-hover-surface hover:text-hover"
			onclick={() => geoportal.stopWalking()}
		>
			Zejdź (Esc)
		</button>
	</div>
{/if}
