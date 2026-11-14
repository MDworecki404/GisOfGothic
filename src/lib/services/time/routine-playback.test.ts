import { describe, expect, it } from 'vitest';
import { RoutinePlayback, type FrameScheduler } from './routine-playback.js';

class ManualFrameScheduler implements FrameScheduler {
	private callback: ((timestampMilliseconds: number) => void) | null = null;
	private nextHandle = 1;
	readonly cancelledHandles: number[] = [];

	request(callback: (timestampMilliseconds: number) => void): number {
		this.callback = callback;
		return this.nextHandle++;
	}

	cancel(handle: number): void {
		this.cancelledHandles.push(handle);
		this.callback = null;
	}

	tick(timestampMilliseconds: number): void {
		const callback = this.callback;
		this.callback = null;
		callback?.(timestampMilliseconds);
	}
}

function createPlayback() {
	const scheduler = new ManualFrameScheduler();
	const advances: number[] = [];
	const playback = new RoutinePlayback(scheduler, (minutes) => advances.push(minutes));
	return { scheduler, advances, playback };
}

describe('RoutinePlayback', () => {
	it('przyrost godziny wynika z tempa i czasu rzeczywistego', () => {
		const { scheduler, advances, playback } = createPlayback();
		playback.start('fast');
		scheduler.tick(0);
		scheduler.tick(50);
		expect(advances).toHaveLength(1);
		expect(advances[0]).toBeCloseTo(0.2, 6);
	});

	it('wywołuje advance najwyżej co 50 ms', () => {
		const { scheduler, advances, playback } = createPlayback();
		playback.start('fast');
		for (const timestamp of [0, 16, 32, 48]) scheduler.tick(timestamp);
		expect(advances).toHaveLength(0);
		scheduler.tick(64);
		expect(advances).toHaveLength(1);
		expect(advances[0]).toBeCloseTo((64 / 1000) * 4, 6);
	});

	it('pojedyncza klatka nie przesuwa czasu o więcej niż 100 ms rzeczywistych', () => {
		const { scheduler, advances, playback } = createPlayback();
		playback.start('fast');
		scheduler.tick(0);
		scheduler.tick(5000);
		expect(advances[0]).toBeCloseTo(0.1 * 4, 6);
	});

	it('stop anuluje następną klatkę i zeruje isPlaying', () => {
		const { scheduler, advances, playback } = createPlayback();
		playback.start('game');
		expect(playback.isPlaying).toBe(true);
		playback.stop();
		expect(playback.isPlaying).toBe(false);
		expect(scheduler.cancelledHandles).toHaveLength(1);
		scheduler.tick(100);
		scheduler.tick(200);
		expect(advances).toHaveLength(0);
	});

	it('zmiana tempa w trakcie działa od następnej klatki', () => {
		const { scheduler, advances, playback } = createPlayback();
		playback.start('game');
		scheduler.tick(0);
		scheduler.tick(50);
		playback.setSpeed('fast');
		scheduler.tick(100);
		expect(advances[0]).toBeCloseTo(0.05 * 0.25, 6);
		expect(advances[1]).toBeCloseTo(0.05 * 4, 6);
	});

	it('ponowny start nie zostawia dwóch działających pętli', () => {
		const { scheduler, playback } = createPlayback();
		playback.start('game');
		playback.start('fast');
		expect(scheduler.cancelledHandles).toHaveLength(1);
	});
});
