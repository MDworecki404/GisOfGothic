<script lang="ts">
	import MonitorIcon from '@lucide/svelte/icons/monitor';
	import MoonIcon from '@lucide/svelte/icons/moon';
	import SunIcon from '@lucide/svelte/icons/sun';
	import { appState, selectTheme } from '#lib/composition-root.js';
	import {
		findNextThemePreference,
		THEME_PREFERENCE_LABELS
	} from '#lib/services/theme/theme-preference.js';

	interface Props {
		class?: string;
		showLabel?: boolean;
	}

	let { class: className = '', showLabel = false }: Props = $props();

	const nextPreference = $derived(findNextThemePreference(appState.themePreference));
	const currentLabel = $derived(THEME_PREFERENCE_LABELS[appState.themePreference]);
	const nextLabel = $derived(THEME_PREFERENCE_LABELS[nextPreference]);
</script>

<button
	class={className}
	title={`Motyw: ${currentLabel}. Kliknij, aby wybrać: ${nextLabel.toLowerCase()}`}
	aria-label={`Motyw: ${currentLabel}. Zmień na: ${nextLabel.toLowerCase()}`}
	onclick={() => selectTheme(nextPreference)}
>
	{#if appState.themePreference === 'light'}
		<SunIcon class="size-4.5" />
	{:else if appState.themePreference === 'dark'}
		<MoonIcon class="size-4.5" />
	{:else}
		<MonitorIcon class="size-4.5" />
	{/if}
	{#if showLabel}Motyw: {currentLabel.toLowerCase()}{/if}
</button>
