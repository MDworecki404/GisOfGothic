<script lang="ts">
	import XIcon from '@lucide/svelte/icons/x';
	import { appState, geoportal } from '#lib/composition-root.js';

	const KEYBOARD_STEP = 0.02;

	const comparison = $derived(appState.worldComparison);
	let isDragging = $state(false);

	function moveSplitToPointer(event: PointerEvent): void {
		geoportal.setWorldComparisonSplit(event.clientX / window.innerWidth);
	}

	function startDragging(event: PointerEvent): void {
		if (event.pointerType === 'mouse' && event.button !== 0) return;
		if (event.currentTarget instanceof HTMLElement) {
			event.currentTarget.setPointerCapture(event.pointerId);
		}
		isDragging = true;
		moveSplitToPointer(event);
	}

	function drag(event: PointerEvent): void {
		if (isDragging) moveSplitToPointer(event);
	}

	function stopDragging(): void {
		isDragging = false;
	}

	function moveSplitWithKeyboard(event: KeyboardEvent): void {
		if (event.key === 'ArrowLeft') {
			geoportal.setWorldComparisonSplit(comparison.splitFraction - KEYBOARD_STEP);
		} else if (event.key === 'ArrowRight') {
			geoportal.setWorldComparisonSplit(comparison.splitFraction + KEYBOARD_STEP);
		} else if (event.key === 'Home') geoportal.setWorldComparisonSplit(0);
		else if (event.key === 'End') geoportal.setWorldComparisonSplit(1);
		else return;
		event.preventDefault();
	}
</script>

{#if comparison.status !== 'inactive'}
	<div class="pointer-events-none fixed inset-0 z-[5]" data-world-comparison-overlay>
		<div
			class="material-leather pointer-events-auto absolute top-[calc(var(--top-bar-height)+var(--gutter))] left-1/2 flex max-w-[calc(100vw-9rem)] -translate-x-1/2 items-center gap-2 rounded-md py-1 pr-1 pl-3 text-sm md:max-w-none"
			role="status"
			data-map-obstacle
		>
			<span class="truncate">
				{comparison.primaryWorldName} ◂ ▸ {comparison.comparedWorldName}
				{#if comparison.status === 'loading'}
					<span class="text-caption text-muted-foreground">(wczytywanie…)</span>
				{/if}
			</span>
			<button
				class="grid size-9 shrink-0 place-items-center rounded-sm text-muted-foreground hover:bg-hover-surface hover:text-foreground"
				aria-label="Zakończ porównanie światów"
				onclick={() => geoportal.stopWorldComparison()}
			>
				<XIcon class="size-4" />
			</button>
		</div>

		{#if comparison.status === 'error'}
			<p
				class="material-leather pointer-events-auto absolute top-[calc(var(--top-bar-height)+4.5rem)] left-1/2 w-max max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-md px-3 py-2 text-sm text-destructive"
				role="alert"
			>
				Nie udało się wczytać świata „{comparison.comparedWorldName}”: {comparison.errorMessage}
			</p>
		{:else}
			<div
				class="pointer-events-auto absolute inset-y-0 w-11 -translate-x-1/2 cursor-col-resize touch-none focus-visible:outline-2 focus-visible:outline-ring"
				style:left="{comparison.splitFraction * 100}%"
				role="slider"
				tabindex="0"
				aria-orientation="horizontal"
				aria-label="Suwak porównania światów"
				aria-valuemin={0}
				aria-valuemax={100}
				aria-valuenow={Math.round(comparison.splitFraction * 100)}
				aria-valuetext="Po lewej {comparison.primaryWorldName}, po prawej {comparison.comparedWorldName}"
				onpointerdown={startDragging}
				onpointermove={drag}
				onpointerup={stopDragging}
				onpointercancel={stopDragging}
				onkeydown={moveSplitWithKeyboard}
				data-map-obstacle
			>
				<div class="mx-auto h-full w-0.5 bg-primary shadow-[0_0_6px_rgb(0_0_0/0.8)]"></div>
				<div
					class="material-leather absolute top-1/2 left-1/2 grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full text-primary"
					aria-hidden="true"
				>
					◂▸
				</div>
			</div>
		{/if}
	</div>
{/if}
