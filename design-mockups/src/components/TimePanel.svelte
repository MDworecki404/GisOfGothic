<script lang="ts">
	import MoonIcon from '@lucide/svelte/icons/moon';
	import SunIcon from '@lucide/svelte/icons/sun';
	import { CHAPTER_NAMES, CHARACTERS, findLocation } from '../data/world.js';
	import { mockupState } from '../state/mockup-state.svelte.js';
	import DayDial from './DayDial.svelte';

	const isDaytime = $derived(mockupState.hour >= 6 && mockupState.hour < 20);

	const charactersNow = $derived(
		CHARACTERS.flatMap((character) => {
			const hour = mockupState.hour;
			const slot = character.routine.find(
				(candidate) =>
					(hour >= candidate.fromHour && hour < candidate.toHour) ||
					(hour + 24 >= candidate.fromHour && hour + 24 < candidate.toHour)
			);
			const location = slot ? findLocation(slot.locationId) : undefined;
			return slot && location
				? [{ character, activity: slot.activity, locationName: location.name }]
				: [];
		}).slice(0, 6)
	);
</script>

<div class="stack">
	<div class="dial-wrap">
		<DayDial hour={mockupState.hour} onchange={(hour) => (mockupState.hour = hour)} />
		<p class="phase">
			{#if isDaytime}<SunIcon size={16} aria-hidden="true" /> Dzień{:else}<MoonIcon
					size={16}
					aria-hidden="true"
				/> Noc{/if}
			<span>Mapa przyciemnia się po zmroku</span>
		</p>
	</div>

	<fieldset>
		<legend>Rozdział</legend>
		<div class="chapters">
			{#each CHAPTER_NAMES as name, index (name)}
				<button
					type="button"
					class="chip"
					aria-pressed={mockupState.chapter === index + 1}
					onclick={() => (mockupState.chapter = index + 1)}
					aria-label={name}
				>
					{index + 1}
				</button>
			{/each}
		</div>
		<p class="note">Rozdział wpływa na dostępne zadania i położenie postaci.</p>
	</fieldset>

	<section aria-labelledby="who-now">
		<h3 id="who-now">Kto jest teraz w okolicy</h3>
		<ul>
			{#each charactersNow as item (item.character.id)}
				<li>
					<button
						type="button"
						class="person"
						onclick={() => mockupState.select(item.character.id)}
					>
						<span class="name">{item.character.name}</span>
						<span class="meta">{item.activity}, {item.locationName}</span>
					</button>
				</li>
			{/each}
		</ul>
	</section>
</div>

<style>
	.stack {
		display: flex;
		flex-direction: column;
		gap: var(--s-5);
	}

	.dial-wrap {
		display: flex;
		flex-direction: column;
		gap: var(--s-3);
	}

	.phase {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		font-weight: 500;
	}

	.phase span {
		color: var(--tekst-3);
		font-size: var(--tx-xs);
		font-weight: 400;
	}

	fieldset {
		margin: 0;
		padding: 0;
		border: 0;
	}

	legend,
	h3 {
		margin-bottom: var(--s-2);
		padding: 0;
		font-family: var(--font-display);
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--mosiadz-jasny);
	}

	.chapters {
		display: grid;
		grid-template-columns: repeat(6, 1fr);
		gap: 6px;
	}

	.chapters .chip {
		justify-content: center;
		min-height: var(--cel-dotyku);
		padding: 0;
	}

	.note {
		margin-top: var(--s-2);
		color: var(--tekst-2);
		font-size: var(--tx-xs);
	}

	li + li {
		border-top: 1px solid var(--linia);
	}

	.person {
		display: flex;
		flex-direction: column;
		width: 100%;
		min-height: var(--cel-dotyku);
		padding: 6px 4px;
		border: 0;
		background: none;
		text-align: left;
	}

	.person:hover .name {
		color: var(--mosiadz-jasny);
	}

	.name {
		font-weight: 500;
	}

	.meta {
		color: var(--tekst-2);
		font-size: var(--tx-xs);
	}
</style>
