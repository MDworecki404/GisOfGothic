<script lang="ts">
	import '../app.css';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<svelte:head>
	<title>GIS of Gothic — Khorinis</title>
</svelte:head>

{@render children()}
