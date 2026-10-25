import { describe, expect, it } from 'vitest';
import {
	KeyboardProjectionListener,
	type ProjectionKeyEvent
} from './keyboard-projection-listener.js';

class FakeEventSource {
	private listener: ((event: ProjectionKeyEvent) => void) | null = null;

	addEventListener(_type: 'keydown', listener: (event: ProjectionKeyEvent) => void): void {
		this.listener = listener;
	}

	removeEventListener(): void {
		this.listener = null;
	}

	press(event: Partial<ProjectionKeyEvent>): { wasPrevented: boolean } {
		const result = { wasPrevented: false };
		this.listener?.({
			code: 'KeyP',
			ctrlKey: false,
			altKey: false,
			metaKey: false,
			repeat: false,
			target: null,
			preventDefault: () => {
				result.wasPrevented = true;
			},
			...event
		});
		return result;
	}
}

function createTarget(
	selectorMatches: boolean
): EventTarget & { closest(selector: string): unknown } {
	return Object.assign(new EventTarget(), {
		closest: () => (selectorMatches ? {} : null)
	});
}

function start(): { source: FakeEventSource; toggles: () => number; stop: () => void } {
	const source = new FakeEventSource();
	let toggleCount = 0;
	const stop = new KeyboardProjectionListener(source, () => toggleCount++).start();
	return { source, toggles: () => toggleCount, stop };
}

describe('KeyboardProjectionListener', () => {
	it('klawisz P prosi o przełączenie rzutu i blokuje domyślną akcję', () => {
		const { source, toggles } = start();
		expect(source.press({}).wasPrevented).toBe(true);
		expect(toggles()).toBe(1);
	});

	it('ignoruje P z Ctrl, Alt albo Meta', () => {
		const { source, toggles } = start();
		source.press({ ctrlKey: true });
		source.press({ altKey: true });
		source.press({ metaKey: true });
		expect(toggles()).toBe(0);
	});

	it('ignoruje powtórzenia przytrzymanego klawisza', () => {
		const { source, toggles } = start();
		source.press({ repeat: true });
		expect(toggles()).toBe(0);
	});

	it('ignoruje P w polu tekstowym i innych elementach używających klawiszy', () => {
		const { source, toggles } = start();
		source.press({ target: createTarget(true) });
		expect(toggles()).toBe(0);
		source.press({ target: createTarget(false) });
		expect(toggles()).toBe(1);
	});

	it('ignoruje inne klawisze', () => {
		const { source, toggles } = start();
		source.press({ code: 'KeyQ' });
		expect(toggles()).toBe(0);
	});

	it('po zatrzymaniu nie reaguje', () => {
		const { source, toggles, stop } = start();
		stop();
		source.press({});
		expect(toggles()).toBe(0);
	});
});
