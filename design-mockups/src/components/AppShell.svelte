<script lang="ts">
	import type { Snippet } from 'svelte';
	import { mockupState } from '../state/mockup-state.svelte.js';
	import MobileNav from './MobileNav.svelte';
	import SearchPalette from './SearchPalette.svelte';
	import ToolRail from './ToolRail.svelte';
	import TopBar from './TopBar.svelte';

	interface Props {
		showFilters?: boolean;
		children: Snippet;
	}

	let { showFilters = true, children }: Props = $props();

	function handleGlobalKeyDown(event: KeyboardEvent): void {
		const target = event.target;
		const isTyping =
			target instanceof HTMLInputElement ||
			target instanceof HTMLTextAreaElement ||
			target instanceof HTMLSelectElement;
		if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
			event.preventDefault();
			mockupState.openSearch();
		} else if (event.key === '/' && !isTyping && !mockupState.searchOpen) {
			event.preventDefault();
			mockupState.openSearch();
		} else if (event.key === 'Escape' && !mockupState.searchOpen) {
			if (mockupState.selectedId) {
				mockupState.select(null);
			} else if (mockupState.tool) {
				mockupState.tool = null;
			}
		}
	}
</script>

<svelte:window onkeydown={handleGlobalKeyDown} />

<div class="shell">
	<a class="skip" href="#main-content">Przejdź do treści</a>
	<TopBar {showFilters} />
	<ToolRail />
	<main id="main-content">
		{@render children()}
	</main>
	<MobileNav />
	<SearchPalette />
	<div class="toast-region" role="status" aria-live="polite">
		{#if mockupState.toastMessage}
			<p class="toast">{mockupState.toastMessage}</p>
		{/if}
	</div>
</div>

<style>
	.shell {
		display: grid;
		grid-template-columns: var(--szyna) 1fr;
		grid-template-rows: var(--pasek-gorny) 1fr;
		grid-template-areas:
			'top top'
			'rail main';
		height: 100dvh;
		background: var(--grafit);
	}

	main {
		grid-area: main;
		position: relative;
		min-width: 0;
		min-height: 0;
		overflow: hidden;
	}

	.skip {
		position: absolute;
		left: 8px;
		top: -60px;
		z-index: 200;
		padding: 10px 16px;
		border-radius: var(--r-ostry);
		background: var(--mosiadz);
		color: var(--na-mosiadzu);
		font-weight: 600;
	}

	.skip:focus {
		top: 8px;
	}

	.toast-region {
		position: fixed;
		left: 50%;
		bottom: 28px;
		z-index: 150;
		translate: -50% 0;
		pointer-events: none;
	}

	.toast {
		padding: 10px 18px;
		border: 1px solid var(--mosiadz-ciemny);
		border-radius: var(--r-ostry);
		background: var(--kamien-2);
		box-shadow: var(--cien-panelu);
		font-size: var(--tx-sm);
		animation: toast-in var(--czas-sredni) var(--ruch);
	}

	@keyframes toast-in {
		from {
			opacity: 0;
			translate: 0 8px;
		}
	}

	@media (max-width: 47.99rem) {
		.shell {
			grid-template-columns: 1fr;
			grid-template-rows: var(--pasek-gorny) 1fr auto;
			grid-template-areas:
				'top'
				'main'
				'nav';
		}

		.toast-region {
			bottom: 140px;
		}
	}
</style>
