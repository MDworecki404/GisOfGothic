<script lang="ts">
	import EllipsisIcon from '@lucide/svelte/icons/ellipsis';
	import LayoutGridIcon from '@lucide/svelte/icons/layout-grid';
	import { router } from '../state/router.svelte.js';
	import { NAVIGATION_ITEMS } from './navigation.js';
	import { activateNavigationItem, isNavigationItemActive } from './navigation-actions.js';

	let moreOpen = $state(false);

	const phoneItems = NAVIGATION_ITEMS.filter((item) => item.onPhoneBar);
	const moreItems = NAVIGATION_ITEMS.filter((item) => !item.onPhoneBar);
</script>

{#if moreOpen}
	<button type="button" class="scrim" aria-label="Zamknij menu" onclick={() => (moreOpen = false)}
	></button>
	<div class="more cartouche" role="menu" aria-label="Więcej narzędzi">
		{#each moreItems as item (item.id)}
			{@const Icon = item.icon}
			<button
				type="button"
				role="menuitem"
				class="more-item"
				onclick={() => {
					moreOpen = false;
					activateNavigationItem(item);
				}}
			>
				<Icon size={20} strokeWidth={1.6} aria-hidden="true" />
				<span>{item.label}</span>
			</button>
		{/each}
		<a
			class="more-item"
			role="menuitem"
			href={router.buildHref('index')}
			onclick={() => (moreOpen = false)}
		>
			<LayoutGridIcon size={20} strokeWidth={1.6} aria-hidden="true" />
			<span>Spis makiet</span>
		</a>
	</div>
{/if}

<nav class="bottom-nav" aria-label="Główna nawigacja">
	{#each phoneItems as item (item.id)}
		{@const Icon = item.icon}
		<button
			type="button"
			class="nav-item"
			aria-current={isNavigationItemActive(item) ? 'page' : undefined}
			onclick={() => activateNavigationItem(item)}
		>
			<Icon size={22} strokeWidth={1.6} aria-hidden="true" />
			<span>{item.label}</span>
		</button>
	{/each}
	<button
		type="button"
		class="nav-item"
		aria-haspopup="menu"
		aria-expanded={moreOpen}
		onclick={() => (moreOpen = !moreOpen)}
	>
		<EllipsisIcon size={22} strokeWidth={1.6} aria-hidden="true" />
		<span>Więcej</span>
	</button>
</nav>

<style>
	.bottom-nav {
		display: none;
	}

	@media (max-width: 47.99rem) {
		.bottom-nav {
			grid-area: nav;
			display: grid;
			grid-template-columns: repeat(5, 1fr);
			background: var(--antracyt);
			border-top: 1px solid var(--mosiadz-ciemny);
			padding-bottom: env(safe-area-inset-bottom);
			z-index: 60;
		}
	}

	.nav-item {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 2px;
		min-height: 56px;
		border: 0;
		background: none;
		color: var(--tekst-2);
		font-size: 0.6875rem;
	}

	.nav-item[aria-current='page'] {
		color: var(--mosiadz-jasny);
	}

	.nav-item[aria-current='page']::before {
		content: '';
		position: absolute;
		top: 0;
		width: 28px;
		height: 3px;
		border-radius: 0 0 2px 2px;
		background: var(--mosiadz);
	}

	.scrim {
		position: fixed;
		inset: 0;
		z-index: 70;
		border: 0;
		background: var(--scrim);
	}

	.more {
		position: fixed;
		right: 12px;
		bottom: 68px;
		z-index: 80;
		display: flex;
		flex-direction: column;
		min-width: 200px;
		padding: 6px;
	}

	.more-item {
		display: flex;
		align-items: center;
		gap: 12px;
		min-height: var(--cel-dotyku);
		padding: 0 12px;
		border: 0;
		border-radius: var(--r-ostry);
		background: none;
		color: var(--tekst);
		text-align: left;
		text-decoration: none;
		font-size: var(--tx-md);
	}

	.more-item:hover {
		background: var(--kamien-2);
	}
</style>
