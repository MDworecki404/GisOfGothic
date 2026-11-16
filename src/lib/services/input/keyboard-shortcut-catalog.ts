import { TOOL_IDS, TOOL_LABELS, type ToolId } from '#lib/services/tools/tool-id.js';

export type KeyboardShortcutGroup =
	| 'Ogólne'
	| 'Narzędzia'
	| 'Mapa i kamera'
	| 'Warstwy i czas'
	| 'Pomiary i przewodnik'
	| 'Lot kamerą'
	| 'Spacer';

export interface ShortcutTrigger {
	codes: readonly string[];
	requiresShift: boolean;
	requiresCommand: boolean;
}

export interface KeyboardShortcut {
	trigger: ShortcutTrigger;
	allowsRepeat: boolean;
	run: () => void;
}

export interface KeyboardShortcutHelpEntry {
	group: KeyboardShortcutGroup;
	keyLabel: string;
	description: string;
}

/** Zamiary, które skróty zgłaszają aplikacji; implementuje je fasada. */
export interface KeyboardShortcutActions {
	openSearch(): void;
	selectTool(toolId: ToolId): void;
	zoomIn(): void;
	zoomOut(): void;
	showWholeWorld(): void;
	turnMapToNorth(): void;
	toggleCameraProjection(): void;
	toggleViewMode(): void;
	showTopDownView(): void;
	showObliqueView(): void;
	toggleContours(): void;
	toggleGrid(): void;
	toggleStaticObjects(): void;
	toggleWalking(): void;
	toggleCharactersAtTimeOfDay(): void;
	switchToNextCoordinateSystem(): void;
	moveQuestGuideToPreviousStep(): void;
	moveQuestGuideToNextStep(): void;
	removeLastMeasurementPoint(): void;
	clearMeasurement(): void;
}

interface ShortcutDefinition {
	group: KeyboardShortcutGroup;
	keyLabel: string;
	description: string;
	codes: readonly string[];
	requiresShift?: boolean;
	requiresCommand?: boolean;
	allowsRepeat?: boolean;
	run: () => void;
}

const INFORMATIONAL_ENTRIES: readonly KeyboardShortcutHelpEntry[] = [
	{ group: 'Ogólne', keyLabel: 'Esc', description: 'Zamknij okno, menu albo panel narzędzia' },
	{ group: 'Ogólne', keyLabel: '?', description: 'Pokaż tę ściągę' },
	{ group: 'Lot kamerą', keyLabel: 'W A S D', description: 'Przód, lewo, tył, prawo' },
	{ group: 'Lot kamerą', keyLabel: 'Q E', description: 'W dół i w górę' },
	{ group: 'Lot kamerą', keyLabel: '← →', description: 'Obrót' },
	{ group: 'Lot kamerą', keyLabel: '↑ ↓', description: 'Pochylenie spojrzenia' },
	{ group: 'Lot kamerą', keyLabel: 'Shift', description: 'Przyspieszenie lotu' },
	{ group: 'Spacer', keyLabel: 'W A S D', description: 'Idź (Shift – biegnij)' },
	{ group: 'Spacer', keyLabel: '← → ↑ ↓', description: 'Rozglądaj się' },
	{ group: 'Spacer', keyLabel: 'Przeciągnięcie', description: 'Rozglądaj się myszą lub palcem' }
];

/**
 * Jedno źródło prawdy o skrótach klawiszowych: z tej listy korzysta nasłuch klawiatury
 * (`KeyboardShortcutListener`) i okno ściągi. Klawisze rozpoznajemy po fizycznym położeniu (`code`),
 * więc działają przy dowolnym układzie klawiatury. Lot kamerą (WASD, strzałki, Q/E) obsługuje osobno
 * `KeyboardFlightListener`, bo wymaga puszczania klawiszy; tutaj tylko trafia do ściągi.
 */
export class KeyboardShortcutCatalog {
	private readonly definitions: readonly ShortcutDefinition[];

	constructor(actions: KeyboardShortcutActions) {
		this.definitions = [
			{
				group: 'Ogólne',
				keyLabel: 'Ctrl K',
				description: 'Otwórz Księgę i wyszukiwarkę',
				codes: ['KeyK'],
				requiresCommand: true,
				run: () => actions.openSearch()
			},
			{
				group: 'Ogólne',
				keyLabel: '/',
				description: 'Otwórz Księgę i wyszukiwarkę',
				codes: ['Slash'],
				run: () => actions.openSearch()
			},
			...TOOL_IDS.map((toolId, index): ShortcutDefinition => ({
				group: 'Narzędzia',
				keyLabel: String(index + 1),
				description: TOOL_LABELS[toolId],
				codes: [`Digit${index + 1}`, `Numpad${index + 1}`],
				run: () => actions.selectTool(toolId)
			})),
			{
				group: 'Mapa i kamera',
				keyLabel: '+',
				description: 'Przybliż',
				codes: ['Equal', 'NumpadAdd'],
				allowsRepeat: true,
				run: () => actions.zoomIn()
			},
			{
				group: 'Mapa i kamera',
				keyLabel: '−',
				description: 'Oddal',
				codes: ['Minus', 'NumpadSubtract'],
				allowsRepeat: true,
				run: () => actions.zoomOut()
			},
			{
				group: 'Mapa i kamera',
				keyLabel: '0',
				description: 'Pokaż cały świat',
				codes: ['Digit0', 'Numpad0'],
				run: () => actions.showWholeWorld()
			},
			{
				group: 'Mapa i kamera',
				keyLabel: 'N',
				description: 'Obróć mapę na północ',
				codes: ['KeyN'],
				run: () => actions.turnMapToNorth()
			},
			{
				group: 'Mapa i kamera',
				keyLabel: 'P',
				description: 'Przełącz rzut: perspektywiczny i ortogonalny',
				codes: ['KeyP'],
				run: () => actions.toggleCameraProjection()
			},
			{
				group: 'Mapa i kamera',
				keyLabel: 'V',
				description: 'Przełącz widok 3D i 2D',
				codes: ['KeyV'],
				run: () => actions.toggleViewMode()
			},
			{
				group: 'Mapa i kamera',
				keyLabel: 'T',
				description: 'Spójrz z góry',
				codes: ['KeyT'],
				run: () => actions.showTopDownView()
			},
			{
				group: 'Mapa i kamera',
				keyLabel: 'Shift T',
				description: 'Spójrz ukośnie',
				codes: ['KeyT'],
				requiresShift: true,
				run: () => actions.showObliqueView()
			},
			{
				group: 'Mapa i kamera',
				keyLabel: 'C',
				description: 'Zmień układ współrzędnych',
				codes: ['KeyC'],
				run: () => actions.switchToNextCoordinateSystem()
			},
			{
				group: 'Mapa i kamera',
				keyLabel: 'F',
				description: 'Spacer pierwszoosobowy (włącz i wyłącz)',
				codes: ['KeyF'],
				run: () => actions.toggleWalking()
			},
			{
				group: 'Warstwy i czas',
				keyLabel: 'K',
				description: 'Poziomice',
				codes: ['KeyK'],
				run: () => actions.toggleContours()
			},
			{
				group: 'Warstwy i czas',
				keyLabel: 'G',
				description: 'Siatka',
				codes: ['KeyG'],
				run: () => actions.toggleGrid()
			},
			{
				group: 'Warstwy i czas',
				keyLabel: 'O',
				description: 'Obiekty świata',
				codes: ['KeyO'],
				run: () => actions.toggleStaticObjects()
			},
			{
				group: 'Warstwy i czas',
				keyLabel: 'H',
				description: 'Postacie o wybranej godzinie',
				codes: ['KeyH'],
				run: () => actions.toggleCharactersAtTimeOfDay()
			},
			{
				group: 'Pomiary i przewodnik',
				keyLabel: 'Backspace',
				description: 'Cofnij ostatni punkt pomiaru',
				codes: ['Backspace'],
				run: () => actions.removeLastMeasurementPoint()
			},
			{
				group: 'Pomiary i przewodnik',
				keyLabel: 'Delete',
				description: 'Wyczyść pomiar',
				codes: ['Delete'],
				run: () => actions.clearMeasurement()
			},
			{
				group: 'Pomiary i przewodnik',
				keyLabel: '[',
				description: 'Przewodnik po queście: wstecz',
				codes: ['BracketLeft'],
				run: () => actions.moveQuestGuideToPreviousStep()
			},
			{
				group: 'Pomiary i przewodnik',
				keyLabel: ']',
				description: 'Przewodnik po queście: dalej',
				codes: ['BracketRight'],
				run: () => actions.moveQuestGuideToNextStep()
			}
		];
	}

	listShortcuts(): readonly KeyboardShortcut[] {
		return this.definitions.map((definition) => ({
			trigger: {
				codes: definition.codes,
				requiresShift: definition.requiresShift ?? false,
				requiresCommand: definition.requiresCommand ?? false
			},
			allowsRepeat: definition.allowsRepeat ?? false,
			run: definition.run
		}));
	}

	listHelpEntries(): readonly KeyboardShortcutHelpEntry[] {
		return [
			...this.definitions.map(({ group, keyLabel, description }) => ({
				group,
				keyLabel,
				description
			})),
			...INFORMATIONAL_ENTRIES
		];
	}
}
