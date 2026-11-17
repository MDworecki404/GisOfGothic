<script lang="ts">
	import { findLocation } from '../data/world.js';
	import type { RoutineSlot } from '../data/types.js';

	interface Props {
		routine: readonly RoutineSlot[];
		currentHour: number;
	}

	let { routine, currentHour }: Props = $props();

	const slots = $derived(
		routine.map((slot) => {
			const start = slot.fromHour % 24;
			const length = slot.toHour - slot.fromHour;
			return { ...slot, start, length, place: findLocation(slot.locationId)?.name ?? '' };
		})
	);
</script>

<div class="routine">
	<div
		class="track"
		role="img"
		aria-label={`Rutyna dnia. ${routine.map((slot) => `${String(slot.fromHour % 24).padStart(2, '0')}:00, ${slot.activity}, ${findLocation(slot.locationId)?.name ?? ''}`).join('. ')}`}
	>
		{#each slots as slot (slot.fromHour)}
			<span
				class="slot"
				style:left={`${(slot.start / 24) * 100}%`}
				style:width={`${(Math.min(slot.length, 24 - slot.start) / 24) * 100}%`}
			></span>
			{#if slot.start + slot.length > 24}
				<span
					class="slot"
					style:left="0"
					style:width={`${((slot.start + slot.length - 24) / 24) * 100}%`}
				></span>
			{/if}
		{/each}
		<span class="now" style:left={`${(currentHour / 24) * 100}%`}></span>
	</div>
	<div class="ticks" aria-hidden="true">
		<span>00</span><span>06</span><span>12</span><span>18</span><span>24</span>
	</div>
	<ul>
		{#each slots as slot (slot.fromHour)}
			<li>
				<span class="time tabular">{String(slot.start).padStart(2, '0')}:00</span>
				<span>{slot.activity}<span class="place">, {slot.place}</span></span>
			</li>
		{/each}
	</ul>
</div>

<style>
	.track {
		position: relative;
		height: 12px;
		border-radius: 6px;
		background: var(--kamien-3);
		overflow: hidden;
	}

	.slot {
		position: absolute;
		top: 0;
		bottom: 0;
		background: var(--oliwka-ciemna);
		border-right: 2px solid var(--kamien-1);
	}

	.slot:nth-child(odd) {
		background: var(--mosiadz-ciemny);
	}

	.now {
		position: absolute;
		top: -2px;
		bottom: -2px;
		width: 3px;
		background: var(--tekst);
	}

	.ticks {
		display: flex;
		justify-content: space-between;
		margin-top: 4px;
		color: var(--tekst-3);
		font-size: 0.6875rem;
	}

	ul {
		margin-top: var(--s-3);
	}

	li {
		display: flex;
		gap: var(--s-3);
		padding: 4px 0;
		font-size: var(--tx-sm);
	}

	.time {
		flex: none;
		width: 48px;
		color: var(--mosiadz-jasny);
	}

	.place {
		color: var(--tekst-2);
	}
</style>
