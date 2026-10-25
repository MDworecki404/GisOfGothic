<script lang="ts">
	import ForgedRange from '#lib/components/controls/ForgedRange.svelte';
	import { appState, geoportal } from '#lib/composition-root.js';

	interface Props {
		onClose: () => void;
	}

	let { onClose }: Props = $props();

	const isOrthographic = $derived(appState.cameraProjection.kind === 'orthographic');
</script>

<div
	class="material-leather absolute top-0 right-full z-20 mr-2.5 w-[min(16rem,calc(100vw-5.5rem))] rounded-md p-3"
	role="group"
	aria-label="Widok kamery"
	data-camera-settings
>
	<h3 class="group-label mb-2">Widok kamery</h3>

	<div class="grid grid-cols-2 gap-2" role="group" aria-label="Rzut kamery">
		<button
			class="chip justify-center px-2"
			aria-pressed={!isOrthographic}
			onclick={() => geoportal.selectCameraProjection('perspective')}
		>
			Perspektywa
		</button>
		<button
			class="chip justify-center px-2"
			aria-pressed={isOrthographic}
			onclick={() => geoportal.selectCameraProjection('orthographic')}
		>
			Ortogonalny
		</button>
	</div>

	<div class="mt-3 {isOrthographic ? 'opacity-50' : ''}" inert={isOrthographic}>
		<span class="flex items-baseline justify-between text-sm font-medium text-muted-foreground">
			Kąt widzenia
			<span class="text-base text-primary tabular-nums">{appState.fieldOfViewDegrees}°</span>
		</span>
		<ForgedRange
			min={30}
			max={100}
			step={1}
			value={appState.fieldOfViewDegrees}
			label="Kąt widzenia kamery w stopniach"
			valueText="{appState.fieldOfViewDegrees}°"
			onValueChange={(value) => geoportal.setCameraFieldOfView(value)}
		/>
	</div>
	{#if isOrthographic}
		<p class="mt-1 text-caption text-muted-foreground">
			Kąt widzenia dotyczy tylko rzutu środkowego.
		</p>
	{/if}

	<div class="mt-3 grid grid-cols-2 gap-2">
		<button
			class="button-iron px-2"
			onclick={() => {
				geoportal.showCameraPreset('top');
				onClose();
			}}
		>
			Z góry
		</button>
		<button
			class="button-iron px-2"
			onclick={() => {
				geoportal.showCameraPreset('oblique');
				onClose();
			}}
		>
			Skos
		</button>
	</div>
</div>
