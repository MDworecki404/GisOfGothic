<script lang="ts">
	import CheckIcon from '@lucide/svelte/icons/check';
	import MapIcon from '@lucide/svelte/icons/map';
	import MiniMap from '../components/MiniMap.svelte';
	import PageLayout from '../components/PageLayout.svelte';
	import { CHAPTER_NAMES, QUESTS, findCharacter, findLocation, findQuest } from '../data/world.js';
	import { mockupState } from '../state/mockup-state.svelte.js';
	import { router } from '../state/router.svelte.js';

	let chapterFilter = $state<number | 'all'>('all');
	let completedIds = $state<string[]>(['polowanie-na-zebacze']);

	const filteredQuests = $derived(
		QUESTS.filter((quest) => chapterFilter === 'all' || quest.chapter === chapterFilter)
	);
	const selectedQuest = $derived(
		(router.route.param ? findQuest(router.route.param) : undefined) ?? filteredQuests[0]
	);

	function toggleCompleted(questId: string): void {
		const isDone = completedIds.includes(questId);
		completedIds = isDone
			? completedIds.filter((id) => id !== questId)
			: [...completedIds, questId];
		mockupState.showToast(
			isDone ? 'Zadanie oznaczone jako otwarte' : 'Zadanie oznaczone jako ukończone'
		);
	}

	function countInChapter(chapter: number): number {
		return QUESTS.filter((quest) => quest.chapter === chapter).length;
	}
</script>

<PageLayout>
	<header class="head">
		<h1 class="page-title">Przewodnik po zadaniach</h1>
		<p>
			Zadania z Khorinis uporządkowane według rozdziału. Wybierz zadanie, aby zobaczyć kroki i
			trasę.
		</p>
	</header>

	<div class="chapters" role="group" aria-label="Filtruj według rozdziału">
		<button
			type="button"
			class="chip"
			aria-pressed={chapterFilter === 'all'}
			onclick={() => (chapterFilter = 'all')}>Wszystkie</button
		>
		{#each CHAPTER_NAMES as name, index (name)}
			<button
				type="button"
				class="chip"
				aria-pressed={chapterFilter === index + 1}
				onclick={() => (chapterFilter = index + 1)}
			>
				{name}
				<span class="count tabular">{countInChapter(index + 1)}</span>
			</button>
		{/each}
	</div>

	<div class="columns">
		<ul class="list" aria-label="Lista zadań">
			{#each filteredQuests as quest (quest.id)}
				<li>
					<button
						type="button"
						class="quest"
						aria-current={selectedQuest?.id === quest.id ? 'true' : undefined}
						onclick={() => router.navigate('quests', quest.id)}
					>
						<span class="check" class:done={completedIds.includes(quest.id)} aria-hidden="true">
							{#if completedIds.includes(quest.id)}<CheckIcon size={14} />{/if}
						</span>
						<span class="text">
							<span class="name">{quest.name}</span>
							<span class="meta"
								>Rozdział {quest.chapter}, zleca {findCharacter(quest.giverId)?.name}</span
							>
						</span>
					</button>
				</li>
			{:else}
				<li class="empty">
					<h2>Brak zadań w tym rozdziale</h2>
					<p>
						W przykładowych danych nie ma jeszcze zadań z wybranego rozdziału. Wybierz inny albo
						pokaż wszystkie.
					</p>
					<button type="button" class="btn" onclick={() => (chapterFilter = 'all')}
						>Pokaż wszystkie</button
					>
				</li>
			{/each}
		</ul>

		{#if selectedQuest}
			<article class="detail cartouche">
				<header>
					<div>
						<p class="kind">Rozdział {selectedQuest.chapter}</p>
						<h2>{selectedQuest.name}</h2>
					</div>
					<button
						type="button"
						class="btn"
						aria-pressed={completedIds.includes(selectedQuest.id)}
						onclick={() => toggleCompleted(selectedQuest.id)}
					>
						<CheckIcon size={16} aria-hidden="true" />
						{completedIds.includes(selectedQuest.id) ? 'Ukończone' : 'Oznacz jako ukończone'}
					</button>
				</header>
				<p class="summary">{selectedQuest.summary}</p>
				<dl class="facts">
					<div>
						<dt>Zleca</dt>
						<dd>{findCharacter(selectedQuest.giverId)?.name}</dd>
					</div>
					<div>
						<dt>Nagroda</dt>
						<dd>{selectedQuest.reward}</dd>
					</div>
				</dl>
				<ol class="steps">
					{#each selectedQuest.steps as step, index (index)}
						<li>
							<span class="step-index tabular">{index + 1}</span>
							<span>
								{step.text}
								<a href={router.buildHref('location', step.locationId)}
									>{findLocation(step.locationId)?.name}</a
								>
							</span>
						</li>
					{/each}
				</ol>
				<MiniMap
					routeIds={selectedQuest.steps.map((step) => step.locationId)}
					label={`Trasa zadania ${selectedQuest.name}`}
				/>
				<button
					type="button"
					class="btn primary"
					onclick={() => {
						router.navigate('atlas');
						mockupState.select(selectedQuest.id);
					}}
				>
					<MapIcon size={16} aria-hidden="true" /> Pokaż trasę na mapie
				</button>
			</article>
		{/if}
	</div>
</PageLayout>

<style>
	.head p {
		max-width: 60ch;
		margin-top: var(--s-2);
		color: var(--tekst-2);
	}

	.chapters {
		display: flex;
		gap: 6px;
		margin: var(--s-4) 0;
		overflow-x: auto;
		scrollbar-width: none;
	}

	.count {
		color: var(--tekst-3);
		font-size: var(--tx-xs);
	}

	.columns {
		display: grid;
		grid-template-columns: 320px minmax(0, 1fr);
		gap: var(--s-5);
		align-items: start;
	}

	.list {
		border: 1px solid var(--linia);
		border-radius: var(--r-panel);
		background: var(--kamien-1);
	}

	.list > li + li {
		border-top: 1px solid var(--linia);
	}

	.quest {
		display: flex;
		align-items: center;
		gap: var(--s-3);
		width: 100%;
		min-height: 60px;
		padding: var(--s-2) var(--s-3);
		border: 0;
		background: none;
		text-align: left;
		transition: background var(--czas-krotki) ease;
	}

	.quest:hover {
		background: var(--kamien-2);
	}

	.quest[aria-current='true'] {
		background: var(--mosiadz-tlo);
		box-shadow: inset 3px 0 0 var(--mosiadz);
	}

	.check {
		display: grid;
		place-items: center;
		flex: none;
		width: 22px;
		height: 22px;
		border: 1.5px solid var(--linia-mocna);
		border-radius: 50%;
	}

	.check.done {
		border-color: var(--oliwka);
		background: var(--oliwka-tlo);
		color: var(--oliwka);
	}

	.text {
		display: flex;
		flex-direction: column;
	}

	.name {
		font-weight: 500;
	}

	.meta {
		color: var(--tekst-2);
		font-size: var(--tx-xs);
	}

	.empty {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: var(--s-2);
		padding: var(--s-5) var(--s-4);
		color: var(--tekst-2);
	}

	.empty h2 {
		font-size: var(--tx-xl);
		color: var(--tekst);
	}

	.detail {
		display: flex;
		flex-direction: column;
		gap: var(--s-4);
		padding: var(--s-5);
	}

	.detail header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: var(--s-4);
		flex-wrap: wrap;
	}

	.kind {
		color: var(--kat-quest);
		font-size: var(--tx-sm);
	}

	.detail h2 {
		font-size: var(--tx-2xl);
	}

	.btn[aria-pressed='true'] {
		border-color: var(--oliwka);
		background: var(--oliwka-tlo);
		color: var(--oliwka);
	}

	.summary {
		font-family: var(--font-display);
		font-size: 1.375rem;
		font-style: italic;
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

	.steps {
		display: flex;
		flex-direction: column;
		gap: var(--s-3);
	}

	.steps li {
		display: flex;
		gap: var(--s-3);
	}

	.step-index {
		display: grid;
		place-items: center;
		flex: none;
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
