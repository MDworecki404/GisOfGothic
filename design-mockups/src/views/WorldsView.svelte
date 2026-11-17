<script lang="ts">
	import PageLayout from '../components/PageLayout.svelte';
	import { WORLD_SUMMARIES } from '../data/world.js';
	import { mockupState } from '../state/mockup-state.svelte.js';
	import { router } from '../state/router.svelte.js';

	let firstId = $state('khorinis');
	let secondId = $state('myrtana');

	const games = $derived([...new Set(WORLD_SUMMARIES.map((world) => world.gameName))]);
	const first = $derived(WORLD_SUMMARIES.find((world) => world.id === firstId));
	const second = $derived(WORLD_SUMMARIES.find((world) => world.id === secondId));
	const largestArea = Math.max(...WORLD_SUMMARIES.map((world) => world.areaKm2));

	function silhouetteSize(areaKm2: number | undefined): number {
		return areaKm2 ? Math.max(14, (Math.sqrt(areaKm2) / Math.sqrt(largestArea)) * 100) : 0;
	}
</script>

<PageLayout>
	<header class="head">
		<h1 class="page-title">Światy</h1>
		<p>
			Wybierz świat, który chcesz zobaczyć na mapie, albo zestaw dwa światy i porównaj ich rozmiar.
		</p>
	</header>

	<div class="columns">
		<section aria-label="Gry i światy">
			{#each games as game (game)}
				<h2>{game}</h2>
				<ul class="worlds">
					{#each WORLD_SUMMARIES.filter((world) => world.gameName === game) as world (world.id)}
						<li>
							<button
								type="button"
								class="world"
								aria-current={world.id === 'khorinis' ? 'true' : undefined}
								onclick={() => {
									if (world.id === 'khorinis') {
										router.navigate('atlas');
									} else {
										mockupState.showToast(
											`Makieta pokazuje tylko Khorinis. „${world.name}” byłby wczytany tutaj.`
										);
									}
								}}
							>
								<svg viewBox="0 0 1000 640" aria-hidden="true"><path d={world.outline} /></svg>
								<span class="text">
									<span class="name">{world.name}</span>
									<span class="meta tabular"
										>{world.places} lokacji, {world.characters} postaci, {world.items} przedmiotów</span
									>
								</span>
								{#if world.id === 'khorinis'}<span class="current">Otwarty</span>{/if}
							</button>
						</li>
					{/each}
				</ul>
			{/each}
		</section>

		<section class="compare cartouche" aria-labelledby="compare-title">
			<h2 id="compare-title">Porównanie rozmiarów</h2>
			<div class="pickers">
				<label>
					<span>Pierwszy świat</span>
					<select bind:value={firstId}>
						{#each WORLD_SUMMARIES as world (world.id)}<option value={world.id}>{world.name}</option
							>{/each}
					</select>
				</label>
				<label>
					<span>Drugi świat</span>
					<select bind:value={secondId}>
						{#each WORLD_SUMMARIES as world (world.id)}<option value={world.id}>{world.name}</option
							>{/each}
					</select>
				</label>
			</div>

			<div
				class="stage"
				role="img"
				aria-label={`Sylwetki światów ${first?.name} i ${second?.name} w tej samej skali`}
			>
				{#if first}
					<svg
						class="first"
						viewBox="0 0 1000 640"
						style:width={`${silhouetteSize(first.areaKm2)}%`}><path d={first.outline} /></svg
					>
				{/if}
				{#if second}
					<svg
						class="second"
						viewBox="0 0 1000 640"
						style:width={`${silhouetteSize(second.areaKm2)}%`}><path d={second.outline} /></svg
					>
				{/if}
			</div>

			{#if first && second}
				<table>
					<caption class="sr-only">Porównanie wybranych światów</caption>
					<thead>
						<tr
							><th scope="col">Cecha</th><th scope="col">{first.name}</th><th scope="col"
								>{second.name}</th
							></tr
						>
					</thead>
					<tbody>
						<tr
							><th scope="row">Powierzchnia</th><td class="tabular">{first.areaKm2} km²</td><td
								class="tabular">{second.areaKm2} km²</td
							></tr
						>
						<tr
							><th scope="row">Lokacje</th><td class="tabular">{first.places}</td><td
								class="tabular">{second.places}</td
							></tr
						>
						<tr
							><th scope="row">Postacie</th><td class="tabular">{first.characters}</td><td
								class="tabular">{second.characters}</td
							></tr
						>
						<tr
							><th scope="row">Rozdziały</th><td>{first.hasChapters ? 'Tak' : 'Nie'}</td><td
								>{second.hasChapters ? 'Tak' : 'Nie'}</td
							></tr
						>
					</tbody>
				</table>
				<p class="ratio">
					{#if first.id === second.id}
						Wybrano ten sam świat dwa razy.
					{:else}
						{second.areaKm2 > first.areaKm2 ? second.name : first.name} jest około
						<strong class="tabular"
							>{(
								Math.max(first.areaKm2, second.areaKm2) / Math.min(first.areaKm2, second.areaKm2)
							).toLocaleString('pl-PL', { maximumFractionDigits: 1 })}×</strong
						>
						większy.
					{/if}
				</p>
			{/if}
		</section>
	</div>
</PageLayout>

<style>
	.head p {
		max-width: 60ch;
		margin-top: var(--s-2);
		color: var(--tekst-2);
	}

	.columns {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
		gap: var(--s-6);
		margin-top: var(--s-5);
		align-items: start;
	}

	h2 {
		margin: var(--s-4) 0 var(--s-2);
		font-size: var(--tx-xl);
		color: var(--mosiadz-jasny);
	}

	section > h2:first-child {
		margin-top: 0;
	}

	.worlds {
		border: 1px solid var(--linia);
		border-radius: var(--r-panel);
		background: var(--kamien-1);
		overflow: hidden;
	}

	.worlds li + li {
		border-top: 1px solid var(--linia);
	}

	.world {
		display: flex;
		align-items: center;
		gap: var(--s-3);
		width: 100%;
		min-height: 68px;
		padding: var(--s-2) var(--s-3);
		border: 0;
		background: none;
		text-align: left;
		transition: background var(--czas-krotki) ease;
	}

	.world:hover {
		background: var(--kamien-2);
	}

	.world[aria-current='true'] {
		box-shadow: inset 3px 0 0 var(--mosiadz);
	}

	.world svg {
		flex: none;
		width: 56px;
		height: 36px;
		fill: var(--ziemia-jasna);
		stroke: var(--mosiadz-ciemny);
		stroke-width: 16;
	}

	.text {
		display: flex;
		flex: 1;
		flex-direction: column;
	}

	.name {
		font-family: var(--font-display);
		font-size: 1.25rem;
		font-weight: 600;
	}

	.meta {
		color: var(--tekst-2);
		font-size: var(--tx-xs);
	}

	.current {
		padding: 2px 8px;
		border: 1px solid var(--mosiadz-ciemny);
		border-radius: 999px;
		color: var(--mosiadz-jasny);
		font-size: var(--tx-xs);
	}

	.compare {
		display: flex;
		flex-direction: column;
		gap: var(--s-4);
		padding: var(--s-5);
	}

	.compare h2 {
		margin: 0;
	}

	.pickers {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--s-3);
	}

	label {
		display: flex;
		flex-direction: column;
		gap: 4px;
		font-size: var(--tx-sm);
		color: var(--tekst-2);
	}

	select {
		min-height: 40px;
		padding: 0 var(--s-3);
		border: 1px solid var(--linia-mocna);
		border-radius: var(--r-ostry);
		background: var(--antracyt);
		color: var(--tekst);
	}

	.stage {
		position: relative;
		height: 240px;
		border: 1px solid var(--linia);
		border-radius: var(--r-panel);
		background: var(--morze);
		overflow: hidden;
	}

	.stage svg {
		position: absolute;
		left: 50%;
		top: 50%;
		translate: -50% -50%;
		height: auto;
		fill-opacity: 0.55;
		stroke-width: 6;
	}

	.first {
		fill: var(--mosiadz);
		stroke: var(--mosiadz-jasny);
	}

	.second {
		fill: var(--oliwka);
		stroke: var(--oliwka);
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: var(--tx-sm);
	}

	th,
	td {
		padding: 8px 0;
		border-bottom: 1px solid var(--linia);
		text-align: right;
	}

	th:first-child {
		text-align: left;
		font-weight: 400;
		color: var(--tekst-2);
	}

	thead th {
		color: var(--tekst);
		font-family: var(--font-display);
		font-size: 1.125rem;
	}

	.ratio {
		color: var(--tekst-2);
	}

	@media (max-width: 63.99rem) {
		.columns {
			grid-template-columns: 1fr;
		}
	}
</style>
