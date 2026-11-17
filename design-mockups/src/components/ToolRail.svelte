<script lang="ts">
	import LayoutGridIcon from '@lucide/svelte/icons/layout-grid';
	import { router } from '../state/router.svelte.js';
	import { NAVIGATION_ITEMS } from './navigation.js';
	import { activateNavigationItem, isNavigationItemActive } from './navigation-actions.js';

	const mapItems = NAVIGATION_ITEMS.filter((item) => item.group === 'map');
	const bookItems = NAVIGATION_ITEMS.filter((item) => item.group === 'book');
</script>

<nav class="rail" aria-label="Narzędzia">
	<ul>
		{#each mapItems as item (item.id)}
			{@const Icon = item.icon}
			<li>
				<button
					type="button"
					class="rail-item"
					aria-current={isNavigationItemActive(item) && item.action.kind !== 'tool'
						? 'page'
						: undefined}
					aria-pressed={item.action.kind === 'tool' ? isNavigationItemActive(item) : undefined}
					onclick={() => activateNavigationItem(item)}
				>
					<Icon size={20} strokeWidth={1.6} aria-hidden="true" />
					<span>{item.label}</span>
				</button>
			</li>
		{/each}
	</ul>
	<hr />
	<ul>
		{#each bookItems as item (item.id)}
			{@const Icon = item.icon}
			<li>
				<button
					type="button"
					class="rail-item"
					aria-current={isNavigationItemActive(item) ? 'page' : undefined}
					onclick={() => activateNavigationItem(item)}
				>
					<Icon size={20} strokeWidth={1.6} aria-hidden="true" />
					<span>{item.label}</span>
				</button>
			</li>
		{/each}
	</ul>
	<a class="rail-item index" href={router.buildHref('index')} aria-label="Spis makiet">
		<LayoutGridIcon size={20} strokeWidth={1.6} aria-hidden="true" />
		<span>Makiety</span>
	</a>
</nav>

<style>
	.rail {
		grid-area: rail;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--s-2);
		padding: var(--s-3) 0;
		background: var(--antracyt);
		border-right: 1px solid var(--linia);
		z-index: 20;
	}

	ul {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	hr {
		width: 32px;
		border: 0;
		border-top: 1px solid var(--linia);
		margin: var(--s-2) 0;
	}

	.rail-item {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 3px;
		width: 58px;
		min-height: 54px;
		border: 0;
		border-radius: var(--r-panel);
		background: transparent;
		color: var(--tekst-2);
		font-size: 0.6875rem;
		text-decoration: none;
		transition:
			background var(--czas-krotki) ease,
			color var(--czas-krotki) ease;
	}

	.rail-item:hover {
		background: var(--kamien-2);
		color: var(--tekst);
	}

	.rail-item[aria-current='page'],
	.rail-item[aria-pressed='true'] {
		background: var(--mosiadz-tlo);
		color: var(--mosiadz-jasny);
	}

	.rail-item[aria-current='page']::before,
	.rail-item[aria-pressed='true']::before {
		content: '';
		position: absolute;
		left: -5px;
		top: 12px;
		bottom: 12px;
		width: 3px;
		border-radius: 0 2px 2px 0;
		background: var(--mosiadz);
	}

	.index {
		margin-top: auto;
	}

	@media (max-width: 47.99rem) {
		.rail {
			display: none;
		}
	}
</style>
