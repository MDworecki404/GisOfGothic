<script lang="ts">
	import BookmarkIcon from '@lucide/svelte/icons/bookmark';
	import ExternalIcon from '@lucide/svelte/icons/arrow-up-right';
	import LinkIcon from '@lucide/svelte/icons/link-2';
	import { findCategoryDefinition } from '../data/categories.js';
	import type { Entry } from '../data/types.js';
	import { findCharacter, findLocation, listEntriesByIds } from '../data/world.js';
	import { mockupState } from '../state/mockup-state.svelte.js';
	import { router } from '../state/router.svelte.js';
	import CategoryIcon from './CategoryIcon.svelte';
	import RelatedList from './RelatedList.svelte';
	import RoutineBar from './RoutineBar.svelte';
	import Scene from './Scene.svelte';

	interface Props {
		entry: Entry;
	}

	let { entry }: Props = $props();

	const isSaved = $derived(mockupState.savedIds.includes(entry.id));
	const categoryLabel = $derived(findCategoryDefinition(entry.category).label);
	const kindLabel = $derived(
		entry.category === 'location'
			? entry.kindLabel
			: entry.category === 'character'
				? `${entry.role}, ${entry.guild}`
				: entry.category === 'item'
					? entry.kindLabel
					: entry.category === 'monster'
						? `Zagrożenie: ${entry.danger}`
						: `Rozdział ${entry.chapter}`
	);
	const parentLocation = $derived(
		entry.category === 'character' || entry.category === 'item' || entry.category === 'monster'
			? findLocation(entry.locationId)
			: undefined
	);

	function openFullCard(): void {
		if (entry.category === 'location') {
			router.navigate('location', entry.id);
		} else if (entry.category === 'character') {
			router.navigate('character', entry.id);
		} else if (entry.category === 'quest') {
			router.navigate('quests', entry.id);
		}
	}

	function copyLink(): void {
		void navigator.clipboard?.writeText(window.location.href);
		mockupState.showToast('Skopiowano link do wpisu');
	}
</script>

<article class="detail">
	{#if entry.category === 'location'}
		<div class="hero"><Scene kind={entry.scene} label={`Ilustracja: ${entry.name}`} /></div>
	{/if}

	<header>
		{#if entry.category !== 'location'}
			<span class="seal"><CategoryIcon category={entry.category} size={22} /></span>
		{/if}
		<div class="titles">
			<p class="kind">{categoryLabel}, {kindLabel}</p>
			<h2>{entry.name}</h2>
		</div>
	</header>

	<div class="actions">
		<button
			type="button"
			class="btn"
			aria-pressed={isSaved}
			onclick={() => mockupState.toggleSaved(entry.id)}
		>
			<BookmarkIcon size={16} fill={isSaved ? 'currentColor' : 'none'} aria-hidden="true" />
			{isSaved ? 'Zapisano' : 'Zapisz'}
		</button>
		{#if entry.category === 'location' || entry.category === 'character' || entry.category === 'quest'}
			<button type="button" class="btn primary" onclick={openFullCard}>
				Otwórz kartę <ExternalIcon size={16} aria-hidden="true" />
			</button>
		{/if}
		<button
			type="button"
			class="btn icon ghost"
			aria-label="Kopiuj link do wpisu"
			onclick={copyLink}><LinkIcon size={18} /></button
		>
	</div>

	<p class="summary">{entry.summary}</p>

	{#if entry.category === 'location'}
		{#each entry.description as paragraph (paragraph)}
			<p class="body">{paragraph}</p>
		{/each}
		<dl class="facts">
			{#each entry.facts as fact (fact.label)}
				<div>
					<dt>{fact.label}</dt>
					<dd>{fact.value}</dd>
				</div>
			{/each}
		</dl>
		<RelatedList
			title="Postacie"
			entries={listEntriesByIds(entry.characterIds)}
			onopen={(id) => mockupState.select(id)}
		/>
		<RelatedList
			title="Przedmioty"
			entries={listEntriesByIds(entry.itemIds)}
			onopen={(id) => mockupState.select(id)}
		/>
		<RelatedList
			title="Potwory"
			entries={listEntriesByIds(entry.monsterIds)}
			onopen={(id) => mockupState.select(id)}
		/>
		<RelatedList
			title="Zadania"
			entries={listEntriesByIds(entry.questIds)}
			onopen={(id) => mockupState.select(id)}
		/>
	{:else if entry.category === 'character'}
		<p class="body">{entry.description}</p>
		<dl class="facts">
			{#each entry.facts as fact (fact.label)}
				<div>
					<dt>{fact.label}</dt>
					<dd>{fact.value}</dd>
				</div>
			{/each}
		</dl>
		<section>
			<h3>Rutyna dnia</h3>
			<RoutineBar routine={entry.routine} currentHour={mockupState.hour} />
		</section>
		<RelatedList
			title="Zadania"
			entries={listEntriesByIds(entry.questIds)}
			onopen={(id) => mockupState.select(id)}
		/>
		<RelatedList
			title="Przy sobie"
			entries={listEntriesByIds(entry.itemIds)}
			onopen={(id) => mockupState.select(id)}
		/>
	{:else if entry.category === 'quest'}
		<dl class="facts">
			<div>
				<dt>Zleca</dt>
				<dd>{findCharacter(entry.giverId)?.name ?? 'Nieznany'}</dd>
			</div>
			<div>
				<dt>Rozdział</dt>
				<dd>{entry.chapter}</dd>
			</div>
			<div>
				<dt>Nagroda</dt>
				<dd>{entry.reward}</dd>
			</div>
		</dl>
		<section>
			<h3>Kroki</h3>
			<ol class="steps">
				{#each entry.steps as step, index (index)}
					<li>
						<span class="step-index tabular">{index + 1}</span>
						<span>
							{step.text}
							<button
								type="button"
								class="where"
								onclick={() => mockupState.select(step.locationId)}
							>
								{findLocation(step.locationId)?.name}
							</button>
						</span>
					</li>
				{/each}
			</ol>
			<p class="note">Trasa zadania jest zaznaczona na mapie linią przerywaną.</p>
		</section>
	{:else}
		{#if parentLocation}
			<p class="body">
				Znajdziesz to w miejscu
				<button type="button" class="where" onclick={() => mockupState.select(parentLocation.id)}
					>{parentLocation.name}</button
				>.
			</p>
		{/if}
	{/if}

	{#if entry.category === 'character' && parentLocation}
		<p class="body">
			Zwykle przebywa w miejscu
			<button type="button" class="where" onclick={() => mockupState.select(parentLocation.id)}
				>{parentLocation.name}</button
			>.
		</p>
	{/if}
</article>

<style>
	.detail {
		display: flex;
		flex-direction: column;
		gap: var(--s-4);
	}

	.hero {
		margin: calc(var(--s-4) * -1) calc(var(--s-4) * -1) 0;
		aspect-ratio: 400 / 190;
		border-bottom: 1px solid var(--mosiadz-ciemny);
		overflow: hidden;
	}

	header {
		display: flex;
		align-items: center;
		gap: var(--s-3);
	}

	.seal {
		display: grid;
		place-items: center;
		flex: none;
		width: 52px;
		height: 52px;
		border: 1px solid var(--mosiadz);
		border-radius: 50%;
		box-shadow:
			inset 0 0 0 3px var(--kamien-1),
			inset 0 0 0 4px var(--mosiadz-ciemny);
	}

	.kind {
		color: var(--tekst-2);
		font-size: var(--tx-sm);
	}

	h2 {
		font-size: var(--tx-2xl);
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--s-2);
	}

	.btn[aria-pressed='true'] {
		border-color: var(--mosiadz);
		background: var(--mosiadz-tlo);
		color: var(--mosiadz-jasny);
	}

	.summary {
		font-family: var(--font-display);
		font-size: 1.3125rem;
		font-style: italic;
		line-height: 1.3;
		color: var(--tekst);
	}

	.body {
		max-width: 62ch;
		color: var(--tekst-2);
		line-height: 1.6;
	}

	.facts {
		display: grid;
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

	h3 {
		margin-bottom: var(--s-2);
		font-size: 1.125rem;
		color: var(--mosiadz-jasny);
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

	.where {
		padding: 0;
		border: 0;
		background: none;
		color: var(--mosiadz-jasny);
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	.where:hover {
		color: var(--tekst);
	}

	.note {
		margin-top: var(--s-3);
		color: var(--tekst-2);
		font-size: var(--tx-xs);
	}
</style>
