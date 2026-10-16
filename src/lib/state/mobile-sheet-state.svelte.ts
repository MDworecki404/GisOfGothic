import type { AppEventBus } from '#lib/events/app-events.js';
import {
	findHigherSheetDetent,
	findLowerSheetDetent,
	findNextSheetDetent,
	type SheetDetent
} from './sheet-detents.js';

/**
 * Stan arkusza panelu narzędzia na telefonie (zwinięty, połowa, pełny ekran) i trwającego przeciągania.
 * To wyłącznie stan interfejsu — logika aplikacji go nie zna. Wybranie narzędzia otwiera arkusz do połowy.
 */
export class MobileSheetState {
	detent = $state<SheetDetent>('half');
	isDragging = $state(false);

	constructor(eventBus: AppEventBus) {
		eventBus.subscribe('tool-selected', ({ toolId }) => {
			if (toolId !== null) this.detent = 'half';
		});
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
