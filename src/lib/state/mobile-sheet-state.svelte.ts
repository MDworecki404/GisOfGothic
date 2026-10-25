import type { AppEventBus } from '#lib/events/app-events.js';
import {
	findHigherSheetDetent,
	findLowerSheetDetent,
	findNextSheetDetent,
	type SheetDetent
} from './sheet-detents.js';

/**
 * Stan arkusza panelu narzędzia na telefonie (zwinięty, połowa, pełny ekran) i trwającego przeciągania.
 * To wyłącznie stan interfejsu — logika aplikacji go nie zna. Po otwarciu świata arkusz jest zwinięty
 * (widać tylko nagłówek), żeby mapa zajmowała ekran — także gdy widok z adresu przywraca narzędzie.
 * Każde późniejsze wybranie narzędzia otwiera arkusz do połowy.
 */
export class MobileSheetState {
	detent = $state<SheetDetent>('collapsed');
	isDragging = $state(false);
	private isRestoringOpenedWorldView = false;

	constructor(eventBus: AppEventBus) {
		eventBus.subscribe('world-opened', () => {
			this.detent = 'collapsed';
			this.isRestoringOpenedWorldView = true;
		});
		eventBus.subscribe('tool-selected', ({ toolId }) => {
			if (this.isRestoringOpenedWorldView) {
				this.isRestoringOpenedWorldView = false;
				return;
			}
			if (toolId !== null) this.detent = 'half';
		});
	}

	expandIfCollapsed(): void {
		if (this.detent === 'collapsed') this.detent = 'half';
	}

	setDetent(detent: SheetDetent): void {
		this.detent = detent;
	}

	moveToNextDetent(): void {
		this.detent = findNextSheetDetent(this.detent);
	}

	moveToHigherDetent(): void {
		this.detent = findHigherSheetDetent(this.detent);
	}

	moveToLowerDetent(): void {
		this.detent = findLowerSheetDetent(this.detent);
	}
}
