<script lang="ts">
	import CrosshairIcon from '@lucide/svelte/icons/crosshair';
	import FootprintsIcon from '@lucide/svelte/icons/footprints';
	import { appState, geoportal } from '#lib/composition-root.js';

	function stopWalkingOnEscape(event: KeyboardEvent): void {
		if (event.key === 'Escape' && appState.walkingStage !== 'off' && !event.defaultPrevented) {
			geoportal.stopWalking();
		}
	}
</script>

<svelte:window onkeydown={stopWalkingOnEscape} />

{#if appState.walkingStage !== 'off'}
	<div
		class="material-leather pointer-events-auto fixed top-[calc(var(--top-bar-height)+0.5rem)] left-1/2 z-30 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-3 px-4 py-2.5 text-label text-muted-foreground"
		role="status"
		data-testid="walking-hint"
	>
		{#if appState.walkingStage === 'choosing'}
			<CrosshairIcon class="size-4 shrink-0 text-primary" />
			<span class="min-w-0"
				>Kliknij miejsce na mapie, w którym chcesz zacząć spacer. Mapą możesz poruszać jak zwykle.</span
			>
			<button
				class="min-h-9 shrink-0 rounded-sm px-2.5 text-foreground hover:bg-hover-surface hover:text-hover"
				onclick={() => geoportal.stopWalking()}
			>
				Anuluj (Esc)
			</button>
		{:else}
			<FootprintsIcon class="size-4 shrink-0 text-primary" />
			<span class="min-w-0"
				>Idź: <kbd class="font-sans text-foreground">W A S D</kbd>, biegnij:
				<kbd class="font-sans text-foreground">Shift</kbd>, rozglądaj się: przeciągnij</span
			>
			<button
				class="min-h-9 shrink-0 rounded-sm px-2.5 text-foreground hover:bg-hover-surface hover:text-hover"
				onclick={() => geoportal.stopWalking()}
			>
				Zejdź (Esc)
			</button>
		{/if}
	</div>
{/if}
