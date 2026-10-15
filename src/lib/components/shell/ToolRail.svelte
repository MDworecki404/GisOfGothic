<script lang="ts">
	import { appState, geoportal } from '#lib/composition-root.js';
	import { TOOL_DEFINITIONS } from './tool-definitions.js';
</script>

<nav
	class="panel-stone fixed inset-x-0 bottom-0 z-30 flex h-15 gap-0.5 border-x-0 border-b-0 px-1.5 py-1 md:top-13 md:right-auto md:bottom-9 md:h-auto md:w-16 md:flex-col md:border-t-0 md:border-r md:py-2"
	aria-label="Narzędzia"
>
	{#each TOOL_DEFINITIONS as tool (tool.id)}
		<button
			class="tool-rail-button relative flex flex-1 flex-col items-center gap-0.5 rounded-sm py-2 text-[11.5px] text-muted-foreground hover:bg-secondary hover:text-foreground md:flex-none"
			aria-pressed={appState.activeToolId === tool.id}
			onclick={() => geoportal.selectTool(tool.id)}
		>
			<tool.icon class="size-5" />
			{tool.label}
		</button>
	{/each}
</nav>
