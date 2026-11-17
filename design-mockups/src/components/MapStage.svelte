<script lang="ts">
	import CopyIcon from '@lucide/svelte/icons/link-2';
	import FitIcon from '@lucide/svelte/icons/locate-fixed';
	import FullscreenIcon from '@lucide/svelte/icons/maximize';
	import MinusIcon from '@lucide/svelte/icons/minus';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import { untrack } from 'svelte';
	import { SvelteMap } from 'svelte/reactivity';
	import {
		METERS_PER_WORLD_UNIT,
		WORLD_HEIGHT,
		WORLD_WIDTH,
		findEntry,
		findLocation,
		findQuest
	} from '../data/world.js';
	import { mockupState } from '../state/mockup-state.svelte.js';
	import MapTerrain from './MapTerrain.svelte';
	import Pin from './Pin.svelte';

	interface Props {
		rightInset?: number;
		bottomInset?: number;
		leftInset?: number;
	}

	let { rightInset = 0, bottomInset = 0, leftInset = 0 }: Props = $props();

	const MIN_SCALE = 0.5;
	const MAX_SCALE = 5;
	const RULER_SIZE = 22;
	const CROWDED_CATEGORIES_MIN_SCALE = 1.5;
	const NICE_STEPS = [5, 10, 20, 50, 100, 200, 500];

	let container = $state<HTMLDivElement | null>(null);
	let width = $state(1000);
	let height = $state(640);
	let scale = $state(1);
	let translateX = $state(0);
	let translateY = $state(0);
	let animating = $state(false);
	let hoverWorld = $state<{ x: number; y: number } | null>(null);
	let hasFitted = false;

	const activePointers = new SvelteMap<number, { x: number; y: number }>();
	let dragDistance = 0;
	let lastPinchDistance = 0;

	function clampScale(value: number): number {
		return Math.min(MAX_SCALE, Math.max(MIN_SCALE, value));
	}

	function fitWorld(animate = true): void {
		const usableWidth = width - leftInset - rightInset - RULER_SIZE - 24;
		const usableHeight = height - bottomInset - RULER_SIZE - 24;
		const fitted = clampScale(Math.min(usableWidth / WORLD_WIDTH, usableHeight / WORLD_HEIGHT));
		animating = animate;
		scale = fitted;
		translateX = leftInset + RULER_SIZE + (usableWidth - WORLD_WIDTH * fitted) / 2 + 12;
		translateY = RULER_SIZE + (usableHeight - WORLD_HEIGHT * fitted) / 2 + 12;
	}

	function zoomAround(factor: number, anchorX: number, anchorY: number, animate = false): void {
		const nextScale = clampScale(scale * factor);
		const ratio = nextScale / scale;
		animating = animate;
		translateX = anchorX - (anchorX - translateX) * ratio;
		translateY = anchorY - (anchorY - translateY) * ratio;
		scale = nextScale;
	}

	function zoomAtCenter(factor: number): void {
		zoomAround(
			factor,
			leftInset + (width - leftInset - rightInset) / 2,
			(height - bottomInset) / 2,
			true
		);
	}

	function centerOnWorldPoint(x: number, y: number, targetScale: number): void {
		const visibleCenterX = leftInset + (width - leftInset - rightInset) / 2;
		const visibleCenterY = (height - bottomInset) / 2 + RULER_SIZE / 2;
		const nextScale = clampScale(targetScale);
		animating = true;
		scale = nextScale;
		translateX = visibleCenterX - x * nextScale;
		translateY = visibleCenterY - y * nextScale;
	}

	function toWorld(clientX: number, clientY: number): { x: number; y: number } | null {
		if (!container) {
			return null;
		}
		const rect = container.getBoundingClientRect();
		return {
			x: (clientX - rect.left - translateX) / scale,
			y: (clientY - rect.top - translateY) / scale
		};
	}

	function handlePointerDown(event: PointerEvent): void {
		if (!container) {
			return;
		}
		container.setPointerCapture(event.pointerId);
		activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
		dragDistance = 0;
		animating = false;
		if (activePointers.size === 2) {
			const [first, second] = [...activePointers.values()];
			lastPinchDistance = Math.hypot(first.x - second.x, first.y - second.y);
		}
	}

	function handlePointerMove(event: PointerEvent): void {
		const world = toWorld(event.clientX, event.clientY);
		if (world && event.pointerType === 'mouse') {
			hoverWorld = world;
		}
		const previous = activePointers.get(event.pointerId);
		if (!previous || !container) {
			return;
		}
		activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
		if (activePointers.size === 2) {
			const [first, second] = [...activePointers.values()];
			const distance = Math.hypot(first.x - second.x, first.y - second.y);
			const rect = container.getBoundingClientRect();
			if (lastPinchDistance > 0) {
				zoomAround(
					distance / lastPinchDistance,
					(first.x + second.x) / 2 - rect.left,
					(first.y + second.y) / 2 - rect.top
				);
			}
			lastPinchDistance = distance;
			dragDistance += 10;
			return;
		}
		const deltaX = event.clientX - previous.x;
		const deltaY = event.clientY - previous.y;
		dragDistance += Math.abs(deltaX) + Math.abs(deltaY);
		translateX += deltaX;
		translateY += deltaY;
	}

	function handlePointerUp(event: PointerEvent): void {
		activePointers.delete(event.pointerId);
		lastPinchDistance = 0;
		if (dragDistance < 6 && activePointers.size === 0) {
			const world = toWorld(event.clientX, event.clientY);
			if (world && mockupState.tool === 'measure') {
				mockupState.measurePoints = [...mockupState.measurePoints, world];
			} else if (mockupState.selectedId) {
				mockupState.select(null);
			}
		}
	}

	function handleKeyDown(event: KeyboardEvent): void {
		const step = 60;
		const keyActions: Record<string, () => void> = {
			ArrowLeft: () => (translateX += step),
			ArrowRight: () => (translateX -= step),
			ArrowUp: () => (translateY += step),
			ArrowDown: () => (translateY -= step),
			'+': () => zoomAtCenter(1.4),
			'=': () => zoomAtCenter(1.4),
			'-': () => zoomAtCenter(1 / 1.4),
			'0': () => fitWorld()
		};
		const action = keyActions[event.key];
		if (action && event.target === container) {
			event.preventDefault();
			animating = true;
			action();
		}
	}

	function copyViewLink(): void {
		void navigator.clipboard?.writeText(window.location.href);
		mockupState.showToast('Skopiowano link do widoku');
	}

	function toggleFullscreen(): void {
		if (document.fullscreenElement) {
			void document.exitFullscreen();
		} else {
			void document.documentElement.requestFullscreen();
		}
	}

	$effect(() => {
		const element = container;
		if (!element) {
			return;
		}
		const handleWheel = (event: WheelEvent): void => {
			event.preventDefault();
			const rect = element.getBoundingClientRect();
			zoomAround(
				Math.exp(-event.deltaY * 0.0015),
				event.clientX - rect.left,
				event.clientY - rect.top
			);
		};
		element.addEventListener('wheel', handleWheel, { passive: false });
		return () => element.removeEventListener('wheel', handleWheel);
	});

	$effect(() => {
		if (width > 0 && height > 0 && !hasFitted) {
			hasFitted = true;
			untrack(() => fitWorld(false));
		}
	});

	$effect(() => {
		void leftInset;
		void rightInset;
		void bottomInset;
		if (hasFitted && !untrack(() => mockupState.selectedId)) {
			untrack(() => fitWorld(true));
		}
	});

	$effect(() => {
		const entry = mockupState.selectedEntry;
		void leftInset;
		void rightInset;
		void bottomInset;
		if (!entry) {
			return;
		}
		const target =
			entry.category === 'location' || entry.category === 'quest'
				? entry
				: (findLocation(entry.locationId) ?? entry);
		untrack(() => centerOnWorldPoint(target.x, target.y, Math.max(scale, 1.7)));
	});

	const visibleTicksX = $derived(buildTicks('x'));
	const visibleTicksY = $derived(buildTicks('y'));

	function buildTicks(axis: 'x' | 'y'): { position: number; label: string; major: boolean }[] {
		const step = NICE_STEPS.find((candidate) => candidate * scale >= 70) ?? 500;
		const origin = axis === 'x' ? translateX : translateY;
		const extent = axis === 'x' ? width : height;
		const worldStart = Math.floor(-origin / scale / step) * step;
		const worldEnd = (extent - origin) / scale;
		const ticks: { position: number; label: string; major: boolean }[] = [];
		for (
			let value = Math.max(0, worldStart);
			value <= Math.min(worldEnd, axis === 'x' ? WORLD_WIDTH : WORLD_HEIGHT);
			value += step
		) {
			const meters = value * METERS_PER_WORLD_UNIT;
			ticks.push({
				position: value * scale + origin,
				label:
					meters >= 1000
						? `${(meters / 1000).toLocaleString('pl-PL', { maximumFractionDigits: 1 })} km`
						: `${meters} m`,
				major: true
			});
		}
		return ticks.filter((tick) => tick.position > RULER_SIZE - 4);
	}

	const scaleBar = $derived.by(() => {
		const units = NICE_STEPS.find((candidate) => candidate * scale >= 90) ?? 500;
		const meters = units * METERS_PER_WORLD_UNIT;
		return {
			widthPx: units * scale,
			label: meters >= 1000 ? `${(meters / 1000).toLocaleString('pl-PL')} km` : `${meters} m`
		};
	});

	const showCrowdedCategories = $derived(scale >= CROWDED_CATEGORIES_MIN_SCALE);

	const pinsToRender = $derived(
		mockupState.visibleEntries.filter(
			(entry) =>
				entry.category === 'location' ||
				showCrowdedCategories ||
				entry.id === mockupState.selectedId
		)
	);

	const routePoints = $derived.by(() => {
		const entry = mockupState.selectedEntry;
		if (!entry || entry.category !== 'quest') {
			return [];
		}
		return (
			findQuest(entry.id)?.steps.flatMap((step) => {
				const location = findLocation(step.locationId);
				return location ? [{ x: location.x, y: location.y }] : [];
			}) ?? []
		);
	});

	const measureMeters = $derived.by(() => {
		let total = 0;
		const points = mockupState.measurePoints;
		for (let index = 1; index < points.length; index += 1) {
			total += Math.hypot(
				points[index].x - points[index - 1].x,
				points[index].y - points[index - 1].y
			);
		}
		return total * METERS_PER_WORLD_UNIT;
	});

	const selectedAnchor = $derived.by(() => {
		const entry = mockupState.selectedEntry;
		return entry ? { x: entry.x, y: entry.y } : null;
	});

	function shouldShowLabel(entryId: string, labelTier: number): boolean {
		const isLocation = findEntry(entryId)?.category === 'location';
		return labelTier === 1 || scale >= 2.8 || (isLocation && scale >= 1.9);
	}
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
<div
	class="stage"
	class:animating
	bind:this={container}
	bind:clientWidth={width}
	bind:clientHeight={height}
	role="application"
	aria-label="Mapa Khorinis. Strzałki przesuwają widok, plus i minus zmieniają przybliżenie, zero wraca do całości."
	tabindex="0"
	onpointerdown={handlePointerDown}
	onpointermove={handlePointerMove}
	onpointerup={handlePointerUp}
	onpointercancel={handlePointerUp}
	onpointerleave={() => (hoverWorld = null)}
	onkeydown={handleKeyDown}
	ontransitionend={() => (animating = false)}
>
	<div
		class="world"
		style:transform={`translate(${translateX}px, ${translateY}px) scale(${scale})`}
	>
		<MapTerrain layers={mockupState.baseLayers} hour={mockupState.hour} />
		<svg class="overlay" viewBox={`0 0 ${WORLD_WIDTH} ${WORLD_HEIGHT}`} aria-hidden="true">
			{#if routePoints.length > 1}
				<polyline
					points={routePoints.map((point) => `${point.x},${point.y}`).join(' ')}
					fill="none"
					stroke="var(--kat-quest)"
					stroke-width={3 / scale}
					stroke-dasharray={`${10 / scale} ${7 / scale}`}
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			{/if}
			{#if mockupState.measurePoints.length > 0}
				<polyline
					points={mockupState.measurePoints.map((point) => `${point.x},${point.y}`).join(' ')}
					fill="none"
					stroke="var(--tekst)"
					stroke-width={2.4 / scale}
					stroke-linejoin="round"
				/>
				{#each mockupState.measurePoints as point, index (index)}
					<circle
						cx={point.x}
						cy={point.y}
						r={5 / scale}
						fill="var(--grafit)"
						stroke="var(--tekst)"
						stroke-width={2 / scale}
					/>
				{/each}
			{/if}
			{#if selectedAnchor}
				<circle
					class="ping"
					cx={selectedAnchor.x}
					cy={selectedAnchor.y}
					r={26 / scale}
					fill="none"
					stroke="var(--mosiadz-jasny)"
					stroke-width={2 / scale}
				/>
			{/if}
		</svg>
		{#each pinsToRender as entry (entry.id)}
			<div
				class="pin-slot"
				style:left={`${entry.x}px`}
				style:top={`${entry.y}px`}
				style:--inverse={1 / scale}
			>
				<Pin
					{entry}
					selected={entry.id === mockupState.selectedId}
					showLabel={shouldShowLabel(entry.id, entry.labelTier)}
					onselect={(entryId) => mockupState.select(entryId)}
				/>
			</div>
		{/each}
	</div>

	<div class="ruler ruler-x" aria-hidden="true" style:left={`${RULER_SIZE}px`}>
		{#each visibleTicksX as tick (tick.position)}
			<span class="tick" style:left={`${tick.position - RULER_SIZE}px`}>{tick.label}</span>
		{/each}
	</div>
	<div class="ruler ruler-y" aria-hidden="true" style:top={`${RULER_SIZE}px`}>
		{#each visibleTicksY as tick (tick.position)}
			<span class="tick" style:top={`${tick.position - RULER_SIZE}px`}
				><span>{tick.label}</span></span
			>
		{/each}
	</div>
	<div class="ruler-corner" aria-hidden="true"></div>
	<div class="neatline" aria-hidden="true"></div>

	<div
		class="readout"
		style:bottom={`${bottomInset + 12}px`}
		style:left={`${leftInset + RULER_SIZE + 12}px`}
	>
		<div class="scale" aria-label={`Podziałka: ${scaleBar.label}`}>
			<span class="bar" style:width={`${scaleBar.widthPx}px`}></span>
			<span>{scaleBar.label}</span>
		</div>
		{#if hoverWorld}
			<span class="coords tabular">X {Math.round(hoverWorld.x)} · Z {Math.round(hoverWorld.y)}</span
			>
		{/if}
		{#if mockupState.tool === 'measure' && mockupState.measurePoints.length > 1}
			<span class="coords tabular"
				>Odcinek: {(measureMeters / 1000).toLocaleString('pl-PL', { maximumFractionDigits: 2 })} km</span
			>
		{/if}
		{#if !showCrowdedCategories}
			<span class="hint">Przybliż mapę, aby zobaczyć postacie, przedmioty i potwory.</span>
		{/if}
	</div>

	<div class="controls" style:bottom={`${bottomInset + 12}px`} style:right={`${rightInset + 12}px`}>
		<div class="group" role="group" aria-label="Przybliżenie">
			<button type="button" class="btn icon" aria-label="Przybliż" onclick={() => zoomAtCenter(1.4)}
				><PlusIcon size={18} /></button
			>
			<button
				type="button"
				class="btn icon"
				aria-label="Oddal"
				onclick={() => zoomAtCenter(1 / 1.4)}><MinusIcon size={18} /></button
			>
		</div>
		<div class="group" role="group" aria-label="Widok">
			<button
				type="button"
				class="btn icon"
				aria-label="Pokaż całą wyspę"
				onclick={() => fitWorld()}><FitIcon size={18} /></button
			>
			<button type="button" class="btn icon" aria-label="Pełny ekran" onclick={toggleFullscreen}
				><FullscreenIcon size={18} /></button
			>
			<button
				type="button"
				class="btn icon"
				aria-label="Kopiuj link do widoku"
				onclick={copyViewLink}><CopyIcon size={18} /></button
			>
		</div>
	</div>
	<svg
		class="rose"
		width="64"
		height="64"
		viewBox="-32 -32 64 64"
		aria-hidden="true"
		style:right={`${rightInset + 14}px`}
	>
		<circle r="22" fill="none" stroke="var(--mosiadz-ciemny)" stroke-width="1" />
		<path
			d="M0 -28 L5 0 L0 28 L-5 0 Z"
			fill="var(--kamien-2)"
			stroke="var(--mosiadz)"
			stroke-width="1"
		/>
		<path
			d="M-28 0 L0 -4 L28 0 L0 4 Z"
			fill="none"
			stroke="var(--mosiadz-ciemny)"
			stroke-width="1"
		/>
		<path d="M0 -28 L5 0 L-5 0 Z" fill="var(--mosiadz)" />
		<text
			y="-33"
			text-anchor="middle"
			font-size="10"
			font-family="var(--font-ui)"
			font-weight="600"
			fill="var(--mosiadz-jasny)">N</text
		>
	</svg>
</div>

<style>
	.stage {
		position: absolute;
		inset: 0;
		overflow: hidden;
		background: var(--morze);
		cursor: grab;
		touch-action: none;
		user-select: none;
	}

	.stage:active {
		cursor: grabbing;
	}

	.world {
		position: absolute;
		left: 0;
		top: 0;
		width: 1000px;
		height: 640px;
		transform-origin: 0 0;
		will-change: transform;
	}

	.animating .world {
		transition: transform 520ms var(--ruch);
	}

	.overlay {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
	}

	.pin-slot {
		position: absolute;
		width: 0;
		height: 0;
		scale: var(--inverse);
		transform-origin: 0 0;
	}

	.pin-slot :global(.pin) {
		translate: -14px -14px;
	}

	.ping {
		transform-box: fill-box;
		transform-origin: center;
		animation: ping 1.6s var(--ruch) 2;
	}

	@keyframes ping {
		from {
			scale: 0.4;
			opacity: 1;
		}
		to {
			scale: 1.4;
			opacity: 0;
		}
	}

	.ruler {
		position: absolute;
		background: rgb(18 20 22 / 0.92);
		color: var(--tekst-2);
		font-size: 0.6875rem;
		pointer-events: none;
		overflow: hidden;
	}

	.ruler-x {
		top: 0;
		right: 0;
		height: 22px;
		border-bottom: 1px solid var(--mosiadz-ciemny);
	}

	.ruler-y {
		left: 0;
		bottom: 0;
		width: 22px;
		border-right: 1px solid var(--mosiadz-ciemny);
	}

	.tick {
		position: absolute;
		white-space: nowrap;
		padding-left: 4px;
		border-left: 1px solid var(--mosiadz);
		height: 100%;
		line-height: 22px;
	}

	.ruler-y .tick {
		width: 100%;
		height: auto;
		padding: 0;
		border-left: 0;
		border-top: 1px solid var(--mosiadz);
		line-height: 1;
	}

	.ruler-y .tick span {
		position: absolute;
		top: 4px;
		left: 50%;
		writing-mode: vertical-rl;
		rotate: 180deg;
		translate: -50% 0;
	}

	.ruler-corner {
		position: absolute;
		top: 0;
		left: 0;
		width: 22px;
		height: 22px;
		background: var(--grafit);
		border-right: 1px solid var(--mosiadz-ciemny);
		border-bottom: 1px solid var(--mosiadz-ciemny);
		pointer-events: none;
	}

	.neatline {
		position: absolute;
		inset: 0;
		box-shadow: inset 0 0 120px rgb(0 0 0 / 0.45);
		pointer-events: none;
	}

	.readout {
		position: absolute;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 6px 12px;
		max-width: calc(100% - 200px);
		pointer-events: none;
		font-size: var(--tx-xs);
		color: var(--tekst);
	}

	.readout > * {
		padding: 4px 8px;
		border-radius: var(--r-ostry);
		background: rgb(18 20 22 / 0.82);
	}

	.scale {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.bar {
		display: block;
		height: 6px;
		border: 1.5px solid var(--tekst);
		border-top: 0;
	}

	.hint {
		color: var(--tekst-2);
	}

	.controls {
		position: absolute;
		display: flex;
		flex-direction: column;
		gap: 8px;
		transition: right var(--czas-sredni) var(--ruch);
	}

	.group {
		display: flex;
		flex-direction: column;
		border: 1px solid var(--linia);
		border-radius: var(--r-panel);
		background: var(--kamien-1);
		box-shadow: var(--cien-panelu);
		overflow: hidden;
	}

	.group .btn {
		border: 0;
		border-radius: 0;
		background: transparent;
	}

	.group .btn + .btn {
		border-top: 1px solid var(--linia);
	}

	.group .btn:hover {
		background: var(--kamien-3);
	}

	.rose {
		position: absolute;
		top: 34px;
		opacity: 0.9;
		pointer-events: none;
	}

	@media (max-width: 47.99rem) {
		.rose {
			display: none;
		}

		.readout {
			max-width: calc(100% - 80px);
		}
	}
</style>
