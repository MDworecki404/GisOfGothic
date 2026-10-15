<script lang="ts">
	import XIcon from '@lucide/svelte/icons/x';
	import { appState, geoportal } from '#lib/composition-root.js';

	function searchForIdentifiedFeature(query: string): void {
		geoportal.search(query);
		if (appState.activeToolId !== 'search') geoportal.selectTool('search');
		geoportal.closeFeatureIdentification();
	}
</script>

{#if appState.identifiedFeature}
	{@const feature = appState.identifiedFeature}
	<aside
		class="panel-stone fixed top-[calc(3.5rem+10px)] right-16 left-2.5 z-20 max-h-[40dvh] overflow-y-auto rounded-sm p-3.5 md:top-[calc(3.25rem+14px)] md:right-22 md:left-auto md:max-h-[60dvh] md:w-80"
		aria-label="Informacje o obiekcie"
	>
		<div class="flex items-start justify-between gap-2">
			<div class="min-w-0">
				<p class="text-xs text-muted-foreground">{feature.layerName}</p>
				<h3 class="font-serif text-xl leading-tight">{feature.title}</h3>
				<p class="text-sm text-muted-foreground">{feature.subtitle}</p>
			</div>
			<button
				class="grid size-8 shrink-0 place-items-center rounded-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
				aria-label="Zamknij informacje o obiekcie"
				onclick={() => geoportal.closeFeatureIdentification()}
			>
				<XIcon class="size-4" />
			</button>
		</div>

		{#if feature.facts.length > 0}
			<dl class="mt-2.5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
				{#each feature.facts as fact (fact.label)}
					<dt class="text-muted-foreground">{fact.label}</dt>
					<dd class="min-w-0 break-words">{fact.value}</dd>
				{/each}
			</dl>
		{/if}

		{#if feature.listTitle}
			<h4 class="mt-3 text-sm text-muted-foreground">{feature.listTitle}</h4>
			<ul class="mt-1 text-sm">
				{#each feature.listItems as item, index (index)}
					<li class="border-t border-border/60 py-1">{item}</li>
				{/each}
			</ul>
		{/if}

		{#if feature.searchQuery}
			{@const query = feature.searchQuery}
			<button
				class="mt-3 rounded-sm border border-border px-3 py-1.5 text-sm hover:border-primary/60"
				onclick={() => searchForIdentifiedFeature(query)}
			>
				Pokaż wszystkie wystąpienia
			</button>
		{/if}
	</aside>
{/if}
