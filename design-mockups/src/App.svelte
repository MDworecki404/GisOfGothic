<script lang="ts">
	import { router } from './state/router.svelte.js';
	import AtlasView from './views/AtlasView.svelte';
	import CharacterView from './views/CharacterView.svelte';
	import IndexView from './views/IndexView.svelte';
	import LocationView from './views/LocationView.svelte';
	import QuestsView from './views/QuestsView.svelte';
	import SystemView from './views/SystemView.svelte';
	import TrailsView from './views/TrailsView.svelte';
	import WorldsView from './views/WorldsView.svelte';
</script>

{#if router.route.view === 'atlas'}
	<AtlasView />
{:else if router.route.view === 'location'}
	<LocationView />
{:else if router.route.view === 'character'}
	<CharacterView />
{:else if router.route.view === 'quests'}
	<QuestsView />
{:else if router.route.view === 'worlds'}
	<WorldsView />
{:else if router.route.view === 'system'}
	<SystemView />
{:else if router.route.view === 'trails'}
	<TrailsView />
{:else}
	<IndexView />
{/if}
