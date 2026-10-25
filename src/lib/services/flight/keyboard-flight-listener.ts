import { isKeyboardTargetUsingKeysItself } from '#lib/services/input/keyboard-focus-guard.js';
import type { FlightInput } from './flight-input.js';
import { KeyboardFlightMapper } from './keyboard-flight-mapper.js';

/**
 * Nasłuchuje klawiatury na podanym oknie i zgłasza zamiar lotu po każdej zmianie. Pomija klawisze
 * naciśnięte w polach tekstowych, suwakach i oknach dialogowych (tam strzałki mają własne znaczenie)
 * oraz z Ctrl/Alt/Meta, żeby nie przejmować skrótów przeglądarki. Utrata fokusu puszcza wszystkie klawisze.
 */
export class KeyboardFlightListener {
	private readonly mapper = new KeyboardFlightMapper();

	constructor(
		private readonly eventSource: Window,
		private readonly reportInput: (input: FlightInput) => void
	) {}

	start(): () => void {
		this.eventSource.addEventListener('keydown', this.reactToKeyDown);
		this.eventSource.addEventListener('keyup', this.reactToKeyUp);
		this.eventSource.addEventListener('blur', this.releaseEverything);
		return () => {
			this.eventSource.removeEventListener('keydown', this.reactToKeyDown);
			this.eventSource.removeEventListener('keyup', this.reactToKeyUp);
			this.eventSource.removeEventListener('blur', this.releaseEverything);
			this.releaseEverything();
		};
	}

	private readonly reactToKeyDown = (event: KeyboardEvent): void => {
		if (!this.mapper.isControlledKey(event.code)) return;
		if (event.ctrlKey || event.altKey || event.metaKey) return;
		if (isKeyboardTargetUsingKeysItself(event.target)) return;
		event.preventDefault();
		this.mapper.pressKey(event.code);
		this.reportInput(this.mapper.readInput());
	};

	private readonly reactToKeyUp = (event: KeyboardEvent): void => {
		if (!this.mapper.isControlledKey(event.code)) return;
		this.mapper.releaseKey(event.code);
		this.reportInput(this.mapper.readInput());
	};

	private readonly releaseEverything = (): void => {
		this.mapper.releaseAllKeys();
		this.reportInput(this.mapper.readInput());
	};
}
