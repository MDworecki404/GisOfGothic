<script lang="ts">
	import { router, type ViewId } from '../state/router.svelte.js';

	interface MockupEntry {
		view: ViewId;
		param: string | null;
		title: string;
		description: string;
		origin: 'existing' | 'proposal';
	}

	const MOCKUPS: readonly MockupEntry[] = [
		{
			view: 'atlas',
			param: null,
			title: 'Atlas: główny widok mapy',
			description:
				'Mapa z liniami współrzędnych, filtrami rodzajów, warstwami, czasem, pomiarami i panelem szczegółów.',
			origin: 'existing'
		},
		{
			view: 'location',
			param: 'wieza-xardasa',
			title: 'Karta lokacji',
			description:
				'Ilustracja, opis, fakty i powiązane postacie, przedmioty, potwory oraz zadania.',
			origin: 'existing'
		},
		{
			view: 'character',
			param: 'lord-hagen',
			title: 'Karta postaci',
			description: 'Rutyna dnia na tarczy 24 godzin, gildia, wyposażenie i zadania.',
			origin: 'existing'
		},
		{
			view: 'quests',
			param: null,
			title: 'Przewodnik po zadaniach',
			description: 'Lista zadań z filtrem rozdziału, kroki i trasa na mapie.',
			origin: 'existing'
		},
		{
			view: 'worlds',
			param: null,
			title: 'Światy i porównanie',
			description: 'Wybór gry i świata oraz porównanie rozmiarów obszarów.',
			origin: 'existing'
		},
		{
			view: 'system',
			param: null,
			title: 'Katalog komponentów i stanów',
			description: 'Przyciski, pola, chipy, błędy, puste wyniki, ładowanie i tokeny.',
			origin: 'existing'
		},
		{
			view: 'trails',
			param: null,
			title: 'Szlaki tematyczne',
			description: 'Propozycja nowego modułu: kuratorskie trasy po świecie, np. „Śladami Xardasa”.',
			origin: 'proposal'
		}
	];

	const TIPS = [
		'Ctrl+K lub „/” otwiera wyszukiwarkę',
		'Kółko myszy i szczypanie przybliżają mapę, przeciągnięcie ją przesuwa',
		'Na mapie strzałki przesuwają widok, plus i minus przybliżają, zero wraca do całości',
		'Zmień szerokość okna, aby zobaczyć układ tabletowy i telefoniczny'
	];
</script>

<main class="index">
	<header>
		<p class="mark">Atlas Gothic</p>
		<h1>Makiety interfejsu geoportalu</h1>
		<p class="lead">
			Nowy kierunek wizualny: atlas z ciemnego kamienia i mosiądzu. Wszystkie ekrany działają na
			przykładowych danych i nie łączą się z żadnym serwerem.
		</p>
	</header>

	<ol class="toc" aria-label="Spis makiet">
		{#each MOCKUPS as mockup (mockup.view)}
			<li>
				<a href={router.buildHref(mockup.view, mockup.param)}>
					<span class="title">{mockup.title}</span>
					<span class="leader" aria-hidden="true"></span>
					<span class="badge" class:proposal={mockup.origin === 'proposal'}>
						{mockup.origin === 'existing' ? 'Istniejąca funkcja' : 'Propozycja'}
					</span>
					<span class="description">{mockup.description}</span>
				</a>
			</li>
		{/each}
	</ol>

	<aside class="tips">
		<h2>Jak testować</h2>
		<ul>
			{#each TIPS as tip (tip)}
				<li>{tip}</li>
			{/each}
		</ul>
	</aside>
</main>

<style>
	.index {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1.5fr);
		grid-template-areas:
			'head toc'
			'tips toc';
		align-content: center;
		gap: var(--s-6) var(--s-7);
		height: 100dvh;
		padding: var(--s-7) clamp(24px, 7vw, 120px);
		overflow-y: auto;
		background:
			radial-gradient(ellipse at 20% 0%, rgb(196 161 95 / 0.07), transparent 60%), var(--grafit);
	}

	header {
		grid-area: head;
		align-self: end;
	}

	.mark {
		margin-bottom: var(--s-3);
		color: var(--mosiadz-jasny);
		font-family: var(--font-display);
		font-size: var(--tx-xl);
		font-style: italic;
	}

	h1 {
		font-size: clamp(2.25rem, 4.6vw, 3.75rem);
	}

	.lead {
		max-width: 44ch;
		margin-top: var(--s-4);
		color: var(--tekst-2);
		font-size: var(--tx-lg);
		line-height: 1.6;
	}

	.toc {
		grid-area: toc;
		align-self: center;
	}

	.toc li + li {
		border-top: 1px solid var(--linia);
	}

	.toc a {
		display: grid;
		grid-template-columns: auto 1fr auto;
		align-items: baseline;
		column-gap: var(--s-3);
		padding: var(--s-4) var(--s-2);
		color: var(--tekst);
		text-decoration: none;
		transition: background var(--czas-krotki) ease;
	}

	.toc a:hover {
		background: var(--kamien-1);
	}

	.title {
		font-family: var(--font-display);
		font-size: var(--tx-xl);
		font-weight: 600;
	}

	.toc a:hover .title {
		color: var(--mosiadz-jasny);
	}

	.leader {
		align-self: end;
		margin-bottom: 7px;
		border-bottom: 1px dotted var(--linia-mocna);
	}

	.badge {
		color: var(--oliwka);
		font-size: var(--tx-xs);
	}

	.badge.proposal {
		color: var(--mosiadz-jasny);
	}

	.description {
		grid-column: 1 / -1;
		max-width: 62ch;
		margin-top: 2px;
		color: var(--tekst-2);
		font-size: var(--tx-sm);
	}

	.tips {
		grid-area: tips;
		align-self: start;
		padding-left: var(--s-4);
		border-left: 2px solid var(--mosiadz-ciemny);
	}

	.tips h2 {
		margin-bottom: var(--s-2);
		font-size: 1.25rem;
	}

	.tips li {
		padding: 3px 0;
		color: var(--tekst-2);
		font-size: var(--tx-sm);
	}

	@media (max-width: 63.99rem) {
		.index {
			grid-template-columns: 1fr;
			grid-template-areas:
				'head'
				'toc'
				'tips';
			height: auto;
			min-height: 100dvh;
			padding: var(--s-6) var(--s-4);
		}

		.badge {
			grid-column: 3;
		}
	}

	:global(body:has(.index)) {
		overflow-y: auto;
	}
</style>
