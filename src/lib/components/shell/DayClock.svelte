<script lang="ts">
	import PauseIcon from '@lucide/svelte/icons/pause';
	import PlayIcon from '@lucide/svelte/icons/play';
	import { appState, geoportal } from '#lib/composition-root.js';

	const MINUTES_IN_DAY = 24 * 60;
	const KEYBOARD_STEP_MINUTES = 30;
	const ARC_WIDTH = 240;
	const ARC_HEIGHT = 70;
	const ARC_CENTER_X = ARC_WIDTH / 2;
	const ARC_BASE_Y = 64;
	const ARC_RADIUS_X = 108;
	const ARC_RADIUS_Y = 56;
	const SPEEDS = [
		{ value: 'game', label: '1×' },
		{ value: 'fast', label: '4×' },
		{ value: 'very-fast', label: '60×' }
	] as const;

	const isExpanded = $derived(
		appState.activeToolId === 'time' || appState.routinePlayback.isPlaying
	);
	const dayFraction = $derived(appState.minuteOfDay / MINUTES_IN_DAY);
	const markerAngle = $derived(Math.PI * (1 - dayFraction));
	const markerX = $derived(ARC_CENTER_X + ARC_RADIUS_X * Math.cos(markerAngle));
	const markerY = $derived(ARC_BASE_Y - ARC_RADIUS_Y * Math.sin(markerAngle));
	const arcPath = `M ${ARC_CENTER_X - ARC_RADIUS_X} ${ARC_BASE_Y} A ${ARC_RADIUS_X} ${ARC_RADIUS_Y} 0 0 1 ${ARC_CENTER_X + ARC_RADIUS_X} ${ARC_BASE_Y}`;

	function togglePlayback(): void {
		if (appState.routinePlayback.isPlaying) geoportal.stopRoutinePlayback();
		else geoportal.startRoutinePlayback(appState.routinePlayback.speed);
	}

	function setTimeFromPointer(event: PointerEvent): void {
		const bounds =
			event.currentTarget instanceof Element ? event.currentTarget.getBoundingClientRect() : null;
		if (bounds === null) return;
		const relativeX = (event.clientX - bounds.left) / bounds.width;
		const fraction = Math.min(
			1,
			Math.max(0, (relativeX * ARC_WIDTH - (ARC_CENTER_X - ARC_RADIUS_X)) / (2 * ARC_RADIUS_X))
		);
		geoportal.setTimeOfDay(
			Math.min(MINUTES_IN_DAY - 5, Math.round((fraction * MINUTES_IN_DAY) / 5) * 5)
		);
	}

	function setTimeWhileDragging(event: PointerEvent): void {
		if (event.buttons === 1) setTimeFromPointer(event);
	}

	function setTimeFromKeyboard(event: KeyboardEvent): void {
		const direction =
			event.key === 'ArrowRight' || event.key === 'ArrowUp'
				? 1
				: event.key === 'ArrowLeft' || event.key === 'ArrowDown'
					? -1
					: 0;
		if (direction === 0) return;
		event.preventDefault();
		const shifted = appState.minuteOfDay + direction * KEYBOARD_STEP_MINUTES;
		geoportal.setTimeOfDay(((shifted % MINUTES_IN_DAY) + MINUTES_IN_DAY) % MINUTES_IN_DAY);
	}
</script>

<section
	class="material-leather fixed right-(--edge-inset) bottom-[calc(var(--edge-inset)+3.25rem)] z-20 hidden items-center gap-3 px-3 py-2 [--cut:10px] md:flex md:flex-col"
	aria-label="Zegar doby"
>
	<div class="flex items-center gap-3">
		<button
			class="button-ochre grid size-11 place-items-center"
			aria-label={appState.routinePlayback.isPlaying ? 'Zatrzymaj zegar doby' : 'Odtwórz dobę'}
			disabled={appState.routinePlayback.isPreparing}
			onclick={togglePlayback}
		>
			{#if appState.routinePlayback.isPlaying}<PauseIcon class="size-5" />{:else}<PlayIcon
					class="size-5"
				/>{/if}
		</button>
		<span class="font-heading text-display text-primary tabular-nums"
			>{appState.timeOfDayLabel}</span
		>
	</div>
	{#if isExpanded}
		<svg
			class="w-60 cursor-pointer touch-none"
			viewBox="0 0 {ARC_WIDTH} {ARC_HEIGHT}"
			role="slider"
			tabindex="0"
			aria-label="Godzina na zegarze doby"
			aria-valuemin={0}
			aria-valuemax={MINUTES_IN_DAY - 5}
			aria-valuenow={appState.minuteOfDay}
			aria-valuetext={appState.timeOfDayLabel}
			onpointerdown={setTimeFromPointer}
			onpointermove={setTimeWhileDragging}
			onkeydown={setTimeFromKeyboard}
		>
			<path d={arcPath} fill="none" stroke="var(--linia)" stroke-width="3" stroke-linecap="round" />
			<circle
				cx={markerX}
				cy={markerY}
				r="7"
				fill="var(--zar)"
				stroke="var(--krawedz)"
				stroke-width="2"
			/>
			<text
				x={ARC_CENTER_X - ARC_RADIUS_X}
				y={ARC_HEIGHT - 1}
				class="fill-muted-foreground text-[10px]"
				text-anchor="middle">00</text
			>
			<text x={ARC_CENTER_X} y="10" class="fill-muted-foreground text-[10px]" text-anchor="middle"
				>12</text
			>
			<text
				x={ARC_CENTER_X + ARC_RADIUS_X}
				y={ARC_HEIGHT - 1}
				class="fill-muted-foreground text-[10px]"
				text-anchor="middle">24</text
			>
		</svg>
		<div class="flex gap-1.5" role="group" aria-label="Tempo zegara doby">
			{#each SPEEDS as speed (speed.value)}
				<button
					class="chip tabular-nums"
					aria-pressed={appState.routinePlayback.speed === speed.value}
					onclick={() => geoportal.setRoutinePlaybackSpeed(speed.value)}
				>
					{speed.label}
				</button>
			{/each}
		</div>
	{/if}
</section>
