<script lang="ts">
	import { appState, geoportal } from '#lib/composition-root.js';

	const cell = 'instrument-cell flex items-center gap-2 px-3.5 whitespace-nowrap';
	const readingWidths = ['md:w-32', 'md:w-32', 'md:w-40'];
	const statusText = $derived(appState.statusText);
</script>

<footer
	class="instrument-bar fixed top-[calc(var(--top-bar-height)+var(--gutter))] left-(--gutter) z-20 h-8 items-stretch rounded-sm text-caption tabular-nums md:inset-x-0 md:top-auto md:bottom-0 md:h-(--status-bar-height) md:rounded-none {appState.cursorReadings
		? 'flex'
		: 'hidden md:flex'}"
	aria-label="Pozycja kursora, skala i stan"
>
	<div class="{cell} hidden px-0 md:flex">
		<button
			class="h-full px-3.5 text-primary underline decoration-primary/50 decoration-dotted underline-offset-3 hover:bg-hover-surface hover:text-hover"
			title="{appState.coordinateSystem.description}. Kliknij, aby zmienić układ."
			onclick={() => geoportal.switchToNextCoordinateSystem()}
		>
			{appState.coordinateSystem.name}
		</button>
	</div>

	<div class="{cell} hidden pr-0 md:flex">
		<span class="text-muted-foreground">Godzina</span>
		<button
			class="h-full px-2 hover:bg-hover-surface hover:text-hover"
			title="Zmień porę dnia"
			onclick={() => geoportal.selectTool('time')}
		>
			{appState.timeOfDayLabel}
		</button>
	</div>

	<div
		class="{cell} hidden min-w-0 flex-1 md:flex {appState.hasError
			? 'text-destructive'
			: 'text-muted-foreground'}"
		role="status"
		aria-live="polite"
		title={statusText}
		data-testid="status-bar"
	>
		<span class="truncate">{statusText}</span>
	</div>

	<div class="{cell} hidden md:flex md:w-44" aria-label="Skala {appState.scaleBar?.label ?? ''}">
		{#if appState.scaleBar}
			<span class="scale-ruler" style:width="{appState.scaleBar.widthPixels}px"></span>
			<span>{appState.scaleBar.label}</span>
		{/if}
	</div>

	{#if appState.cameraProjection.kind === 'orthographic'}
		<div class="{cell} hidden text-muted-foreground md:flex">rzut ortogonalny</div>
	{/if}

	{#if appState.cursorReadings}
		{#each appState.cursorReadings as reading, index (reading.axis)}
			<div class="{cell} {readingWidths[index]} {index === 2 ? 'hidden md:flex' : ''}">
				<span class="text-muted-foreground">{reading.axis}</span>
				<span>{reading.value}</span>
			</div>
		{/each}
	{:else}
		<div class="{cell} hidden text-muted-foreground md:flex md:w-104">Wskaż punkt na mapie</div>
	{/if}
</footer>
