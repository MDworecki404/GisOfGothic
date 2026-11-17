<script lang="ts">
	import type { Snippet } from 'svelte';
	import XIcon from '@lucide/svelte/icons/x';

	interface Props {
		title: string;
		subtitle?: string;
		onclose: () => void;
		children: Snippet;
	}

	let { title, subtitle, onclose, children }: Props = $props();
</script>

<section class="frame cartouche" aria-label={title}>
	<header>
		<div>
			<h2>{title}</h2>
			{#if subtitle}<p>{subtitle}</p>{/if}
		</div>
		<button
			type="button"
			class="btn icon ghost"
			aria-label={`Zamknij panel: ${title}`}
			onclick={onclose}
		>
			<XIcon size={18} />
		</button>
	</header>
	<div class="content scroll">
		{@render children()}
	</div>
</section>

<style>
	.frame {
		display: flex;
		flex-direction: column;
		max-height: 100%;
		min-height: 0;
		animation: enter var(--czas-sredni) var(--ruch);
	}

	@keyframes enter {
		from {
			opacity: 0;
			translate: -8px 0;
		}
	}

	header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--s-3);
		padding: var(--s-3) var(--s-3) var(--s-3) var(--s-4);
		border-bottom: 1px solid var(--linia);
	}

	h2 {
		font-size: var(--tx-xl);
	}

	p {
		color: var(--tekst-2);
		font-size: var(--tx-sm);
	}

	.content {
		flex: 1;
		min-height: 0;
		padding: var(--s-4);
	}
</style>
