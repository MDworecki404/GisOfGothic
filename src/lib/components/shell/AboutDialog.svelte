<script lang="ts">
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
	import GlobeIcon from '@lucide/svelte/icons/globe';
	import InfoIcon from '@lucide/svelte/icons/info';
	import HistoryIcon from '@lucide/svelte/icons/history';
	import BrandMark from './BrandMark.svelte';
	import * as Dialog from '#lib/components/ui/dialog/index.js';

	const repositoryUrl = 'https://github.com/MDworecki404/GisOfGothic';
	const authorUrl = 'https://dworecki.dev';
	const changelogUrl = 'https://github.com/MDworecki404/GisOfGothic/blob/main/CHANGELOG.md';
	const appVersion = __APP_VERSION__;

	interface Props {
		open?: boolean;
	}

	let { open: isOpen = $bindable(false) }: Props = $props();
</script>

<Dialog.Root bind:open={isOpen}>
	<Dialog.Trigger
		class="hidden size-11 shrink-0 items-center justify-center rounded-sm border border-border text-muted-foreground hover:border-torch/60 hover:text-foreground md:flex"
		title="O projekcie"
	>
		<InfoIcon class="size-4" />
		<span class="sr-only">O projekcie</span>
	</Dialog.Trigger>

	<Dialog.Content
		class="material-leather max-h-[calc(100dvh-2rem)] gap-0 overflow-y-auto rounded-md p-0 ring-0 sm:max-w-lg"
	>
		<div class="px-6 pt-8 pb-6 sm:px-9">
			<div class="flex items-center gap-4">
				<BrandMark />
				<div>
					<Dialog.Title class="text-display text-primary">GIS of Gothic</Dialog.Title>
					<Dialog.Description class="mt-0.5 text-muted-foreground">
						Trójwymiarowa wikipedia światów Gothic · wersja {appVersion}
					</Dialog.Description>
				</div>
			</div>

			<div class="mt-6 space-y-3 text-body leading-relaxed text-foreground/90">
				<p>
					Wybierz przedmiot, postać albo quest, a na trójwymiarowym modelu świata zobaczysz, gdzie
					go znaleźć. Są światy z Gothica 1, Gothica 2: Nocy Kruka, Archolosa i Gothica 3.
				</p>
				<p>
					Możesz zmierzyć odległość i sprawdzić profil terenu, zapisać zakładki i notatki, a pora
					dnia pokaże, gdzie postacie są o danej godzinie.
				</p>
				<p>
					Działa w przeglądarce, bez konta. Możesz też zainstalować ją jak zwykłą aplikację na
					telefonie albo komputerze.
				</p>
				<p class="text-sm text-muted-foreground">
					Opisy postaci i questów pochodzą z Gothicpedii, na licencji CC BY-SA. Z karty przejdziesz
					do jej wyszukiwarki.
				</p>
			</div>

			<ul class="mt-6 divide-y divide-border border-y border-border">
				<li>
					<a
						class="group flex min-h-11 items-center gap-3 py-3 hover:text-hover"
						href={repositoryUrl}
						target="_blank"
						rel="noopener noreferrer"
					>
						<svg viewBox="0 0 24 24" class="size-5 shrink-0 fill-current" aria-hidden="true">
							<path
								d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.37-3.87-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.69 1.25 3.35.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z"
							/>
						</svg>
						<span class="flex-1">
							<span class="block font-medium">Kod źródłowy</span>
							<span class="block text-sm text-muted-foreground"
								>github.com/MDworecki404/GisOfGothic</span
							>
						</span>
						<ExternalLinkIcon class="size-4 text-muted-foreground group-hover:text-primary" />
						<span class="sr-only">(otwiera się w nowej karcie)</span>
					</a>
				</li>
				<li>
					<a
						class="group flex min-h-11 items-center gap-3 py-3 hover:text-hover"
						href={changelogUrl}
						target="_blank"
						rel="noopener noreferrer"
					>
						<HistoryIcon class="size-5 shrink-0" />
						<span class="flex-1">
							<span class="block font-medium">Co nowego (wersja {appVersion})</span>
							<span class="block text-sm text-muted-foreground"
								>Lista zmian w kolejnych wydaniach</span
							>
						</span>
						<ExternalLinkIcon class="size-4 text-muted-foreground group-hover:text-primary" />
						<span class="sr-only">(otwiera się w nowej karcie)</span>
					</a>
				</li>
				<li>
					<a
						class="group flex min-h-11 items-center gap-3 py-3 hover:text-hover"
						href={authorUrl}
						target="_blank"
						rel="noopener noreferrer"
					>
						<GlobeIcon class="size-5 shrink-0" />
						<span class="flex-1">
							<span class="block font-medium">Autor: Marek Dworecki</span>
							<span class="block text-sm text-muted-foreground">dworecki.dev</span>
						</span>
						<ExternalLinkIcon class="size-4 text-muted-foreground group-hover:text-primary" />
						<span class="sr-only">(otwiera się w nowej karcie)</span>
					</a>
				</li>
			</ul>

			<p class="mt-5 text-caption leading-relaxed text-muted-foreground">
				Nieoficjalny projekt fanów, bez celów komercyjnych. Gothic i związane z nim nazwy należą do
				ich właścicieli. Autor nie jest związany z Piranha Bytes ani THQ Nordic.
			</p>
		</div>
	</Dialog.Content>
</Dialog.Root>
