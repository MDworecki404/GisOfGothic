<script lang="ts">
	import MapView from '#lib/components/MapView.svelte';
	import SearchPanel from '#lib/components/SearchPanel.svelte';
	import StatusBar from '#lib/components/StatusBar.svelte';
	import * as Drawer from '#lib/components/ui/drawer/index.js';
	import { geoportal } from '#lib/composition-root.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	$effect(() => {
		geoportal.openWorld(data.world);
	});
</script>

<svelte:head>
	<title>{data.world.name} — GIS of Gothic</title>
</svelte:head>

<main class="relative h-dvh w-screen overflow-hidden bg-background">
	<MapView />

	<aside class="panel-stone absolute top-4 left-4 hidden w-80 rounded-sm p-3 md:block">
		<h1 class="mb-2 text-xl font-semibold text-primary">{data.world.name}</h1>
		<SearchPanel />
	</aside>

	<div class="absolute inset-x-0 top-0 p-3 md:hidden">
		<Drawer.Root>
			<Drawer.Trigger
				class="panel-stone flex w-full items-center justify-between rounded-sm px-3 py-2 text-left"
			>
				<span class="font-[family-name:var(--font-heading)] text-lg text-primary"
					>{data.world.name}</span
				>
				<span class="text-sm text-muted-foreground">Szukaj przedmiotu lub postaci…</span>
			</Drawer.Trigger>
			<Drawer.Content>
				<Drawer.Header>
					<Drawer.Title>{data.world.name}</Drawer.Title>
					<Drawer.Description class="sr-only">Wyszukiwarka przedmiotów i postaci</Drawer.Description
					>
				</Drawer.Header>
				<div class="px-3 pb-6">
					<SearchPanel />
				</div>
			</Drawer.Content>
		</Drawer.Root>
	</div>

	<div class="absolute right-4 bottom-4 left-4 flex justify-end md:left-auto">
		<StatusBar />
	</div>
</main>
