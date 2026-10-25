import { isKeyboardTargetUsingKeysItself } from '#lib/services/input/keyboard-focus-guard.js';

const PROJECTION_KEY_CODE = 'KeyP';

export interface ProjectionKeyEvent {
	code: string;
	ctrlKey: boolean;
	altKey: boolean;
	metaKey: boolean;
	repeat: boolean;
	target: EventTarget | null;
	preventDefault(): void;
}

export interface ProjectionKeyEventSource {
	addEventListener(type: 'keydown', listener: (event: ProjectionKeyEvent) => void): void;
	removeEventListener(type: 'keydown', listener: (event: ProjectionKeyEvent) => void): void;
}

/**
 * Nasłuchuje klawisza P i prosi o przełączenie rzutu kamery. Pomija skróty z Ctrl/Alt/Meta,
 * powtórzenia przytrzymanego klawisza oraz klawisze naciśnięte w polach, które same ich używają.
 */
export class KeyboardProjectionListener {
	constructor(
		private readonly eventSource: ProjectionKeyEventSource,
		private readonly requestToggle: () => void
	) {}

	start(): () => void {
		this.eventSource.addEventListener('keydown', this.reactToKeyDown);
		return () => this.eventSource.removeEventListener('keydown', this.reactToKeyDown);
	}

	private readonly reactToKeyDown = (event: ProjectionKeyEvent): void => {
		if (event.code !== PROJECTION_KEY_CODE || event.repeat) return;
		if (event.ctrlKey || event.altKey || event.metaKey) return;
		if (isKeyboardTargetUsingKeysItself(event.target)) return;
		event.preventDefault();
		this.requestToggle();
	};
}
