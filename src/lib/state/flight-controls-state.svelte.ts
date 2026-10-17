/**
 * Czy na mapie widać ekranowe joysticki lotu. To wyłącznie stan interfejsu: domyślnie
 * joysticki są włączone na urządzeniach z ekranem dotykowym i wyłączone przy myszy.
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
