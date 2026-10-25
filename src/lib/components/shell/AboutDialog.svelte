<script lang="ts">
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
	import GlobeIcon from '@lucide/svelte/icons/globe';
	import InfoIcon from '@lucide/svelte/icons/info';
	import * as Dialog from '#lib/components/ui/dialog/index.js';

	const repositoryUrl = 'https://github.com/MDworecki404/GisOfGothic';
	const authorUrl = 'https://dworecki.dev';

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
		class="material-leather material-leather-riveted max-h-[calc(100dvh-2rem)] gap-0 overflow-y-auto rounded-md p-0 ring-0 sm:max-w-lg"
	>
		<div class="px-6 pt-8 pb-6 sm:px-9">
			<div class="flex items-center gap-4">
				<svg width="52" height="52" viewBox="0 0 64 64" aria-hidden="true" class="shrink-0">
					<path
						d="M32 62 C27 51 12 41 12 26 A20 20 0 1 1 52 26 C52 41 37 51 32 62 Z"
						fill="#2a2218"
						stroke="#c9a24a"
						stroke-width="3"
					/>
					<circle cx="32" cy="26.5" r="5" fill="#e0662f" />
				</svg>
				<div>
					<Dialog.Title class="text-display text-primary">GIS of Gothic</Dialog.Title>
					<Dialog.Description class="mt-0.5 text-muted-foreground">
						Trójwymiarowa wikipedia światów Gothic
					</Dialog.Description>
				</div>
			</div>

			<div class="mt-6 space-y-3 text-body leading-relaxed text-foreground/90">
				<p>
					Wiki Gothica mówi, że miecz leży „gdzieś w Górniczej Dolinie”. Tu zobaczysz, gdzie
					dokładnie: przedmioty i postacie są naniesione na model 3D świata gry, a stąd można
					zaplanować drogę.
				</p>
				<p>
					Jest wyszukiwarka, pomiary odległości i profil terenu, zakładki oraz suwak czasu.
					Aplikację zainstalujesz na telefonie albo komputerze. Konta nie potrzebujesz.
				</p>
				<p class="text-sm text-muted-foreground">
					Opisy postaci i questów znajdziesz w Gothicpedii (CC BY-SA) — ich karty prowadzą do jej
					wyszukiwarki.
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
				Projekt fanowski, niekomercyjny. Gothic i powiązane nazwy należą do ich właścicieli; autor
				nie jest związany z Piranha Bytes ani THQ Nordic.
			</p>
		</div>
	</Dialog.Content>
</Dialog.Root>
