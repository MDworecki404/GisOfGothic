<script lang="ts">
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import ChevronUpIcon from '@lucide/svelte/icons/chevron-up';
	import PauseIcon from '@lucide/svelte/icons/pause';
	import PlayIcon from '@lucide/svelte/icons/play';
	import { appState, geoportal } from '#lib/composition-root.js';

	const MINUTES_IN_DAY = 24 * 60;
	const KEYBOARD_STEP_MINUTES = 30;
	const DIAL_SIZE = 132;
	const DIAL_CENTER = DIAL_SIZE / 2;
	const DIAL_TRACK_RADIUS = 52;
	const DIAL_TICK_INNER_RADIUS = 44;
	const DIAL_TICK_OUTER_RADIUS = 60;
	const DIAL_HOURS_WITH_TICK = [0, 6, 12, 18];
	const DAYLIGHT_START_MINUTE = 6 * 60;
	const DAYLIGHT_END_MINUTE = 20 * 60;
	const SPEEDS = [
		{ value: 'game', label: '1×' },
		{ value: 'fast', label: '4×' },
		{ value: 'very-fast', label: '60×' }
	] as const;

	let isExpanded = $state(false);

	$effect(() => {
		if (appState.activeToolId === 'time' || appState.routinePlayback.isPlaying) isExpanded = true;
	});
	/** Kąt na tarczy mierzony od dołu zgodnie z ruchem wskazówek: północ jest na dole, południe u góry. */
	function minuteToAngle(minute: number): number {
		return (minute / MINUTES_IN_DAY) * 2 * Math.PI + Math.PI;
	}

	function pointOnDial(minute: number, radius: number): { x: number; y: number } {
		const angle = minuteToAngle(minute);
		return {
			x: DIAL_CENTER + radius * Math.sin(angle),
			y: DIAL_CENTER - radius * Math.cos(angle)
		};
	}

	function describeDialArc(fromMinute: number, toMinute: number, radius: number): string {
		const start = pointOnDial(fromMinute, radius);
		const end = pointOnDial(toMinute, radius);
		const isLargeArc = toMinute - fromMinute > MINUTES_IN_DAY / 2 ? 1 : 0;
		return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${radius} ${radius} 0 ${isLargeArc} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
	}

	const marker = $derived(pointOnDial(appState.minuteOfDay, DIAL_TRACK_RADIUS));
	const daylightArc = describeDialArc(
		DAYLIGHT_START_MINUTE,
		DAYLIGHT_END_MINUTE,
		DIAL_TRACK_RADIUS
	);
	const hourTicks = DIAL_HOURS_WITH_TICK.map((hour) => ({
		hour,
		inner: pointOnDial(hour * 60, DIAL_TICK_INNER_RADIUS),
		outer: pointOnDial(hour * 60, DIAL_TICK_OUTER_RADIUS)
	}));

	function togglePlayback(): void {
		if (appState.routinePlayback.isPlaying) geoportal.stopRoutinePlayback();
		else geoportal.startRoutinePlayback(appState.routinePlayback.speed);
	}

	function setTimeFromPointer(event: PointerEvent): void {
		const bounds =
			event.currentTarget instanceof Element ? event.currentTarget.getBoundingClientRect() : null;
		if (bounds === null) return;
		const offsetX = event.clientX - (bounds.left + bounds.width / 2);
		const offsetY = event.clientY - (bounds.top + bounds.height / 2);
		const angle = Math.atan2(offsetX, -offsetY);
		const fullTurn = 2 * Math.PI;
		const fraction = ((((angle - Math.PI) % fullTurn) + fullTurn) % fullTurn) / fullTurn;
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
	class="material-leather fixed right-(--edge-inset) bottom-[calc(var(--edge-inset)+5.25rem)] z-10 hidden items-center gap-3 px-3 py-2 [--cut:10px] md:flex md:flex-col"
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
		<button
			class="grid size-11 place-items-center text-muted-foreground hover:bg-hover-surface hover:text-hover"
			aria-label={isExpanded ? 'Zwiń zegar doby' : 'Rozwiń zegar doby'}
			aria-expanded={isExpanded}
			onclick={() => (isExpanded = !isExpanded)}
		>
			{#if isExpanded}<ChevronDownIcon class="size-5" />{:else}<ChevronUpIcon class="size-5" />{/if}
		</button>
	</div>
	{#if isExpanded}
		<svg
			class="size-33 cursor-pointer touch-none"
			viewBox="0 0 {DIAL_SIZE} {DIAL_SIZE}"
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
			<circle
				cx={DIAL_CENTER}
				cy={DIAL_CENTER}
				r={DIAL_TRACK_RADIUS}
				fill="none"
				stroke="var(--linia)"
				stroke-width="3"
			/>
			<path
				d={daylightArc}
				fill="none"
				stroke="var(--zar)"
				stroke-width="3"
				stroke-linecap="round"
			/>
			{#each hourTicks as tick (tick.hour)}
				<line
					x1={tick.inner.x}
					y1={tick.inner.y}
					x2={tick.outer.x}
					y2={tick.outer.y}
					stroke="var(--mgla)"
					stroke-width="1.5"
				/>
			{/each}
			<text
				x={DIAL_CENTER}
				y={DIAL_CENTER - 4}
				class="fill-foreground text-[15px] font-medium tabular-nums"
				text-anchor="middle">{appState.timeOfDayLabel}</text
			>
			<text
				x={DIAL_CENTER}
				y={DIAL_CENTER + 14}
				class="fill-muted-foreground text-[10px]"
				text-anchor="middle">doba</text
			>
			<circle
				cx={marker.x}
				cy={marker.y}
				r="7"
				fill="var(--zar)"
				stroke="var(--krawedz)"
				stroke-width="2"
			/>
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
