<script lang="ts">
	import DownloadIcon from '@lucide/svelte/icons/download';
	import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical';
	import GaugeIcon from '@lucide/svelte/icons/gauge';
	import InfoIcon from '@lucide/svelte/icons/info';

	interface Props {
		canInstallApp: boolean;
		onInstallApp: () => void;
		onOpenPerformance: () => void;
		onOpenAbout: () => void;
	}

	let { canInstallApp, onInstallApp, onOpenPerformance, onOpenAbout }: Props = $props();
	let isOpen = $state(false);
	let menu: HTMLDivElement;

	const menuItem =
		'flex min-h-11 w-full items-center gap-3 px-4 text-left hover:bg-hover-surface hover:text-foreground';

	function closeOnOutsideClick(event: MouseEvent): void {
		if (isOpen && event.target instanceof Node && !menu.contains(event.target)) isOpen = false;
	}

	function closeOnEscape(event: KeyboardEvent): void {
		if (isOpen && event.key === 'Escape') {
			event.stopPropagation();
			isOpen = false;
		}
	}

	function chooseItem(action: () => void): void {
		isOpen = false;
		action();
	}
</script>

<svelte:window onclick={closeOnOutsideClick} />

<div class="relative shrink-0 md:hidden" bind:this={menu} onkeydown={closeOnEscape} role="none">
	<button
		class="grid size-11 place-items-center rounded-sm text-muted-foreground hover:text-foreground"
		aria-haspopup="true"
		aria-expanded={isOpen}
		aria-label="Więcej"
		onclick={() => (isOpen = !isOpen)}
	>
		<EllipsisVerticalIcon class="size-5" />
	</button>

	{#if isOpen}
		<div
			class="material-leather absolute top-[calc(100%+6px)] right-0 z-40 min-w-56 rounded-md py-1.5"
		>
			{#if canInstallApp}
				<button class={menuItem} onclick={() => chooseItem(onInstallApp)}>
					<DownloadIcon class="size-4.5 text-muted-foreground" />
					Zainstaluj aplikację
				</button>
			{/if}
			<button class={menuItem} onclick={() => chooseItem(onOpenPerformance)}>
				<GaugeIcon class="size-4.5 text-muted-foreground" />
				Wydajność
			</button>
			<button class={menuItem} onclick={() => chooseItem(onOpenAbout)}>
				<InfoIcon class="size-4.5 text-muted-foreground" />
				O projekcie
			</button>
		</div>
	{/if}
</div>
