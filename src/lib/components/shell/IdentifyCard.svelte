<script lang="ts">
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
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
		class="material-leather material-leather-riveted fixed inset-x-0 bottom-(--bottom-nav-height) z-30 max-h-[50dvh] overflow-y-auto rounded-t-2xl p-4 pt-3 pr-1.5 md:top-[calc(var(--top-bar-height)+var(--gutter))] md:right-(--map-controls-width) md:bottom-auto md:left-auto md:max-h-[60dvh] md:w-68 md:rounded-md lg:w-80"
		aria-label="Informacje o obiekcie"
	>
		<div class="flex items-start justify-between gap-2">
			<div class="min-w-0 pt-1">
				<p class="text-xs text-muted-foreground">{feature.layerName}</p>
				<h3 class="font-serif text-xl leading-tight">{feature.title}</h3>
				<p class="text-sm text-muted-foreground">{feature.subtitle}</p>
			</div>
			<button
				class="grid size-11 shrink-0 place-items-center rounded-sm text-muted-foreground hover:bg-hover-surface hover:text-foreground"
				aria-label="Zamknij informacje o obiekcie"
				onclick={() => geoportal.closeFeatureIdentification()}
			>
				<XIcon class="size-4" />
			</button>
		</div>

		{#if feature.facts.length > 0}
			<dl class="mt-2.5 mr-2.5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
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

		{#if feature.encyclopediaUrl}
			<!-- eslint-disable svelte/no-navigation-without-resolve -- zewnętrzny adres Gothicpedii, nie ścieżka aplikacji -->
			<a
				class="mt-3 flex items-center gap-1.5 text-sm text-primary hover:underline"
				href={feature.encyclopediaUrl}
				target="_blank"
				rel="noopener noreferrer"
			>
				<ExternalLinkIcon class="size-4" />
				Zobacz na Gothicpedii
			</a>
			<!-- eslint-enable svelte/no-navigation-without-resolve -->
		{/if}
	</aside>
{/if}
