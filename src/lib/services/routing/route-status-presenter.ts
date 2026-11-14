import type { RouteView } from '#lib/services/measurement/measurement-coordinator.js';

/** Zamienia stan trasy na teksty dla panelu Pomiary. */
export class RouteStatusPresenter {
	/** Komunikat, gdy trasy (jeszcze) nie widać; `null`, gdy trasa jest znaleziona. */
	describeStatus(route: RouteView): string | null {
		if (route.availability === 'unavailable') return 'Ten świat nie ma sieci dróg z gry.';
		if (route.availability === 'loading') return 'Wczytuję sieć dróg…';
		if (!route.hasStart) return 'Kliknij początek trasy na mapie.';
		if (!route.hasEnd) return 'Kliknij cel trasy.';
		if (route.outcome === 'too-far-from-network') {
			return 'W pobliżu nie ma dróg z gry. Wybierz punkt bliżej drogi.';
		}
		if (route.outcome === 'no-path') return 'Nie ma drogi między tymi miejscami w sieci gry.';
		return null;
	}

	describeApproach(route: RouteView, formatLength: (metres: number) => string): string | null {
		const approachMetres = route.startApproachMetres + route.endApproachMetres;
		return approachMetres > 0 ? `Dojście poza siecią dróg: ${formatLength(approachMetres)}` : null;
	}
}
