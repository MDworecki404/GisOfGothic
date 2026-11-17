<script lang="ts">
	import type { Entry } from '../data/types.js';
	import CategoryIcon from './CategoryIcon.svelte';

	interface Props {
		title: string;
		entries: readonly Entry[];
		onopen: (entryId: string) => void;
	}

	let { title, entries, onopen }: Props = $props();
</script>

{#if entries.length > 0}
	<section class="related">
		<h3>{title} <span class="tabular">{entries.length}</span></h3>
		<ul>
			{#each entries as entry (entry.id)}
				<li>
					<button type="button" onclick={() => onopen(entry.id)}>
						<CategoryIcon category={entry.category} size={16} />
						<span class="text">
							<span class="name">{entry.name}</span>
							<span class="meta">{entry.summary}</span>
						</span>
					</button>
				</li>
			{/each}
		</ul>
	</section>
{/if}

<style>
	h3 {
		display: flex;
		justify-content: space-between;
		margin-bottom: var(--s-1);
		font-size: 1.125rem;
		color: var(--mosiadz-jasny);
	}

	h3 span {
		font-family: var(--font-ui);
		font-size: var(--tx-xs);
		font-weight: 400;
		color: var(--tekst-3);
	}

	li + li {
		border-top: 1px solid var(--linia);
	}

	button {
		display: flex;
		align-items: center;
		gap: var(--s-3);
		width: 100%;
		min-height: var(--cel-dotyku);
		padding: 6px 4px;
		border: 0;
		background: none;
		text-align: left;
		transition: background var(--czas-krotki) ease;
	}

	button:hover {
		background: var(--kamien-2);
	}

	.text {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.name {
		font-weight: 500;
	}

	.meta {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		color: var(--tekst-2);
		font-size: var(--tx-xs);
	}
</style>
