<script lang="ts">
	interface Props {
		label: string;
		count?: number | null;
	}

	let { label, count = null }: Props = $props();
</script>

<span class="inline-flex items-center gap-1.5 tabular-nums" role="status" aria-label={label}>
	<span class="tile-loader-ring" aria-hidden="true"></span>
	{#if count !== null && count > 0}
		<span class="text-[12px]">{count}</span>
	{/if}
</span>
