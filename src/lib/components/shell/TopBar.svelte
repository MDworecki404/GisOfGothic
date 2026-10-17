<script lang="ts">
	import DownloadIcon from '@lucide/svelte/icons/download';
	import SearchIcon from '@lucide/svelte/icons/search';
	import { appState, geoportal, installApp } from '#lib/composition-root.js';
	import AboutDialog from './AboutDialog.svelte';
	import BrandMark from './BrandMark.svelte';
	import PerformanceDialog from './PerformanceDialog.svelte';
	import WorldSwitcher, { type WorldSwitcherGame } from './WorldSwitcher.svelte';

	interface Props {
		games: readonly WorldSwitcherGame[];
		currentGameId: string;
		currentWorldId: string;
	}

	let { games, currentGameId, currentWorldId }: Props = $props();
	let searchInput: HTMLInputElement;

	function openSearchPanel(): void {
		if (appState.activeToolId !== 'search') geoportal.selectTool('search');
	}

	function selectFirstResultOnEnter(event: KeyboardEvent): void {
		const firstResult = appState.searchResults.at(0);
		if (event.key === 'Enter' && firstResult) geoportal.selectSearchEntry(firstResult.id);
	}

	function focusSearchOnShortcut(event: KeyboardEvent): void {
		if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
			event.preventDefault();
			searchInput.focus();
		}
	}
</script>

<svelte:window onkeydown={focusSearchOnShortcut} />

<header
	class="panel-stone fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-2 border-x-0 border-t-0 px-3 md:h-13 md:gap-4 md:px-4"
>
	<div class="flex shrink-0 items-center gap-2.5">
		<BrandMark />
		<span class="hidden font-heading text-[17px] tracking-[0.05em] text-primary lg:inline">
			GIS of Gothic
		</span>
	</div>

	<WorldSwitcher {games} {currentGameId} {currentWorldId} />

	<label
		class="mx-auto flex h-9 max-w-xl min-w-0 flex-1 items-center gap-2 rounded-sm border border-border bg-background/70 px-3 text-muted-foreground focus-within:border-primary/60"
	>
		<SearchIcon class="size-4 shrink-0" />
		<input
			bind:this={searchInput}
			class="min-w-0 flex-1 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:outline-none"
			placeholder="Szukaj przedmiotu lub postaci…"
			aria-label="Szukaj przedmiotu lub postaci"
			type="search"
			value={appState.searchQuery}
			oninput={(event) => geoportal.search(event.currentTarget.value)}
			onkeydown={selectFirstResultOnEnter}
			onfocus={openSearchPanel}
		/>
		<kbd class="hidden rounded-sm border border-border px-1.5 font-sans text-xs md:inline"
			>Ctrl K</kbd
		>
	</label>

	{#if appState.canInstallApp}
		<button
			class="flex shrink-0 items-center gap-1.5 rounded-sm border border-border px-2.5 py-1.5 text-sm text-muted-foreground hover:border-primary/60 hover:text-foreground"
			title="Zainstaluj GIS of Gothic jako aplikację na tym urządzeniu"
			onclick={() => void installApp()}
		>
			<DownloadIcon class="size-4" />
			<span class="hidden md:inline">Zainstaluj</span>
			<span class="sr-only md:hidden">Zainstaluj aplikację</span>
		</button>
	{/if}

	<PerformanceDialog />
	<AboutDialog />
</header>
