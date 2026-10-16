<script lang="ts">
	import XIcon from '@lucide/svelte/icons/x';
	import { MediaQuery } from 'svelte/reactivity';
	import { appState, geoportal, mobileSheet } from '#lib/composition-root.js';
	import {
		SHEET_DETENT_LABELS,
		SHEET_DETENTS,
		SheetHeightResolver,
		findSheetDetentIndex
	} from '#lib/state/sheet-detents.js';
	import AnalysisPanel from '#lib/components/panels/AnalysisPanel.svelte';
	import BookmarksPanel from '#lib/components/panels/BookmarksPanel.svelte';
	import LayersPanel from '#lib/components/panels/LayersPanel.svelte';
	import MeasurePanel from '#lib/components/panels/MeasurePanel.svelte';
	import SearchPanel from '#lib/components/panels/SearchPanel.svelte';
	import TimePanel from '#lib/components/panels/TimePanel.svelte';
	import { TOOL_DEFINITIONS } from './tool-definitions.js';

	const COLLAPSED_SHEET_PIXELS = 28;
	const BOTTOM_NAVIGATION_PIXELS = 60;
	const TOP_BAR_CLEARANCE_PIXELS = 56;
	const TAP_TOLERANCE_PIXELS = 6;
	const VELOCITY_WINDOW_MILLISECONDS = 120;

	interface DragSample {
		clientY: number;
		timeStamp: number;
	}

	interface DragStart {
		pointerId: number;
		clientY: number;
		heightPixels: number;
	}

	const isPhone = new MediaQuery('max-width: 767px');
	const activeTool = $derived(TOOL_DEFINITIONS.find((tool) => tool.id === appState.activeToolId));

	let viewportHeight = $state(window.innerHeight);
	let dragStart: DragStart | null = null;
	let dragSamples: DragSample[] = [];
	let draggedHeightPixels = $state<number | null>(null);

	const heightResolver = $derived(
		new SheetHeightResolver({
			collapsedPixels: COLLAPSED_SHEET_PIXELS,
			halfPixels: Math.round(viewportHeight / 2),
			fullPixels: viewportHeight - BOTTOM_NAVIGATION_PIXELS - TOP_BAR_CLEARANCE_PIXELS
		})
	);
	const sheetHeightPixels = $derived(
		draggedHeightPixels ?? heightResolver.findHeightOfDetent(mobileSheet.detent)
	);
	const isSheetCollapsed = $derived(isPhone.current && mobileSheet.detent === 'collapsed');

	function startDraggingSheet(event: PointerEvent): void {
		if (event.pointerType === 'mouse' && event.button !== 0) return;
		if (event.currentTarget instanceof HTMLElement) {
			event.currentTarget.setPointerCapture(event.pointerId);
		}
		dragStart = {
			pointerId: event.pointerId,
			clientY: event.clientY,
			heightPixels: sheetHeightPixels
		};
		dragSamples = [{ clientY: event.clientY, timeStamp: event.timeStamp }];
	}

	function dragSheet(event: PointerEvent): void {
		if (!dragStart || event.pointerId !== dragStart.pointerId) return;
		const movedPixels = dragStart.clientY - event.clientY;
		if (draggedHeightPixels === null && Math.abs(movedPixels) <= TAP_TOLERANCE_PIXELS) return;
		mobileSheet.isDragging = true;
		draggedHeightPixels = heightResolver.clampHeight(dragStart.heightPixels + movedPixels);
		dragSamples.push({ clientY: event.clientY, timeStamp: event.timeStamp });
		dragSamples = dragSamples.filter(
			(sample) => event.timeStamp - sample.timeStamp <= VELOCITY_WINDOW_MILLISECONDS
		);
	}

	function measureUpwardVelocity(): number {
		const oldest = dragSamples.at(0);
		const newest = dragSamples.at(-1);
		if (!oldest || !newest || newest.timeStamp === oldest.timeStamp) return 0;
		return (oldest.clientY - newest.clientY) / (newest.timeStamp - oldest.timeStamp);
	}

	function finishDraggingSheet(event: PointerEvent): void {
		if (!dragStart || event.pointerId !== dragStart.pointerId) return;
		if (draggedHeightPixels === null) mobileSheet.moveToNextDetent();
		else {
			mobileSheet.setDetent(
				heightResolver.findDetentAfterRelease(draggedHeightPixels, measureUpwardVelocity())
			);
		}
		dragStart = null;
		dragSamples = [];
		draggedHeightPixels = null;
		mobileSheet.isDragging = false;
	}

	function resizeSheetWithKeyboard(event: KeyboardEvent): void {
		if (event.key === 'ArrowUp') mobileSheet.moveToHigherDetent();
		else if (event.key === 'ArrowDown') mobileSheet.moveToLowerDetent();
		else if (event.key === 'Home') mobileSheet.setDetent('collapsed');
		else if (event.key === 'End') mobileSheet.setDetent('full');
		else if (event.key === 'Enter' || event.key === ' ') mobileSheet.moveToNextDetent();
		else return;
		event.preventDefault();
	}

	function closePanelOnEscape(event: KeyboardEvent): void {
		if (event.key === 'Escape' && activeTool) geoportal.closeActiveTool();
	}
</script>

<svelte:window onkeydown={closePanelOnEscape} bind:innerHeight={viewportHeight} />

{#if activeTool}
	<section
		class="panel-stone fixed inset-x-0 bottom-15 z-20 flex h-[var(--sheet-height)] flex-col overflow-hidden rounded-t-xl transition-[height] duration-200 ease-out motion-reduce:transition-none md:top-[calc(3.25rem+10px)] md:right-auto md:bottom-[calc(2.25rem+10px)] md:left-[calc(4rem+10px)] md:h-auto md:w-92 md:rounded-sm md:transition-none {mobileSheet.isDragging
			? 'transition-none'
			: ''}"
		style:--sheet-height="{sheetHeightPixels}px"
		aria-label={activeTool.panelTitle}
		data-map-obstacle
	>
		<div
			class="flex h-7 shrink-0 cursor-grab touch-none items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary md:hidden"
			role="slider"
			tabindex="0"
			aria-orientation="vertical"
			aria-label="Wysokość panelu: {activeTool.panelTitle}"
			aria-valuemin={0}
			aria-valuemax={SHEET_DETENTS.length - 1}
			aria-valuenow={findSheetDetentIndex(mobileSheet.detent)}
			aria-valuetext={SHEET_DETENT_LABELS[mobileSheet.detent]}
			onpointerdown={startDraggingSheet}
			onpointermove={dragSheet}
			onpointerup={finishDraggingSheet}
			onpointercancel={finishDraggingSheet}
			onkeydown={resizeSheetWithKeyboard}
		>
			<div class="h-1 w-10 rounded-full bg-[var(--forged-edge)]"></div>
		</div>
		<div class="flex min-h-0 flex-1 flex-col" inert={isSheetCollapsed}>
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
				{:else if activeTool.id === 'analysis'}
					<AnalysisPanel />
				{:else if activeTool.id === 'bookmarks'}
					<BookmarksPanel />
				{:else}
					<TimePanel />
				{/if}
			</div>
		</div>
	</section>
{/if}
