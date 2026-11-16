import { isKeyboardTargetUsingKeysItself } from './keyboard-focus-guard.js';
import type { KeyboardShortcut } from './keyboard-shortcut-catalog.js';

export interface ShortcutKeyEvent {
	code: string;
	ctrlKey: boolean;
	altKey: boolean;
	metaKey: boolean;
	shiftKey: boolean;
	repeat: boolean;
	target: EventTarget | null;
	preventDefault(): void;
}

export interface ShortcutKeyEventSource {
	addEventListener(type: 'keydown', listener: (event: ShortcutKeyEvent) => void): void;
	removeEventListener(type: 'keydown', listener: (event: ShortcutKeyEvent) => void): void;
}

/**
 * Nasłuchuje klawiatury i uruchamia pasujący skrót. Skróty bez Ctrl/Cmd pomijają klawisze naciśnięte
 * w polach, które same ich używają (pola tekstowe, suwaki, okna dialogowe, listy, menu), oraz klawisze
 * z Alt; powtórzenia przytrzymanego klawisza przechodzą tylko dla skrótów, które na to pozwalają.
 */
export class KeyboardShortcutListener {
	constructor(
		private readonly eventSource: ShortcutKeyEventSource,
		private readonly shortcuts: readonly KeyboardShortcut[]
	) {}

	start(): () => void {
		this.eventSource.addEventListener('keydown', this.reactToKeyDown);
		return () => this.eventSource.removeEventListener('keydown', this.reactToKeyDown);
	}

	private readonly reactToKeyDown = (event: ShortcutKeyEvent): void => {
		if (event.altKey) return;
		const hasCommandKey = event.ctrlKey || event.metaKey;
		const shortcut = this.shortcuts.find(
			({ trigger }) =>
				trigger.codes.includes(event.code) &&
				trigger.requiresShift === event.shiftKey &&
				trigger.requiresCommand === hasCommandKey
		);
		if (!shortcut) return;
		if (!hasCommandKey && isKeyboardTargetUsingKeysItself(event.target)) return;
		event.preventDefault();
		if (event.repeat && !shortcut.allowsRepeat) return;
		shortcut.run();
	};
}
