<script lang="ts">
	import BookmarkIcon from '@lucide/svelte/icons/bookmark';
	import MapIcon from '@lucide/svelte/icons/map';
	import MiniMap from '../components/MiniMap.svelte';
	import PageLayout from '../components/PageLayout.svelte';
	import RelatedList from '../components/RelatedList.svelte';
	import Scene from '../components/Scene.svelte';
	import { REGIONS, findLocation, listEntriesByIds } from '../data/world.js';
	import { mockupState } from '../state/mockup-state.svelte.js';
	import { router } from '../state/router.svelte.js';

	const location = $derived(findLocation(router.route.param ?? 'wieza-xardasa'));
	const regionName = $derived(
		REGIONS.find((region) => region.id === location?.regionId)?.name ?? ''
	);
	const isSaved = $derived(location ? mockupState.savedIds.includes(location.id) : false);

	function openOnMap(id: string): void {
		router.navigate('atlas');
		mockupState.select(id);
	}
</script>

<PageLayout>
	{#if !location}
		<div class="missing">
			<h1>Nie znaleziono lokacji</h1>
			<p>
				Adres wskazuje wpis, którego nie ma w przykładowych danych. Wróć do mapy i wybierz miejsce z
				listy.
			</p>
			<a class="btn primary" href={router.buildHref('atlas')}>Wróć do mapy</a>
		</div>
	{:else}
		<nav class="crumbs" aria-label="Okruszki">
			<a href={router.buildHref('atlas')}>Khorinis</a>
			<span aria-hidden="true">/</span>
			<span>{regionName}</span>
			<span aria-hidden="true">/</span>
			<span aria-current="page">{location.name}</span>
		</nav>

		<section class="hero">
			<Scene kind={location.scene} label={`Ilustracja: ${location.name}`} />
			<div class="hero-text">
				<p class="kind">{location.kindLabel}</p>
				<h1>{location.name}</h1>
			</div>
		</section>

		<div class="columns">
			<div class="main">
				<div class="actions">
					<button type="button" class="btn primary" onclick={() => openOnMap(location.id)}>
						<MapIcon size={16} aria-hidden="true" /> Pokaż na mapie
					</button>
					<button
						type="button"
						class="btn"
						aria-pressed={isSaved}
						onclick={() => mockupState.toggleSaved(location.id)}
					>
						<BookmarkIcon size={16} fill={isSaved ? 'currentColor' : 'none'} aria-hidden="true" />
						{isSaved ? 'Zapisano' : 'Zapisz'}
					</button>
				</div>

				<p class="summary">{location.summary}</p>
				{#each location.description as paragraph (paragraph)}
					<p class="body">{paragraph}</p>
				{/each}

				<div class="related">
					<RelatedList
						title="Postacie"
						entries={listEntriesByIds(location.characterIds)}
						onopen={(id) => router.navigate('character', id)}
					/>
					<RelatedList
						title="Przedmioty"
						entries={listEntriesByIds(location.itemIds)}
						onopen={openOnMap}
					/>
					<RelatedList
						title="Potwory"
						entries={listEntriesByIds(location.monsterIds)}
						onopen={openOnMap}
					/>
					<RelatedList
						title="Zadania"
						entries={listEntriesByIds(location.questIds)}
						onopen={(id) => router.navigate('quests', id)}
					/>
				</div>
			</div>

			<aside>
				<MiniMap highlightIds={[location.id]} label={`Położenie: ${location.name}`} />
				<dl class="facts">
					{#each location.facts as fact (fact.label)}
						<div>
							<dt>{fact.label}</dt>
							<dd>{fact.value}</dd>
						</div>
					{/each}
				</dl>
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

	.hero {
		position: relative;
		aspect-ratio: 21 / 7;
		min-height: 180px;
		border: 1px solid var(--mosiadz-ciemny);
		border-radius: var(--r-panel);
		overflow: hidden;
	}

	.hero::after {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(to top, rgb(18 20 22 / 0.92), transparent 62%);
	}

	.hero-text {
		position: absolute;
		left: var(--s-5);
		bottom: var(--s-4);
		z-index: 1;
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
		grid-template-columns: minmax(0, 1fr) 340px;
		gap: var(--s-6);
		margin-top: var(--s-5);
	}

	.main {
		display: flex;
		flex-direction: column;
		gap: var(--s-4);
	}

	.actions {
		display: flex;
		gap: var(--s-2);
		flex-wrap: wrap;
	}

	.btn[aria-pressed='true'] {
		border-color: var(--mosiadz);
		background: var(--mosiadz-tlo);
		color: var(--mosiadz-jasny);
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

	.related {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: var(--s-5) var(--s-5);
		margin-top: var(--s-3);
	}

	aside {
		display: flex;
		flex-direction: column;
		gap: var(--s-4);
	}

	.facts {
		margin: 0;
		border-top: 1px solid var(--linia);
	}

	.facts div {
		display: flex;
		justify-content: space-between;
		gap: var(--s-4);
		padding: 8px 0;
		border-bottom: 1px solid var(--linia);
		font-size: var(--tx-sm);
	}

	dt {
		color: var(--tekst-2);
	}

	dd {
		margin: 0;
		text-align: right;
	}

	.missing {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: var(--s-3);
		padding: var(--s-7) 0;
		color: var(--tekst-2);
	}

	.missing h1 {
		color: var(--tekst);
	}

	@media (max-width: 63.99rem) {
		.columns {
			grid-template-columns: 1fr;
		}

		aside {
			order: -1;
		}

		.related {
			grid-template-columns: 1fr;
		}
	}
</style>
