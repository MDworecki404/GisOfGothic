<script lang="ts">
	import XIcon from '@lucide/svelte/icons/x';
	import AppShell from '../components/AppShell.svelte';
	import EntryDetail from '../components/EntryDetail.svelte';
	import LayersPanel from '../components/LayersPanel.svelte';
	import MapStage from '../components/MapStage.svelte';
	import MeasurePanel from '../components/MeasurePanel.svelte';
	import PanelFrame from '../components/PanelFrame.svelte';
	import SavedPanel from '../components/SavedPanel.svelte';
	import Sheet from '../components/Sheet.svelte';
	import TimePanel from '../components/TimePanel.svelte';
	import { mockupState, type ToolId } from '../state/mockup-state.svelte.js';

	const TOOL_TITLES: Record<ToolId, { title: string; subtitle: string }> = {
		layers: { title: 'Warstwy', subtitle: 'Wybierz, co widać na mapie' },
		time: { title: 'Czas i rozdział', subtitle: 'Ustaw porę dnia i etap fabuły' },
		measure: { title: 'Pomiary', subtitle: 'Odległość, marsz i wysokość' },
		saved: { title: 'Zakładki i notatnik', subtitle: 'Twoje zapisane miejsca' }
	};

	const TOOL_PANEL_WIDTH = 332;
	const DETAIL_OVERLAY_WIDTH = 392;

	let viewportHeight = $state(800);

	const isMobile = $derived(mockupState.device === 'mobile');
	const isTablet = $derived(mockupState.device === 'tablet');
	const isDesktop = $derived(mockupState.device === 'desktop');
	const selectedEntry = $derived(mockupState.selectedEntry);

	const leftInset = $derived(
		!isMobile && mockupState.tool && !(isTablet && selectedEntry) ? TOOL_PANEL_WIDTH + 24 : 0
	);
	const rightInset = $derived(isTablet && selectedEntry ? DETAIL_OVERLAY_WIDTH : 0);
	const bottomInset = $derived.by(() => {
		if (!isMobile || !(selectedEntry || mockupState.tool)) {
			return 0;
		}
		const detentHeights = { peek: 84, half: viewportHeight * 0.46, full: 0 };
		return detentHeights[mockupState.sheetDetent];
	});

	function closeTool(): void {
		mockupState.tool = null;
	}
</script>

<svelte:window bind:innerHeight={viewportHeight} />

<AppShell>
	<div class="atlas">
		<div class="map-area">
			<MapStage {leftInset} {rightInset} {bottomInset} />

			{#if !isMobile && mockupState.tool}
				<div class="tool-panel" style:width={`${TOOL_PANEL_WIDTH}px`}>
					<PanelFrame
						title={TOOL_TITLES[mockupState.tool].title}
						subtitle={TOOL_TITLES[mockupState.tool].subtitle}
						onclose={closeTool}
					>
						{#if mockupState.tool === 'layers'}
							<LayersPanel />
						{:else if mockupState.tool === 'time'}
							<TimePanel />
						{:else if mockupState.tool === 'measure'}
							<MeasurePanel />
						{:else}
							<SavedPanel />
						{/if}
					</PanelFrame>
				</div>
			{/if}

			{#if isTablet && selectedEntry}
				<aside
					class="detail-overlay cartouche"
					aria-label={`Szczegóły: ${selectedEntry.name}`}
					style:width={`${DETAIL_OVERLAY_WIDTH - 24}px`}
				>
					<button
						type="button"
						class="btn icon ghost close"
						aria-label="Zamknij szczegóły"
						onclick={() => mockupState.select(null)}
					>
						<XIcon size={18} />
					</button>
					<div class="detail-scroll scroll">
						{#key selectedEntry.id}<EntryDetail entry={selectedEntry} />{/key}
					</div>
				</aside>
			{/if}
		</div>

		{#if isDesktop && selectedEntry}
			<aside class="detail" aria-label={`Szczegóły: ${selectedEntry.name}`}>
				<button
					type="button"
					class="btn icon close"
					aria-label="Zamknij szczegóły"
					onclick={() => mockupState.select(null)}
				>
					<XIcon size={18} />
				</button>
				<div class="detail-scroll scroll">
					{#key selectedEntry.id}<EntryDetail entry={selectedEntry} />{/key}
				</div>
			</aside>
		{/if}

		{#if isMobile}
			{#if selectedEntry}
				<Sheet title={selectedEntry.name} onclose={() => mockupState.select(null)}>
					{#key selectedEntry.id}<EntryDetail entry={selectedEntry} />{/key}
				</Sheet>
			{:else if mockupState.tool}
				<Sheet title={TOOL_TITLES[mockupState.tool].title} onclose={closeTool}>
					{#if mockupState.tool === 'layers'}
						<LayersPanel />
					{:else if mockupState.tool === 'time'}
						<TimePanel />
					{:else if mockupState.tool === 'measure'}
						<MeasurePanel />
					{:else}
						<SavedPanel />
					{/if}
				</Sheet>
			{/if}
		{/if}
	</div>
</AppShell>

<style>
	.atlas {
		display: flex;
		height: 100%;
	}

	.map-area {
		position: relative;
		flex: 1;
		min-width: 0;
	}

	.tool-panel {
		position: absolute;
		left: 34px;
		top: 34px;
		bottom: 12px;
		display: flex;
		flex-direction: column;
		max-width: calc(100% - 60px);
		pointer-events: none;
	}

	.tool-panel :global(.frame) {
		pointer-events: auto;
	}

	.detail {
		position: relative;
		flex: none;
		width: var(--panel-szczegolow);
		background: var(--kamien-1);
		border-left: 1px solid var(--mosiadz-ciemny);
		animation: slide-in var(--czas-sredni) var(--ruch);
	}

	.detail-overlay {
		position: absolute;
		right: 12px;
		top: 34px;
		bottom: 12px;
		z-index: 25;
		animation: slide-in var(--czas-sredni) var(--ruch);
	}

	@keyframes slide-in {
		from {
			opacity: 0;
			translate: 16px 0;
		}
	}

	.detail-scroll {
		height: 100%;
		padding: var(--s-4);
	}

	.close {
		position: absolute;
		right: 8px;
		top: 8px;
		z-index: 2;
		background: rgb(18 20 22 / 0.7);
	}
</style>
