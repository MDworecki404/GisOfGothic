<script lang="ts">
	import type { Snippet } from 'svelte';
	import AppShell from './AppShell.svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();
</script>

<AppShell showFilters={false}>
	<div class="page scroll">
		<div class="inner">
			{@render children()}
		</div>
	</div>
</AppShell>

<style>
	.page {
		height: 100%;
		background:
			radial-gradient(ellipse at 15% -10%, rgb(196 161 95 / 0.06), transparent 55%), var(--grafit);
	}

	.inner {
		max-width: 1120px;
		margin: 0 auto;
		padding: var(--s-5) var(--s-5) var(--s-7);
	}

	@media (max-width: 47.99rem) {
		.inner {
			padding: var(--s-4) var(--s-4) var(--s-6);
		}
	}
</style>
