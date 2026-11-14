<script lang="ts">
	import DownloadIcon from '@lucide/svelte/icons/download';
	import SearchIcon from '@lucide/svelte/icons/search';
	import { MediaQuery } from 'svelte/reactivity';
	import { appState, geoportal, installApp, mobileSheet } from '#lib/composition-root.js';
	import AboutDialog from './AboutDialog.svelte';
	import BrandMark from './BrandMark.svelte';
	import CopyViewLinkButton from './CopyViewLinkButton.svelte';
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
	class="pointer-events-none fixed inset-x-0 top-0 z-40 flex items-start gap-2 p-(--edge-inset) md:gap-4"
>
	<div
		class="material-leather pointer-events-auto flex h-14 shrink-0 items-center gap-1.5 pr-1 pl-3 md:h-16 md:gap-3 md:pr-3 md:pl-4"
		data-testid="header-title"
		data-map-obstacle
	>
		<span class="hidden md:inline-flex"><BrandMark /></span>
		<WorldSwitcher {games} {currentGameId} {currentWorldId} />
	</div>

	<div
		class="material-leather pointer-events-auto mx-auto flex h-14 max-w-xl min-w-0 flex-1 items-center [--cut:9px] md:h-16"
		data-testid="header-search"
		data-map-obstacle
	>
		<label
			class="flex h-full min-w-0 flex-1 items-center gap-2 px-3 text-muted-foreground focus-within:text-foreground md:px-4"
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
	</div>

	<div
		class="material-leather pointer-events-auto flex h-14 shrink-0 items-center gap-0.5 px-1.5 [--cut:9px] md:h-16 md:gap-1 md:px-2"
		data-testid="header-actions"
		data-map-obstacle
	>
		<div class="hidden shrink-0 lg:block">
			<CopyViewLinkButton
				class="min-h-11 rounded-sm px-3 text-label text-muted-foreground hover:bg-hover-surface hover:text-hover"
				label="Kopiuj link"
			/>
		</div>

		{#if appState.canInstallApp}
			<button
				class="hidden min-h-11 shrink-0 items-center gap-1.5 rounded-sm px-3 text-label text-muted-foreground hover:bg-hover-surface hover:text-hover md:flex"
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
	</div>
</header>
