<script lang="ts">
	import CloudOffIcon from '@lucide/svelte/icons/wifi-off';
	import LoaderIcon from '@lucide/svelte/icons/loader-circle';
	import RefreshIcon from '@lucide/svelte/icons/refresh-cw';
	import SearchIcon from '@lucide/svelte/icons/search';
	import CategoryIcon from '../components/CategoryIcon.svelte';
	import PageLayout from '../components/PageLayout.svelte';
	import { CATEGORY_DEFINITIONS } from '../data/categories.js';
	import { mockupState } from '../state/mockup-state.svelte.js';

	interface Swatch {
		name: string;
		variable: string;
		role: string;
	}

	const SWATCHES: readonly Swatch[] = [
		{ name: 'Grafit', variable: '--grafit', role: 'Tło aplikacji' },
		{ name: 'Antracyt', variable: '--antracyt', role: 'Paski i pola' },
		{ name: 'Kamień 1', variable: '--kamien-1', role: 'Panele' },
		{ name: 'Kamień 2', variable: '--kamien-2', role: 'Podniesione elementy' },
		{ name: 'Mosiądz', variable: '--mosiadz', role: 'Akcent główny' },
		{ name: 'Mosiądz jasny', variable: '--mosiadz-jasny', role: 'Fokus i aktywne' },
		{ name: 'Oliwka', variable: '--oliwka', role: 'Akcent dodatkowy' },
		{ name: 'Rdza', variable: '--rdza', role: 'Błędy i zagrożenia' },
		{ name: 'Tekst', variable: '--tekst', role: 'Tekst główny' },
		{ name: 'Tekst 2', variable: '--tekst-2', role: 'Tekst pomocniczy' }
	];

	let fieldValue = $state('Xardsa');
	let isReloading = $state(false);
	const fieldError = $derived(
		fieldValue.length > 0 && !/^[\p{L}\s-]+$/u.test(fieldValue) ? 'Użyj tylko liter.' : ''
	);

	function simulateReload(): void {
		isReloading = true;
		window.setTimeout(() => {
			isReloading = false;
			mockupState.showToast('Dane świata wczytane ponownie');
		}, 1400);
	}
</script>

<PageLayout>
	<header class="head">
		<h1 class="page-title">Katalog komponentów i stanów</h1>
		<p>
			Zasady, na których zbudowano pozostałe makiety. Każdy stan interaktywny ma osobny wygląd:
			najechanie, fokus, naciśnięcie, wyłączenie i ładowanie.
		</p>
	</header>

	<section aria-labelledby="sys-color">
		<h2 id="sys-color">Kolory</h2>
		<ul class="swatches">
			{#each SWATCHES as swatch (swatch.variable)}
				<li>
					<span class="chip-color" style:background={`var(${swatch.variable})`}></span>
					<span class="swatch-name">{swatch.name}</span>
					<span class="swatch-role">{swatch.role}</span>
				</li>
			{/each}
		</ul>
	</section>

	<section aria-labelledby="sys-type">
		<h2 id="sys-type">Pismo</h2>
		<div class="type">
			<p
				style="font-family: var(--font-display); font-size: var(--tx-3xl); font-weight: 600; line-height: 1.1"
			>
				Wieża Xardasa
			</p>
			<p style="font-family: var(--font-display); font-size: var(--tx-xl); font-style: italic">
				Cormorant, nagłówki i podpisy na mapie
			</p>
			<p>
				Inter, interfejs i tekst ciągły. Podstawowa wielkość 15 px, wysokość linii 1,5, szerokość
				wiersza do 65 znaków.
			</p>
			<p class="small">
				Tekst pomocniczy: 13 px, kontrast co najmniej 4,5:1 na każdej powierzchni.
			</p>
		</div>
	</section>

	<section aria-labelledby="sys-buttons">
		<h2 id="sys-buttons">Przyciski</h2>
		<div class="matrix">
			<div class="row">
				<span class="label">Główny</span>
				<button type="button" class="btn primary">Pokaż na mapie</button>
				<button type="button" class="btn primary forced-hover">Najechanie</button>
				<button type="button" class="btn primary forced-focus">Fokus</button>
				<button type="button" class="btn primary" disabled>Wyłączony</button>
				<button type="button" class="btn primary loading" aria-busy="true"
					><LoaderIcon class="spin" size={16} aria-hidden="true" /> Wczytuję</button
				>
			</div>
			<div class="row">
				<span class="label">Drugoplanowy</span>
				<button type="button" class="btn">Zapisz</button>
				<button type="button" class="btn forced-hover">Najechanie</button>
				<button type="button" class="btn forced-focus">Fokus</button>
				<button type="button" class="btn" disabled>Wyłączony</button>
			</div>
			<div class="row">
				<span class="label">Cichy</span>
				<button type="button" class="btn ghost">Wyczyść</button>
				<button type="button" class="btn ghost forced-hover">Najechanie</button>
				<button type="button" class="btn ghost forced-focus">Fokus</button>
				<button type="button" class="btn ghost" disabled>Wyłączony</button>
			</div>
		</div>
	</section>

	<section aria-labelledby="sys-forms">
		<h2 id="sys-forms">Pola i filtry</h2>
		<div class="forms">
			<div class="form-field">
				<label for="sys-name">Nazwa postaci</label>
				<div class="field">
					<SearchIcon size={16} aria-hidden="true" /><input
						id="sys-name"
						bind:value={fieldValue}
						aria-describedby="sys-name-help"
						aria-invalid={fieldError ? 'true' : 'false'}
					/>
				</div>
				{#if fieldError}
					<p id="sys-name-help" class="error" role="alert">{fieldError}</p>
				{:else}
					<p id="sys-name-help" class="help">
						Wpisz imię lub fragment nazwy. Polskie litery są opcjonalne.
					</p>
				{/if}
			</div>
			<div class="chips" role="group" aria-label="Przykładowe filtry">
				<button type="button" class="chip" aria-pressed="false">Wyłączony filtr</button>
				<button type="button" class="chip" aria-pressed="true">Włączony filtr</button>
				<button type="button" class="chip" disabled>Niedostępny</button>
			</div>
		</div>
	</section>

	<section aria-labelledby="sys-pins">
		<h2 id="sys-pins">Znaczniki na mapie</h2>
		<p class="note">
			Rodzaj odróżnia kształt i ikona, nie sam kolor. Lokacje są rombami, reszta kołami.
		</p>
		<ul class="pins">
			{#each CATEGORY_DEFINITIONS as definition (definition.id)}
				<li>
					<span
						class="pin-sample"
						class:diamond={definition.id === 'location'}
						style:--pin-color={`var(${definition.colorVariable})`}
					>
						<CategoryIcon category={definition.id} size={14} tinted={false} />
					</span>
					{definition.label}
				</li>
			{/each}
		</ul>
	</section>

	<section aria-labelledby="sys-states">
		<h2 id="sys-states">Stany systemowe</h2>
		<div class="states">
			<div class="state cartouche">
				<h3>Ładowanie</h3>
				<div class="skeleton" aria-hidden="true">
					<span></span><span></span><span class="short"></span>
				</div>
				<p class="help">Szkielet zachowuje układ, więc strona nie skacze po wczytaniu.</p>
			</div>
			<div class="state cartouche">
				<h3>Pusty wynik</h3>
				<SearchIcon size={24} strokeWidth={1.4} aria-hidden="true" />
				<p>Brak wyników dla „kuźnia”. Sprawdź pisownię albo wybierz inny rodzaj.</p>
				<button type="button" class="btn">Wyczyść filtry</button>
			</div>
			<div class="state cartouche error-state" role="alert">
				<h3>Błąd wczytywania</h3>
				<CloudOffIcon size={24} strokeWidth={1.4} aria-hidden="true" />
				<p>Nie udało się wczytać danych świata. Sprawdź połączenie i spróbuj ponownie.</p>
				<button
					type="button"
					class="btn primary"
					class:loading={isReloading}
					disabled={isReloading}
					onclick={simulateReload}
				>
					{#if isReloading}<LoaderIcon class="spin" size={16} aria-hidden="true" /> Wczytuję{:else}<RefreshIcon
							size={16}
							aria-hidden="true"
						/> Spróbuj ponownie{/if}
				</button>
			</div>
		</div>
		<button type="button" class="btn" onclick={() => mockupState.showToast('Dodano do zakładek')}
			>Pokaż powiadomienie</button
		>
	</section>
</PageLayout>

<style>
	.head p {
		max-width: 62ch;
		margin-top: var(--s-2);
		color: var(--tekst-2);
	}

	section {
		margin-top: var(--s-6);
	}

	h2 {
		margin-bottom: var(--s-3);
		padding-bottom: var(--s-2);
		border-bottom: 1px solid var(--linia);
		font-size: var(--tx-xl);
		color: var(--mosiadz-jasny);
	}

	h3 {
		font-size: 1.25rem;
	}

	.swatches {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
		gap: var(--s-3);
	}

	.swatches li {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.chip-color {
		height: 52px;
		margin-bottom: 4px;
		border: 1px solid var(--linia-mocna);
		border-radius: var(--r-ostry);
	}

	.swatch-name {
		font-weight: 500;
		font-size: var(--tx-sm);
	}

	.swatch-role,
	.small,
	.help,
	.note {
		color: var(--tekst-2);
		font-size: var(--tx-xs);
	}

	.type {
		display: flex;
		flex-direction: column;
		gap: var(--s-2);
	}

	.matrix {
		display: flex;
		flex-direction: column;
		gap: var(--s-3);
	}

	.row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--s-3);
	}

	.label {
		width: 110px;
		color: var(--tekst-2);
		font-size: var(--tx-sm);
	}

	.forced-hover.primary {
		background: var(--mosiadz-jasny);
	}

	.forced-hover:not(.primary) {
		background: var(--kamien-3);
		border-color: var(--mosiadz-ciemny);
	}

	.forced-hover.ghost {
		background: var(--kamien-2);
		color: var(--tekst);
	}

	.forced-focus {
		outline: 2px solid var(--mosiadz-jasny);
		outline-offset: 2px;
	}

	:global(.spin) {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			rotate: 360deg;
		}
	}

	.forms {
		display: flex;
		flex-wrap: wrap;
		gap: var(--s-5);
		align-items: flex-start;
	}

	.form-field {
		display: flex;
		flex-direction: column;
		gap: 6px;
		width: 320px;
		max-width: 100%;
	}

	.form-field label {
		font-size: var(--tx-sm);
		font-weight: 500;
	}

	.field:has(input[aria-invalid='true']) {
		border-color: var(--rdza);
		background: var(--rdza-tlo);
	}

	.error {
		color: var(--rdza);
		font-size: var(--tx-xs);
	}

	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		padding-top: 24px;
	}

	.chip:disabled {
		opacity: 0.45;
	}

	.pins {
		display: flex;
		flex-wrap: wrap;
		gap: var(--s-5);
		margin-top: var(--s-3);
	}

	.pins li {
		display: flex;
		align-items: center;
		gap: var(--s-2);
	}

	.pin-sample {
		display: grid;
		place-items: center;
		width: 28px;
		height: 28px;
		border: 2px solid var(--pin-color);
		border-radius: 50%;
		background: var(--grafit);
		color: var(--pin-color);
	}

	.pin-sample.diamond {
		border-radius: 4px;
		rotate: 45deg;
	}

	.pin-sample.diamond :global(svg) {
		rotate: -45deg;
	}

	.states {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
		gap: var(--s-4);
		margin-bottom: var(--s-4);
	}

	.state {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: var(--s-3);
		padding: var(--s-5);
		color: var(--tekst-2);
	}

	.error-state :global(svg:first-of-type) {
		color: var(--rdza);
	}

	.skeleton {
		display: flex;
		flex-direction: column;
		gap: 10px;
		width: 100%;
	}

	.skeleton span {
		height: 12px;
		border-radius: 6px;
		background: linear-gradient(
				90deg,
				var(--kamien-2) 25%,
				var(--kamien-3) 50%,
				var(--kamien-2) 75%
			)
			0 0 / 200% 100%;
		animation: shimmer 1.4s linear infinite;
	}

	.skeleton .short {
		width: 55%;
	}

	@keyframes shimmer {
		to {
			background-position: -200% 0;
		}
	}
</style>
