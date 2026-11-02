<script lang="ts">
	import CheckIcon from '@lucide/svelte/icons/check';
	import LinkIcon from '@lucide/svelte/icons/link';

	interface Props {
		class?: string;
		label?: string;
	}

	const FEEDBACK_MILLISECONDS = 2500;

	let { class: className = 'button-quiet', label = 'Kopiuj link do widoku' }: Props = $props();
	let status = $state<'idle' | 'copied' | 'failed'>('idle');

	async function copyViewLink(): Promise<void> {
		try {
			await navigator.clipboard.writeText(window.location.href);
			status = 'copied';
		} catch {
			status = 'failed';
		}
		setTimeout(() => (status = 'idle'), FEEDBACK_MILLISECONDS);
	}
</script>

<button
	class="inline-flex items-center gap-1.5 {className}"
	title="Link odtwarza świat, wpis, kamerę i otwarte narzędzie"
	onclick={copyViewLink}
>
	{#if status === 'copied'}
		<CheckIcon class="size-4" />
	{:else}
		<LinkIcon class="size-4" />
	{/if}
	{#if status === 'copied'}
		Skopiowano link
	{:else if status === 'failed'}
		Nie udało się skopiować
	{:else}
		{label}
	{/if}
</button>
