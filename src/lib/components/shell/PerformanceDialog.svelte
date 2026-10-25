<script lang="ts">
	import GaugeIcon from '@lucide/svelte/icons/gauge';
	import { appState, geoportal } from '#lib/composition-root.js';
	import * as Dialog from '#lib/components/ui/dialog/index.js';
	import {
		QUALITY_LEVEL_LABELS,
		type PerformancePreference
	} from '#lib/services/performance/performance-profiles.js';

	interface PreferenceOption {
		value: PerformancePreference;
		label: string;
		description: string;
	}

	const options: readonly PreferenceOption[] = [
		{
			value: 'auto',
			label: 'Automatycznie',
			description: 'Zaczyna od wysokiej jakości i obniża ją, gdy mapa zaczyna się zacinać.'
		},
		{
			value: 'high',
			label: 'Wysoka',
			description:
				'Pełna rozdzielczość, wygładzone krawędzie, gładkie cienie. Dla mocnych urządzeń.'
		},
		{
			value: 'medium',
			label: 'Średnia',
			description: 'Nieco niższa rozdzielczość i mniej szczegółów w oddali.'
		},
		{
			value: 'low',
			label: 'Niska',
			description:
				'Najlżejsza: niska rozdzielczość, mało szczegółów, bez cieni. Dla telefonów i starych laptopów.'
		}
	];

	interface Props {
		open?: boolean;
	}

	let { open: isOpen = $bindable(false) }: Props = $props();

	const statusText = $derived.by(() => {
		const level = QUALITY_LEVEL_LABELS[appState.performanceLevel].toLowerCase();
		const fps =
			appState.measuredFramesPerSecond === null
				? ''
				: `, ok. ${appState.measuredFramesPerSecond} kl./s`;
		if (appState.performancePreference !== 'auto') return `Jakość ${level}${fps}.`;
		return appState.performanceWasLoweredAutomatically
			? `Mapa się zacinała, więc obniżyliśmy jakość do: ${level}${fps}.`
			: `Obecnie jakość ${level}${fps}.`;
	});
</script>

<Dialog.Root bind:open={isOpen}>
	<Dialog.Trigger
		class="hidden size-11 shrink-0 items-center justify-center rounded-sm border border-border text-muted-foreground hover:border-torch/60 hover:text-foreground md:flex"
		title="Wydajność"
		data-testid="performance-open"
	>
		<GaugeIcon class="size-4" />
		<span class="sr-only">Ustawienia wydajności</span>
	</Dialog.Trigger>

	<Dialog.Content
		class="material-leather max-h-[calc(100dvh-2rem)] gap-0 overflow-y-auto rounded-sm p-0 ring-0 sm:max-w-md"
	>
		<div class="m-1.5 border border-primary/30 px-6 pt-8 pb-6 sm:px-8">
			<Dialog.Title class="font-heading text-2xl text-primary">Wydajność</Dialog.Title>
			<Dialog.Description class="mt-1 text-muted-foreground">
				Gdy mapa się zacina, niższa jakość obrazu przyspiesza ją.
			</Dialog.Description>

			<fieldset class="mt-5 space-y-1">
				<legend class="sr-only">Jakość obrazu</legend>
				{#each options as option (option.value)}
					<label
						class="flex cursor-pointer items-start gap-3 rounded-sm border border-transparent p-2.5 hover:border-border has-[:checked]:border-primary/50"
					>
						<input
							type="radio"
							name="performance"
							class="mt-1 size-4 accent-[var(--primary)]"
							value={option.value}
							checked={appState.performancePreference === option.value}
							onchange={() => geoportal.selectPerformance(option.value)}
						/>
						<span>
							{option.label}
							<span class="block text-[13px] text-muted-foreground">{option.description}</span>
						</span>
					</label>
				{/each}
			</fieldset>

			<p
				class="mt-4 text-sm text-muted-foreground"
				aria-live="polite"
				data-testid="performance-status"
			>
				{statusText}
			</p>
		</div>
	</Dialog.Content>
</Dialog.Root>
