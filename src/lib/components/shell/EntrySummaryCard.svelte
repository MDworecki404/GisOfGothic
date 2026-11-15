<script lang="ts">
	import XIcon from '@lucide/svelte/icons/x';
	import { appState, geoportal } from '#lib/composition-root.js';
	import CopyViewLinkButton from './CopyViewLinkButton.svelte';

	const MAXIMUM_FACTS = 3;

	const entry = $derived(appState.selectedEntry);
	const isVisible = $derived(
		entry !== null && appState.activeToolId !== 'search' && appState.identifiedFeature === null
	);
	const collectedPlaceKeys = $derived(appState.collectedPlaceKeysOfSelectedEntry);
	const collectiblePlaceCount = $derived(
		entry?.places.filter((place) => place.isCollectible).length ?? 0
	);
	const collectedPlaceCount = $derived(
		entry?.places.filter((place) => place.isCollectible && collectedPlaceKeys.has(place.key))
			.length ?? 0
	);
</script>

{#if entry && isVisible}
	<aside
		class="material-leather fixed inset-x-1.5 bottom-[calc(var(--bottom-nav-height)+var(--sheet-occupied-height)+0.375rem)] z-30 md:inset-x-auto md:top-[calc(var(--top-bar-height)+var(--gutter))] md:right-(--map-controls-width) md:bottom-auto md:w-76"
		aria-label="Wybrany wpis"
	>
		<div class="px-5 pt-4 pb-4">
			<div class="flex items-start justify-between gap-2">
				<div class="min-w-0">
					<h3 class="font-heading text-display leading-tight">{entry.name}</h3>
					<p class="mt-0.5 text-sm text-muted-foreground">
						{entry.categoryLabel} · <span class="text-caption">{entry.code}</span>
					</p>
				</div>
				<button
					class="-mt-2 -mr-3 grid size-11 shrink-0 place-items-center rounded-sm text-muted-foreground hover:bg-hover-surface hover:text-hover"
					aria-label="Zamknij kartę wpisu"
					onclick={() => geoportal.clearSearchSelection()}
				>
					<XIcon class="size-4" />
				</button>
			</div>

			{#if appState.selectedCharacterNow}
				<p class="mt-3 text-sm" role="status">
					<span class="text-caption text-muted-foreground tabular-nums">
						Teraz · {appState.timeOfDayLabel}
					</span>
					<span class="block text-primary">{appState.selectedCharacterNow.activity}</span>
				</p>
			{/if}

			{#if entry.facts.length > 0}
				<dl class="mt-3 flex flex-wrap gap-x-5 gap-y-2 tabular-nums">
					{#each entry.facts.slice(0, MAXIMUM_FACTS) as fact (fact.label)}
						<div class="flex flex-col-reverse">
							<dt class="text-caption text-muted-foreground">{fact.label}</dt>
							<dd class="text-xl text-primary">{fact.value}</dd>
						</div>
					{/each}
				</dl>
			{/if}

			{#if collectiblePlaceCount > 0}
				<p class="mt-3 text-sm tabular-nums" role="status">
					Zebrano {collectedPlaceCount} z {collectiblePlaceCount} miejsc
				</p>
			{/if}

			<div class="mt-4 flex flex-col gap-2">
				{#if entry.type === 'quest'}
					<button
						class={appState.isSelectedQuestCollected ? 'button-ochre' : 'button-quiet'}
						aria-pressed={appState.isSelectedQuestCollected}
						onclick={() => geoportal.toggleCollectedStateOfSelectedQuest()}
					>
						{appState.isSelectedQuestCollected ? 'Quest wykonany' : 'Oznacz jako wykonany'}
					</button>
				{/if}
				<button class="button-ochre" onclick={() => geoportal.selectTool('search')}>
					Otwórz w Księdze
				</button>
				<CopyViewLinkButton class="button-iron" />
			</div>
		</div>
	</aside>
{/if}
