<script lang="ts">
	import { appState } from '#lib/composition-root.js';
</script>

<div
	class="panel-stone rounded-sm px-3 py-1.5 text-sm {appState.hasError
		? 'text-destructive'
		: 'text-muted-foreground'}"
	role="status"
	aria-live="polite"
	data-testid="status-bar"
>
	{appState.statusText}
</div>
