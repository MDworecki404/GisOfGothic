<script lang="ts">
	import DownloadIcon from '@lucide/svelte/icons/download';
	import SearchIcon from '@lucide/svelte/icons/search';
	import { MediaQuery } from 'svelte/reactivity';
	import { appState, geoportal, installApp, mobileSheet } from '#lib/composition-root.js';
	import AboutDialog from './AboutDialog.svelte';
	import BrandMark from './BrandMark.svelte';
	import MoreMenu from './MoreMenu.svelte';
	import PerformanceDialog from './PerformanceDialog.svelte';
	import WorldSwitcher, { type WorldSwitcherGame } from './WorldSwitcher.svelte';

	interface Props {
		games: readonly WorldSwitcherGame[];
		currentGameId: string;
		currentWorldId: string;
	}

	let { games, currentGameId, currentWorldId }: Props = $props();
	let searchInput: HTMLInputElement;
	let isPerformanceOpen = $state(false);
	let isAboutOpen = $state(false);

	const isPhone = new MediaQuery('max-width: 767px');

	function openSearchPanel(): void {
		if (appState.activeToolId !== 'search') geoportal.selectTool('search');
		else mobileSheet.expandIfCollapsed();
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
	class="material-leather fixed inset-x-0 top-0 z-40 flex h-(--top-bar-height) items-center gap-1.5 border-x-0 border-t-0 pr-1 pl-2 md:gap-4 md:px-4"
>
	<div class="hidden shrink-0 items-center gap-2.5 md:flex">
		<BrandMark />
		<span class="hidden font-heading text-lead text-primary lg:inline"> GIS of Gothic </span>
	</div>

	<WorldSwitcher {games} {currentGameId} {currentWorldId} />

	<label
		class="mx-auto flex h-11 max-w-xl min-w-0 flex-1 items-center gap-2 rounded-md border border-iron bg-background/80 px-3 text-muted-foreground shadow-well focus-within:border-ore focus-within:shadow-[var(--shadow-well),var(--glow-ore)] md:h-10"
	>
		<SearchIcon class="size-4 shrink-0" />
		<input
			bind:this={searchInput}
			class="min-w-0 flex-1 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:outline-none"
			placeholder={isPhone.current ? 'Szukaj…' : 'Szukaj przedmiotu lub postaci…'}
			aria-label="Szukaj przedmiotu lub postaci"
			type="search"
			value={appState.searchQuery}
			oninput={(event) => geoportal.search(event.currentTarget.value)}
			onkeydown={selectFirstResultOnEnter}
			onfocus={openSearchPanel}
		/>
		<kbd class="hidden rounded-sm border border-border px-1.5 font-sans text-caption md:inline"
			>Ctrl K</kbd
		>
	</label>

	{#if appState.canInstallApp}
		<button
			class="hidden min-h-11 shrink-0 items-center gap-1.5 rounded-sm border border-border px-3 text-label text-muted-foreground hover:border-torch/60 hover:text-foreground md:flex"
			title="Zainstaluj GIS of Gothic jako aplikację na tym urządzeniu"
			onclick={() => void installApp()}
		>
			<DownloadIcon class="size-4" />
			Zainstaluj
		</button>
	{/if}

	<PerformanceDialog bind:open={isPerformanceOpen} />
	<AboutDialog bind:open={isAboutOpen} />
	<MoreMenu
		canInstallApp={appState.canInstallApp}
		onInstallApp={() => void installApp()}
		onOpenPerformance={() => (isPerformanceOpen = true)}
		onOpenAbout={() => (isAboutOpen = true)}
	/>
</header>
