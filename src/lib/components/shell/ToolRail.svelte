<script lang="ts">
	import EllipsisIcon from '@lucide/svelte/icons/ellipsis';
	import { MediaQuery } from 'svelte/reactivity';
	import { appState, geoportal } from '#lib/composition-root.js';
	import { TOOL_DEFINITIONS, type ToolDefinition } from './tool-definitions.js';

	const isPhone = new MediaQuery('max-width: 767px');
	const phoneTools = TOOL_DEFINITIONS.filter((tool) => tool.isOnPhoneBar);
	const otherTools = TOOL_DEFINITIONS.filter((tool) => !tool.isOnPhoneBar);

	let isOtherToolsMenuOpen = $state(false);
	const isOtherToolActive = $derived(otherTools.some((tool) => appState.activeToolId === tool.id));

	function chooseOtherTool(tool: ToolDefinition): void {
		isOtherToolsMenuOpen = false;
		geoportal.selectTool(tool.id);
	}

	function closeMenuOnOutsideClick(event: MouseEvent): void {
		const target = event.target instanceof Element ? event.target : null;
		if (isOtherToolsMenuOpen && target?.closest('[data-other-tools]') === null) {
			isOtherToolsMenuOpen = false;
		}
	}

	function closeMenuOnEscape(event: KeyboardEvent): void {
		if (event.key === 'Escape' && isOtherToolsMenuOpen) {
			event.stopPropagation();
			isOtherToolsMenuOpen = false;
		}
	}

	function startsNewGroup(tool: ToolDefinition, index: number): boolean {
		return index > 0 && TOOL_DEFINITIONS[index - 1].group !== tool.group;
	}
</script>

<svelte:window onclick={closeMenuOnOutsideClick} onkeydown={closeMenuOnEscape} />

{#if isPhone.current}
	<nav
		class="material-leather fixed inset-x-0 bottom-0 z-30 flex h-(--bottom-nav-height) gap-0.5 px-1 pt-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] [--cut:12px]"
		aria-label="Narzędzia"
		data-map-obstacle
	>
		{#each phoneTools as tool (tool.id)}
			<button
				class="tool-rail-button relative flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 rounded-sm py-1.5 text-caption text-muted-foreground"
				aria-pressed={appState.activeToolId === tool.id}
				onclick={() => geoportal.selectTool(tool.id)}
			>
				<tool.icon class="size-5" />
				{tool.label}
			</button>
		{/each}
		<div class="relative flex flex-1" data-other-tools>
			<button
				class="tool-rail-button relative flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 rounded-sm py-1.5 text-caption text-muted-foreground"
				aria-pressed={isOtherToolActive}
				aria-expanded={isOtherToolsMenuOpen}
				aria-haspopup="menu"
				onclick={() => (isOtherToolsMenuOpen = !isOtherToolsMenuOpen)}
			>
				<EllipsisIcon class="size-5" />
				Inne
			</button>
			{#if isOtherToolsMenuOpen}
				<div
					class="material-leather absolute right-0 bottom-[calc(100%+0.5rem)] z-40 min-w-48 py-1.5"
					role="menu"
				>
					{#each otherTools as tool (tool.id)}
						<button
							class="flex min-h-11 w-full items-center gap-3 px-4 text-left hover:bg-hover-surface hover:text-hover {appState.activeToolId ===
							tool.id
								? 'text-active'
								: ''}"
							role="menuitem"
							onclick={() => chooseOtherTool(tool)}
						>
							<tool.icon class="size-4.5" />
							{tool.label}
						</button>
					{/each}
				</div>
			{/if}
		</div>
	</nav>
{:else}
	<nav
		class="material-leather fixed top-(--top-bar-height) bottom-(--edge-inset) left-(--edge-inset) z-30 flex w-16 flex-col items-center gap-0.5 py-1.5 [--cut:12px]"
		aria-label="Narzędzia"
		data-map-obstacle
	>
		{#each TOOL_DEFINITIONS as tool, index (tool.id)}
			{#if startsNewGroup(tool, index)}
				<div class="my-1.5 h-px w-9 bg-border" role="presentation"></div>
			{/if}
			<button
				class="tool-rail-button group relative grid size-12 place-items-center rounded-sm text-muted-foreground [@media(max-height:640px)]:size-11"
				aria-pressed={appState.activeToolId === tool.id}
				aria-label={tool.label}
				onclick={() => geoportal.selectTool(tool.id)}
			>
				<tool.icon class="size-5.5" />
				<span
					class="pointer-events-none absolute top-1/2 left-[calc(100%+0.75rem)] z-40 -translate-y-1/2 bg-edge px-2.5 py-1 text-label whitespace-nowrap text-foreground opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
					aria-hidden="true"
				>
					{tool.label}
				</span>
			</button>
		{/each}
	</nav>
{/if}
