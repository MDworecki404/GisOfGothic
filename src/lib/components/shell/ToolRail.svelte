<script lang="ts">
	import { appState, geoportal } from '#lib/composition-root.js';
	import { TOOL_DEFINITIONS } from './tool-definitions.js';
</script>

<nav
	class="material-leather fixed inset-x-0 bottom-0 z-30 flex h-(--bottom-nav-height) gap-0.5 border-x-0 border-b-0 px-1 pt-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] md:top-(--top-bar-height) md:right-auto md:bottom-(--status-bar-height) md:h-auto md:w-(--rail-width) md:flex-col md:border-t-0 md:border-r md:px-1.5 md:py-2"
	aria-label="Narzędzia"
	data-map-obstacle
>
	{#each TOOL_DEFINITIONS as tool (tool.id)}
		<button
			class="tool-rail-button relative flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 rounded-sm py-1.5 text-caption text-muted-foreground md:min-h-14 md:flex-none {tool.isAtRailEnd
				? 'md:mt-auto'
				: ''}"
			aria-pressed={appState.activeToolId === tool.id}
			onclick={() => geoportal.selectTool(tool.id)}
		>
			<tool.icon class="size-5" />
			{tool.label}
		</button>
	{/each}
</nav>
