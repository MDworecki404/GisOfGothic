<script lang="ts">
	import FlagIcon from '@lucide/svelte/icons/flag';
	import GemIcon from '@lucide/svelte/icons/gem';
	import MapPinIcon from '@lucide/svelte/icons/map-pin';
	import UserIcon from '@lucide/svelte/icons/user';
	import XIcon from '@lucide/svelte/icons/x';
	import { appState, geoportal } from '#lib/composition-root.js';
	import CopyViewLinkButton from './CopyViewLinkButton.svelte';
	import PassageTravelButton from './PassageTravelButton.svelte';

	const MAXIMUM_FACTS = 3;
	const SEAL_ICONS = { character: UserIcon, item: GemIcon, quest: FlagIcon, location: MapPinIcon };

	const entry = $derived(appState.selectedEntry);
	const SealIcon = $derived(entry ? SEAL_ICONS[entry.type] : UserIcon);
	const isVisible = $derived(
		entry !== null && appState.activeToolId !== 'search' && appState.identifiedFeature === null
	);
	const guide = $derived(
		entry?.type === 'quest' && appState.questDetails?.entryId === entry.id
			? (appState.questDetails.details?.guide ?? null)
			: null
	);
	const guideStep = $derived(
		appState.questGuide.isShown && guide ? guide[appState.questGuide.stepIndex] : undefined
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
			<div class="flex items-start justify-between gap-3">
				<span class="entry-seal" aria-hidden="true"><SealIcon class="size-5" /></span>
				<div class="min-w-0 flex-1">
					<h3 class="font-heading text-title leading-tight [overflow-wrap:anywhere]">
						{entry.name}
					</h3>
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

			{#if guide && guideStep}
				<div class="mt-3 text-sm" role="status">
					<p class="text-caption text-muted-foreground tabular-nums">
						Przewodnik · krok {guideStep.number} z {guide.length}
					</p>
					<p class="font-medium text-primary">{guideStep.placeLabel}</p>
					{#if guideStep.texts[0]}
						<p class="leading-snug">{guideStep.texts[0]}</p>
					{/if}
					<div class="mt-2 flex gap-2">
						<button
							class="button-quiet"
							disabled={appState.questGuide.stepIndex === 0}
							onclick={() => geoportal.moveQuestGuideStep(-1)}
						>
							Wstecz
						</button>
						<button
							class="button-ochre"
							disabled={appState.questGuide.stepIndex === guide.length - 1}
							onclick={() => geoportal.moveQuestGuideStep(1)}
						>
							Dalej
						</button>
						<button class="button-quiet" onclick={() => geoportal.toggleQuestGuide()}>
							Ukryj trasę
						</button>
					</div>
				</div>
			{/if}

			{#if entry.facts.length > 0 && !guideStep}
				<dl class="mt-3 flex flex-wrap gap-x-5 gap-y-2 tabular-nums">
					{#each entry.facts.slice(0, MAXIMUM_FACTS) as fact (fact.label)}
						<div class="flex max-w-full min-w-0 flex-col-reverse">
							<dt class="text-caption text-muted-foreground">{fact.label}</dt>
							<dd class="min-w-0 text-lead font-medium [overflow-wrap:anywhere] text-primary">
								{fact.value}
							</dd>
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
				{#if entry.type === 'quest' && !guideStep}
					<button
						class={appState.isSelectedQuestCollected ? 'button-ochre' : 'button-quiet'}
						aria-pressed={appState.isSelectedQuestCollected}
						onclick={() => geoportal.toggleCollectedStateOfSelectedQuest()}
					>
						{appState.isSelectedQuestCollected ? 'Quest wykonany' : 'Oznacz jako wykonany'}
					</button>
				{/if}
				{#if entry.passage}
					<PassageTravelButton passage={entry.passage} class="button-ochre" />
				{/if}
				<button class="button-ochre" onclick={() => geoportal.selectTool('search')}>
					Otwórz w Księdze
				</button>
				<CopyViewLinkButton class="button-iron" />
			</div>
		</div>
	</aside>
{/if}
