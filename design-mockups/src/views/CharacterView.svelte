<script lang="ts">
	import MapIcon from '@lucide/svelte/icons/map';
	import UserIcon from '@lucide/svelte/icons/user';
	import DayDial from '../components/DayDial.svelte';
	import MiniMap from '../components/MiniMap.svelte';
	import PageLayout from '../components/PageLayout.svelte';
	import RelatedList from '../components/RelatedList.svelte';
	import RoutineBar from '../components/RoutineBar.svelte';
	import { findCharacter, findLocation, listEntriesByIds } from '../data/world.js';
	import { mockupState } from '../state/mockup-state.svelte.js';
	import { router } from '../state/router.svelte.js';

	let hour = $state(mockupState.hour);

	const character = $derived(findCharacter(router.route.param ?? 'lord-hagen'));
	const currentSlot = $derived(
		character?.routine.find(
			(slot) =>
				(hour >= slot.fromHour && hour < slot.toHour) ||
				(hour + 24 >= slot.fromHour && hour + 24 < slot.toHour)
		)
	);
	const currentPlace = $derived(currentSlot ? findLocation(currentSlot.locationId) : undefined);
	const homePlace = $derived(character ? findLocation(character.locationId) : undefined);

	function formatHour(value: number): string {
		return `${String(Math.floor(value)).padStart(2, '0')}:${value % 1 ? '30' : '00'}`;
	}
</script>

<PageLayout>
	{#if !character}
		<div class="missing">
			<h1>Nie znaleziono postaci</h1>
			<p>Adres wskazuje wpis, którego nie ma w przykładowych danych.</p>
			<a class="btn primary" href={router.buildHref('atlas')}>Wróć do mapy</a>
		</div>
	{:else}
		<nav class="crumbs" aria-label="Okruszki">
			<a href={router.buildHref('atlas')}>Khorinis</a>
			<span aria-hidden="true">/</span>
			<span>Postacie</span>
			<span aria-hidden="true">/</span>
			<span aria-current="page">{character.name}</span>
		</nav>

		<header class="head">
			<span class="seal"><UserIcon size={40} strokeWidth={1.2} aria-hidden="true" /></span>
			<div>
				<p class="kind">{character.role}, {character.guild}</p>
				<h1>{character.name}</h1>
			</div>
			<button
				type="button"
				class="btn primary"
				onclick={() => {
					router.navigate('atlas');
					mockupState.select(character.id);
				}}
			>
				<MapIcon size={16} aria-hidden="true" /> Pokaż na mapie
			</button>
		</header>

		<div class="columns">
			<div class="main">
				<p class="summary">{character.summary}</p>
				<p class="body">{character.description}</p>

				<dl class="facts">
					{#each character.facts as fact (fact.label)}
						<div>
							<dt>{fact.label}</dt>
							<dd>{fact.value}</dd>
						</div>
					{/each}
				</dl>

				<div class="related">
					<RelatedList
						title="Zadania"
						entries={listEntriesByIds(character.questIds)}
						onopen={(id) => router.navigate('quests', id)}
					/>
					<RelatedList
						title="Przy sobie"
						entries={listEntriesByIds(character.itemIds)}
						onopen={(id) => {
							router.navigate('atlas');
							mockupState.select(id);
						}}
					/>
				</div>
			</div>

			<aside class="routine cartouche">
				<h2>Rutyna dnia</h2>
				<DayDial {hour} onchange={(value) => (hour = value)} />
				<p class="now" aria-live="polite">
					O {formatHour(hour)}:
					<strong>{currentSlot?.activity ?? 'brak danych'}</strong>{#if currentPlace}<span
							>,
						</span><a href={router.buildHref('location', currentPlace.id)}>{currentPlace.name}</a
						>{/if}
				</p>
				<RoutineBar routine={character.routine} currentHour={hour} />
				<MiniMap
					highlightIds={currentPlace ? [currentPlace.id] : homePlace ? [homePlace.id] : []}
					label={`Położenie postaci o ${formatHour(hour)}`}
				/>
			</aside>
		</div>
	{/if}
</PageLayout>

<style>
	.crumbs {
		display: flex;
		flex-wrap: wrap;
		gap: var(--s-2);
		margin-bottom: var(--s-4);
		color: var(--tekst-2);
		font-size: var(--tx-sm);
	}

	.head {
		display: flex;
		align-items: center;
		gap: var(--s-4);
		padding-bottom: var(--s-5);
		border-bottom: 1px solid var(--linia);
	}

	.head > div {
		flex: 1;
	}

	.seal {
		display: grid;
		place-items: center;
		width: 84px;
		height: 84px;
		border: 1px solid var(--mosiadz);
		border-radius: 50%;
		color: var(--oliwka);
		box-shadow:
			inset 0 0 0 5px var(--grafit),
			inset 0 0 0 6px var(--mosiadz-ciemny);
	}

	.kind {
		color: var(--mosiadz-jasny);
		font-size: var(--tx-sm);
	}

	h1 {
		font-size: clamp(2rem, 4vw, var(--tx-3xl));
	}

	.columns {
		display: grid;
		grid-template-columns: minmax(0, 1fr) 360px;
		gap: var(--s-6);
		margin-top: var(--s-5);
	}

	.main {
		display: flex;
		flex-direction: column;
		gap: var(--s-4);
	}

	.summary {
		font-family: var(--font-display);
		font-size: 1.625rem;
		font-style: italic;
		line-height: 1.25;
	}

	.body {
		max-width: 64ch;
		color: var(--tekst-2);
		line-height: 1.7;
	}

	.facts {
		margin: 0;
		border-top: 1px solid var(--linia);
	}

	.facts div {
		display: flex;
		justify-content: space-between;
		padding: 8px 0;
		border-bottom: 1px solid var(--linia);
		font-size: var(--tx-sm);
	}

	dt {
		color: var(--tekst-2);
	}

	dd {
		margin: 0;
	}

	.related {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: var(--s-5);
	}

	.routine {
		display: flex;
		flex-direction: column;
		gap: var(--s-3);
		align-self: start;
		padding: var(--s-4);
	}

	.routine h2 {
		font-size: var(--tx-xl);
	}

	.now {
		text-align: center;
	}

	.missing {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: var(--s-3);
		padding: var(--s-7) 0;
		color: var(--tekst-2);
	}

	@media (max-width: 63.99rem) {
		.columns,
		.related {
			grid-template-columns: 1fr;
		}

		.head {
			flex-wrap: wrap;
		}
	}
</style>
