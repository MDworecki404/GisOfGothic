<script lang="ts">
	import RouteIcon from '@lucide/svelte/icons/route';
	import MiniMap from '../components/MiniMap.svelte';
	import PageLayout from '../components/PageLayout.svelte';
	import { findLocation } from '../data/world.js';
	import { mockupState } from '../state/mockup-state.svelte.js';
	import { router } from '../state/router.svelte.js';

	interface Trail {
		id: string;
		name: string;
		description: string;
		stopIds: string[];
		duration: string;
		difficulty: string;
	}

	const TRAILS: readonly Trail[] = [
		{
			id: 'xardas',
			name: 'Śladami Xardasa',
			description: 'Od portu do samotnej wieży przez miejsca, które wspominają o czarnoksiężniku.',
			stopIds: ['khorinis-port', 'kamienny-krag', 'opuszczona-kopalnia', 'wieza-xardasa'],
			duration: 'ok. 40 min',
			difficulty: 'Średnia'
		},
		{
			id: 'farmy',
			name: 'Objazd farm',
			description: 'Spokojna trasa wzdłuż głównego traktu, od najbliższej farmy do najdalszej.',
			stopIds: ['farma-sekoba', 'martwa-harpia', 'farma-onara', 'farma-bengara'],
			duration: 'ok. 55 min',
			difficulty: 'Łatwa'
		},
		{
			id: 'magowie',
			name: 'Droga magów',
			description: 'Z miasta do klasztoru i dalej, do przełęczy prowadzącej poza wyspę.',
			stopIds: ['gorne-miasto', 'farma-onara', 'klasztor-innosa', 'przelecz'],
			duration: 'ok. 1 h 10 min',
			difficulty: 'Trudna'
		}
	];

	let selectedTrailId = $state(TRAILS[0].id);
	const selectedTrail = $derived(TRAILS.find((trail) => trail.id === selectedTrailId) ?? TRAILS[0]);
</script>

<PageLayout>
	<div class="banner" role="note">
		<strong>Propozycja.</strong> Tego modułu nie ma jeszcze w aplikacji. Makieta pokazuje, jak mogłyby
		wyglądać trasy tematyczne zbudowane z istniejących danych.
	</div>

	<header class="head">
		<h1 class="page-title">Szlaki tematyczne</h1>
		<p>Gotowe trasy po świecie, ułożone wokół jednej postaci, zadania albo regionu.</p>
	</header>

	<div class="columns">
		<ul class="trails">
			{#each TRAILS as trail (trail.id)}
				<li>
					<button
						type="button"
						class="trail"
						aria-current={trail.id === selectedTrailId ? 'true' : undefined}
						onclick={() => (selectedTrailId = trail.id)}
					>
						<RouteIcon size={20} strokeWidth={1.5} aria-hidden="true" />
						<span class="text">
							<span class="name">{trail.name}</span>
							<span class="meta"
								>{trail.stopIds.length} przystanki, {trail.duration}, trudność: {trail.difficulty.toLowerCase()}</span
							>
						</span>
					</button>
				</li>
			{/each}
		</ul>

		<article class="detail cartouche">
			<h2>{selectedTrail.name}</h2>
			<p class="description">{selectedTrail.description}</p>
			<MiniMap routeIds={selectedTrail.stopIds} label={`Przebieg szlaku ${selectedTrail.name}`} />
			<ol>
				{#each selectedTrail.stopIds as stopId, index (stopId)}
					<li>
						<span class="step-index tabular">{index + 1}</span>
						<a href={router.buildHref('location', stopId)}>{findLocation(stopId)?.name}</a>
					</li>
				{/each}
			</ol>
			<button
				type="button"
				class="btn primary"
				onclick={() => mockupState.showToast('Szlak zostałby narysowany na mapie')}
			>
				Pokaż szlak na mapie
			</button>
		</article>
	</div>
</PageLayout>

<style>
	.banner {
		margin-bottom: var(--s-4);
		padding: var(--s-3) var(--s-4);
		border: 1px dashed var(--mosiadz-ciemny);
		border-radius: var(--r-ostry);
		background: var(--mosiadz-tlo);
		color: var(--tekst);
		font-size: var(--tx-sm);
	}

	.head p {
		margin-top: var(--s-2);
		color: var(--tekst-2);
	}

	.columns {
		display: grid;
		grid-template-columns: 340px minmax(0, 1fr);
		gap: var(--s-5);
		margin-top: var(--s-5);
		align-items: start;
	}

	.trails {
		border: 1px solid var(--linia);
		border-radius: var(--r-panel);
		background: var(--kamien-1);
		overflow: hidden;
	}

	.trails li + li {
		border-top: 1px solid var(--linia);
	}

	.trail {
		display: flex;
		align-items: center;
		gap: var(--s-3);
		width: 100%;
		min-height: 68px;
		padding: var(--s-2) var(--s-3);
		border: 0;
		background: none;
		text-align: left;
		color: var(--tekst-2);
		transition: background var(--czas-krotki) ease;
	}

	.trail:hover {
		background: var(--kamien-2);
	}

	.trail[aria-current='true'] {
		background: var(--mosiadz-tlo);
		box-shadow: inset 3px 0 0 var(--mosiadz);
		color: var(--mosiadz-jasny);
	}

	.text {
		display: flex;
		flex-direction: column;
	}

	.name {
		color: var(--tekst);
		font-family: var(--font-display);
		font-size: 1.25rem;
		font-weight: 600;
	}

	.meta {
		color: var(--tekst-2);
		font-size: var(--tx-xs);
	}

	.detail {
		display: flex;
		flex-direction: column;
		gap: var(--s-4);
		padding: var(--s-5);
	}

	.detail h2 {
		font-size: var(--tx-2xl);
	}

	.description {
		max-width: 60ch;
		color: var(--tekst-2);
	}

	ol {
		display: flex;
		flex-direction: column;
		gap: var(--s-2);
	}

	ol li {
		display: flex;
		align-items: center;
		gap: var(--s-3);
	}

	.step-index {
		display: grid;
		place-items: center;
		width: 24px;
		height: 24px;
		border: 1px solid var(--kat-quest);
		border-radius: 50%;
		color: var(--kat-quest);
		font-size: var(--tx-xs);
	}

	@media (max-width: 63.99rem) {
		.columns {
			grid-template-columns: 1fr;
		}
	}
</style>
