/**
 * Czy na mapie widać ekranowe joysticki lotu. To wyłącznie stan interfejsu: domyślnie
 * joysticki są wyłączone, żeby nie zasłaniały mapy; włącza je przycisk przy zoomie.
 */
export class FlightControlsState {
	areSticksShown: boolean;

	constructor(areSticksShownInitially: boolean) {
		this.areSticksShown = $state(areSticksShownInitially);
	}

	toggleSticks(): void {
		this.areSticksShown = !this.areSticksShown;
	}
}
