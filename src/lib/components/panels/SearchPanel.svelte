<script lang="ts">
	import { appState } from '#lib/composition-root.js';
</script>

<p class="text-sm text-muted-foreground">
	Wpisz nazwę przedmiotu albo postaci w polu wyszukiwania u góry.
	{#if appState.indexCounts}
		W tym świecie jest {appState.indexCounts.items} przedmiotów i {appState.indexCounts.characters}
		unikatowych postaci.
	{/if}
</p>
