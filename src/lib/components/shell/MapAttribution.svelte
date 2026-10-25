<script lang="ts">
	interface Props {
		creditContainer?: HTMLElement;
	}

	let { creditContainer = $bindable() }: Props = $props();
</script>

<aside
	class="map-attribution fixed bottom-[calc(var(--bottom-nav-height)+var(--sheet-occupied-height)+var(--status-bar-height)+var(--gutter))] left-(--gutter) z-10 flex max-w-[calc(100vw-2*var(--gutter))] items-center gap-2 rounded-sm px-2 py-1 text-caption md:right-(--gutter) md:left-auto"
	aria-label="Źródła i prawa autorskie"
>
	<div class="map-credits flex min-w-0 items-center" bind:this={creditContainer}></div>
	<p class="truncate">
		<span class="md:hidden">© Piranha Bytes, THQ Nordic</span>
		<span class="hidden md:inline">Świat gry © Piranha Bytes, THQ Nordic · projekt fanowski</span>
	</p>
</aside>
