<script lang="ts">
	import ForgedRange from '#lib/components/controls/ForgedRange.svelte';
	import { appState, geoportal } from '#lib/composition-root.js';

	interface Props {
		onClose: () => void;
	}

	let { onClose }: Props = $props();

	const isFlatMap = $derived(appState.viewMode === 'view-2d');
	const isOrthographic = $derived(appState.cameraProjection.kind === 'orthographic');
	const sliceRange = $derived(appState.sliceHeightRange);
	const sliceNudgeSteps = [-5, -1, 1, 5];
	const sliceSliderValue = $derived(
		appState.sliceHeightMetres ??
			(sliceRange ? Math.round((sliceRange.minimumMetres + sliceRange.maximumMetres) / 2) : 0)
	);
</script>

<div
	class="material-leather absolute top-0 right-full z-20 mr-2.5 w-[min(16rem,calc(100vw-5.5rem))] rounded-md p-3"
	role="group"
	aria-label="Widok kamery"
	data-camera-settings
>
	<h3 class="group-label mb-2">Widok kamery</h3>

	<div class={isFlatMap ? 'opacity-50' : ''} inert={isFlatMap}>
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

	{#if isFlatMap}
		<p class="mt-1 text-caption text-muted-foreground">
			W widoku 2D rzut i kąt widzenia ustawiają się automatycznie.
		</p>

		<h3 class="group-label mt-3 mb-2">Poziom cięcia</h3>
		<button
			class="chip w-full justify-center px-2"
			aria-pressed={appState.sliceHeightMetres === null}
			onclick={() => geoportal.setSliceHeight(null)}
		>
			Bez cięcia
		</button>
		<div class="mt-2 {sliceRange ? '' : 'opacity-50'}" inert={sliceRange === null}>
			<span class="flex items-baseline justify-between text-sm font-medium text-muted-foreground">
				Wysokość cięcia
				<span class="text-base text-primary tabular-nums">
					{appState.sliceHeightMetres === null ? '—' : `${appState.sliceHeightMetres} m`}
				</span>
			</span>
			<ForgedRange
				min={sliceRange?.minimumMetres ?? 0}
				max={sliceRange?.maximumMetres ?? 1}
				step={1}
				value={sliceSliderValue}
				label="Wysokość cięcia modelu w metrach"
				valueText={appState.sliceHeightMetres === null
					? 'bez cięcia'
					: `${appState.sliceHeightMetres} m`}
				onValueChange={(value) => geoportal.setSliceHeight(value)}
			/>
			<div
				class="mt-2 grid grid-cols-4 gap-2"
				role="group"
				aria-label="Dokładna regulacja wysokości cięcia"
			>
				{#each sliceNudgeSteps as step (step)}
					<button
						class="button-iron px-1 tabular-nums"
						aria-label="{step > 0 ? 'Podnieś' : 'Obniż'} cięcie o {Math.abs(step)} m"
						onclick={() => geoportal.setSliceHeight(sliceSliderValue + step)}
					>
						{step > 0 ? `+${step}` : `−${Math.abs(step)}`}
					</button>
				{/each}
			</div>
		</div>
		<p class="mt-1 text-caption text-muted-foreground">
			Ukrywa wszystko, co leży powyżej wybranej wysokości.
		</p>
	{:else if isOrthographic}
		<p class="mt-1 text-caption text-muted-foreground">
			Kąt widzenia dotyczy tylko rzutu środkowego.
		</p>
	{/if}
</div>
