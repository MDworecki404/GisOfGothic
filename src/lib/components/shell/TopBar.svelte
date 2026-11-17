<script lang="ts">
	import DownloadIcon from '@lucide/svelte/icons/download';
	import SearchIcon from '@lucide/svelte/icons/search';
	import { MediaQuery } from 'svelte/reactivity';
	import { appState, geoportal, installApp } from '#lib/composition-root.js';
	import { isKeyboardTargetUsingKeysItself } from '#lib/services/input/keyboard-focus-guard.js';
	import AboutDialog from './AboutDialog.svelte';
	import BrandMark from './BrandMark.svelte';
	import CopyViewLinkButton from './CopyViewLinkButton.svelte';
	import MoreMenu from './MoreMenu.svelte';
	import ShortcutsDialog from './ShortcutsDialog.svelte';
	import PerformanceDialog from './PerformanceDialog.svelte';
	import ThemeToggle from './ThemeToggle.svelte';
	import WorldSwitcher, { type WorldSwitcherGame } from './WorldSwitcher.svelte';

	interface Props {
		games: readonly WorldSwitcherGame[];
		currentGameId: string;
		currentWorldId: string;
	}

	let { games, currentGameId, currentWorldId }: Props = $props();
	let isPerformanceOpen = $state(false);
	let isAboutOpen = $state(false);
	let isShortcutsOpen = $state(false);

	const isPhone = new MediaQuery('max-width: 767px');

	function openBook(): void {
		if (appState.activeToolId !== 'search') geoportal.selectTool('search');
	}

	function openShortcutsFromAbout(): void {
		isAboutOpen = false;
		isShortcutsOpen = true;
	}

	function openShortcutsOnQuestionMark(event: KeyboardEvent): void {
		if (event.key === '?' && !isKeyboardTargetUsingKeysItself(event.target)) {
			event.preventDefault();
			isShortcutsOpen = true;
		}
	}
</script>

<svelte:window onkeydown={openShortcutsOnQuestionMark} />

<header
	class="top-bar pointer-events-auto fixed inset-x-0 top-0 z-40 flex items-center gap-2 px-(--gutter) md:gap-4 md:px-4"
	data-testid="header-bar"
>
	<div class="flex shrink-0 items-center gap-1.5 md:gap-3" data-testid="header-title">
		<span class="hidden items-center gap-2.5 md:inline-flex">
			<BrandMark />
			<span class="hidden font-heading text-display leading-none xl:inline">GIS of Gothic</span>
		</span>
		<WorldSwitcher {games} {currentGameId} {currentWorldId} />
	</div>

	<div class="mx-auto flex max-w-xl min-w-0 flex-1 items-center" data-testid="header-search">
		<button
			class="field flex min-w-0 flex-1 items-center gap-2 text-left text-muted-foreground hover:text-foreground"
			aria-label="Szukaj przedmiotu lub postaci"
			onclick={openBook}
		>
			<SearchIcon class="size-4 shrink-0" />
			<span class="min-w-0 flex-1 truncate">
				{isPhone.current ? 'Szukaj…' : 'Szukaj przedmiotu lub postaci…'}
			</span>
			<kbd class="hidden rounded-sm border border-border px-1.5 font-sans text-caption md:inline"
				>Ctrl K</kbd
			>
		</button>
	</div>

	<div class="flex shrink-0 items-center gap-0.5 md:gap-1" data-testid="header-actions">
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

		<ThemeToggle
			class="hidden size-11 shrink-0 place-items-center rounded-sm text-muted-foreground hover:bg-hover-surface hover:text-hover md:grid"
		/>
		<PerformanceDialog bind:open={isPerformanceOpen} />
		<AboutDialog bind:open={isAboutOpen} onOpenShortcuts={openShortcutsFromAbout} />
		<ShortcutsDialog bind:open={isShortcutsOpen} />
		<MoreMenu
			canInstallApp={appState.canInstallApp}
			onInstallApp={() => void installApp()}
			onOpenPerformance={() => (isPerformanceOpen = true)}
			onOpenAbout={() => (isAboutOpen = true)}
		/>
	</div>
</header>
