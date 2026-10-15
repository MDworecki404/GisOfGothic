<script lang="ts">
	import * as Command from '#lib/components/ui/command/index.js';
</script>

<Command.Root class="bg-transparent" data-testid="search-panel">
	<Command.Input placeholder="Szukaj przedmiotu lub postaci…" />
	<Command.List>
		<Command.Empty>Wpisz nazwę, aby wyszukać.</Command.Empty>
	</Command.List>
</Command.Root>
