<script lang="ts">
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
	import XIcon from '@lucide/svelte/icons/x';
	import type { Attachment } from 'svelte/attachments';
	import { appState, geoportal } from '#lib/composition-root.js';

	function showPreview(modelFile: string): Attachment<HTMLElement> {
		return (container) => geoportal.showWorldModelPreview(container, modelFile);
	}

	function searchForIdentifiedFeature(query: string): void {
		geoportal.search(query);
		if (appState.activeToolId !== 'search') geoportal.selectTool('search');
		geoportal.closeFeatureIdentification();
	}
</script>

{#if appState.identifiedFeature}
	{@const feature = appState.identifiedFeature}
	<aside
		class="parchment-note-shadow fixed inset-x-1.5 bottom-[calc(var(--bottom-nav-height)+0.375rem)] z-30 md:top-[calc(var(--top-bar-height)+var(--gutter))] md:right-(--map-controls-width) md:bottom-auto md:left-auto md:w-68 lg:w-80"
		aria-label="Informacje o obiekcie"
	>
		<div class="parchment-note max-h-[50dvh] overflow-y-auto px-5 pt-5 pb-4 md:max-h-[60dvh]">
			<div class="flex items-start justify-between gap-2">
				<div class="min-w-0 pt-1">
					<p class="note-faded text-caption font-medium">{feature.layerName}</p>
					<h3 class="font-heading text-display break-words">{feature.title}</h3>
					<p class="note-faded font-serif italic">{feature.subtitle}</p>
				</div>
				<button
					class="note-faded -mt-2 -mr-3 grid size-11 shrink-0 place-items-center rounded-sm hover:bg-ink/10 hover:text-ink"
					aria-label="Zamknij informacje o obiekcie"
					onclick={() => geoportal.closeFeatureIdentification()}
				>
					<XIcon class="size-5" />
				</button>
			</div>

			{#if feature.modelFile}
				<div
					class="my-3 h-36 overflow-hidden rounded-sm border border-ink-faded/30"
					aria-label="Podgląd 3D: {feature.title}"
					role="img"
					{@attach showPreview(feature.modelFile)}
				></div>
			{/if}

			{#if feature.facts.length > 0}
				<dl class="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-0.5">
					{#each feature.facts as fact (fact.label)}
						<dt class="note-faded">{fact.label}</dt>
						<dd class="min-w-0 font-medium break-words">{fact.value}</dd>
					{/each}
				</dl>
			{/if}

			{#if feature.listTitle}
				<h4 class="note-faded mt-3 text-label font-medium">{feature.listTitle}</h4>
				<ul class="mt-1 font-serif">
					{#each feature.listItems as item, index (index)}
						<li class="border-t border-ink-faded/30 py-1">{item}</li>
					{/each}
				</ul>
			{/if}

			{#if feature.treasureSetCodes.length > 0}
				<h4 class="note-faded mt-3 text-label font-medium">Może zawierać (losowo)</h4>
				{#if feature.possibleItems.length > 0}
					<ul class="mt-1 font-serif">
						{#each feature.possibleItems as item, index (index)}
							<li class="border-t border-ink-faded/30 py-1">{item}</li>
						{/each}
					</ul>
				{:else}
					<p class="note-faded mt-1" role="status">Wczytuję możliwą zawartość…</p>
				{/if}
			{/if}

			{#if feature.searchQuery || feature.encyclopediaUrl}
				<hr class="note-rule my-3" />
			{/if}

			{#if feature.searchQuery}
				{@const query = feature.searchQuery}
				<button class="button-ink" onclick={() => searchForIdentifiedFeature(query)}>
					Pokaż wszystkie wystąpienia
				</button>
			{/if}

			{#if feature.encyclopediaUrl}
				<!-- eslint-disable svelte/no-navigation-without-resolve -- zewnętrzny adres Gothicpedii, nie ścieżka aplikacji -->
				<a
					class="mt-2 flex min-h-11 items-center gap-1.5 font-medium"
					href={feature.encyclopediaUrl}
					target="_blank"
					rel="noopener noreferrer"
				>
					<ExternalLinkIcon class="size-4" />
					Zobacz na Gothicpedii
					<span class="sr-only">(otwiera się w nowej karcie)</span>
				</a>
				<!-- eslint-enable svelte/no-navigation-without-resolve -->
			{/if}
		</div>
	</aside>
{/if}
