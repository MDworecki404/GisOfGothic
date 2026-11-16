<script lang="ts">
	import OrbitIcon from '@lucide/svelte/icons/orbit';
	import XIcon from '@lucide/svelte/icons/x';
	import { appState, geoportal } from '#lib/composition-root.js';
	import { TOOL_DEFINITIONS, type ToolDefinition } from './tool-definitions.js';

	interface SpokePlacement {
		tool: ToolDefinition;
		radiusPixels: number;
		angleDegrees: number;
	}

	const INNER_RING_RADIUS_PIXELS = 124;
	const OUTER_RING_RADIUS_PIXELS = 212;
	const INNER_RING_SIZE = 4;
	const FAN_START_DEGREES = 4;
	const FAN_END_DEGREES = 86;

	/** Rozkłada narzędzia na dwóch łukach w ćwiartce nad piastą, bo piasta stoi w rogu ekranu. */
	function placeSpokes(tools: readonly ToolDefinition[]): SpokePlacement[] {
		const rings = [
			{ tools: tools.slice(0, INNER_RING_SIZE), radiusPixels: INNER_RING_RADIUS_PIXELS },
			{ tools: tools.slice(INNER_RING_SIZE), radiusPixels: OUTER_RING_RADIUS_PIXELS }
		];
		return rings.flatMap((ring) =>
			ring.tools.map((tool, index) => ({
				tool,
				radiusPixels: ring.radiusPixels,
				angleDegrees:
					ring.tools.length === 1
						? (FAN_START_DEGREES + FAN_END_DEGREES) / 2
						: FAN_START_DEGREES +
							((FAN_END_DEGREES - FAN_START_DEGREES) * index) / (ring.tools.length - 1)
			}))
		);
	}

	const spokes = placeSpokes(TOOL_DEFINITIONS);

	let isOpen = $state(false);
	let wheel: HTMLElement;

	const activeTool = $derived(TOOL_DEFINITIONS.find((tool) => tool.id === appState.activeToolId));
	const hubLabel = $derived(activeTool ? `Narzędzia, aktywne: ${activeTool.label}` : 'Narzędzia');

	function chooseTool(tool: ToolDefinition): void {
		isOpen = false;
		geoportal.selectTool(tool.id);
	}

	/** Ścieżka zdarzenia zamiast `contains`, bo ikona piasty wymienia się przed obsługą kliknięcia na oknie. */
	function closeOnOutsideClick(event: MouseEvent): void {
		if (isOpen && !event.composedPath().includes(wheel)) isOpen = false;
	}

	function closeOnEscape(event: KeyboardEvent): void {
		if (!isOpen || event.key !== 'Escape') return;
		event.preventDefault();
		isOpen = false;
	}

	function placeSpoke(spoke: SpokePlacement): string {
		const radians = (spoke.angleDegrees * Math.PI) / 180;
		const x = Math.cos(radians) * spoke.radiusPixels;
		const y = -Math.sin(radians) * spoke.radiusPixels;
		return `--spoke-x: ${x.toFixed(1)}px; --spoke-y: ${y.toFixed(1)}px;`;
	}
</script>

<svelte:window onclick={closeOnOutsideClick} onkeydown={closeOnEscape} />

<nav
	class="fixed bottom-(--edge-inset) left-(--edge-inset) z-30 size-16"
	aria-label="Narzędzia"
	data-map-obstacle
	bind:this={wheel}
>
	<div class="tool-wheel-spokes" data-open={isOpen}>
		{#each spokes as spoke (spoke.tool.id)}
			<button
				class="tool-wheel-spoke group"
				style={placeSpoke(spoke)}
				aria-pressed={appState.activeToolId === spoke.tool.id}
				aria-label={spoke.tool.label}
				tabindex={isOpen ? 0 : -1}
				onclick={() => chooseTool(spoke.tool)}
			>
				<spoke.tool.icon class="size-5" />
				<span class="tool-wheel-label" aria-hidden="true">{spoke.tool.label}</span>
			</button>
		{/each}
	</div>

	<button
		class="tool-wheel-hub material-leather grid size-16 place-items-center rounded-full"
		aria-label={hubLabel}
		aria-expanded={isOpen}
		aria-haspopup="true"
		title={hubLabel}
		onclick={() => (isOpen = !isOpen)}
	>
		{#if isOpen}
			<XIcon class="size-6" />
		{:else if activeTool}
			<activeTool.icon class="size-6" />
		{:else}
			<OrbitIcon class="size-6" />
		{/if}
	</button>
</nav>
