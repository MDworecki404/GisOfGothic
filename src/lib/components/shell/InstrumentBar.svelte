<script lang="ts">
	import { appState, geoportal } from '#lib/composition-root.js';

	const cell = 'instrument-cell flex items-center gap-2 px-3.5 whitespace-nowrap';
</script>

<footer
	class="instrument-bar fixed left-2 z-20 h-7 items-stretch rounded-sm text-[13px] tabular-nums md:inset-x-0 md:bottom-0 md:h-9 md:rounded-none {appState.activeToolId
		? 'bottom-[calc(3.75rem+52dvh+8px)]'
		: 'bottom-[calc(3.75rem+8px)]'} {appState.cursorReadings ? 'flex' : 'hidden md:flex'}"
	aria-label="Pozycja kursora, skala i stan"
>
	{#if appState.cursorReadings}
		{#each appState.cursorReadings as reading, index (reading.axis)}
			<div class="{cell} {index === 2 ? 'hidden md:flex' : ''}">
				<span class="text-muted-foreground">{reading.axis}</span>
				<span>{reading.value}</span>
			</div>
		{/each}
	{:else}
		<div class="{cell} hidden text-muted-foreground md:flex">Wskaż punkt na mapie</div>
	{/if}

	<div class="{cell} hidden md:flex">
		<button
			class="text-primary underline decoration-primary/50 decoration-dotted underline-offset-3"
			title="{appState.coordinateSystem.description}. Kliknij, aby zmienić układ."
			onclick={() => geoportal.switchToNextCoordinateSystem()}
		>
			{appState.coordinateSystem.name}
		</button>
	</div>

	{#if appState.scaleBar}
		<div class="{cell} hidden md:flex" aria-label="Skala {appState.scaleBar.label}">
			<span
				class="h-1.5 border border-t-0 border-foreground"
				style:width="{appState.scaleBar.widthPixels}px"
			></span>
			<span>{appState.scaleBar.label}</span>
		</div>
	{/if}

	<div
		class="{cell} hidden flex-1 justify-end md:flex {appState.hasError
			? 'text-destructive'
			: 'text-muted-foreground'}"
		role="status"
		aria-live="polite"
		data-testid="status-bar"
	>
		{appState.statusText}
		<span class="opacity-70">· Świat gry © Piranha Bytes, THQ Nordic · projekt fanowski</span>
	</div>
</footer>
