<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	onMount(() => document.getElementById('app-splash')?.remove());
</script>

<svelte:head></svelte:head>

{@render children()}
