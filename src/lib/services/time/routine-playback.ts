export type PlaybackSpeed = 'game' | 'fast' | 'very-fast';

/** Minuty gry na sekundę rzeczywistą: „jak w grze” to minuta na 4 s, „szybko” 4 minuty na sekundę, „bardzo szybko” godzina na sekundę. */
export const PLAYBACK_MINUTES_PER_SECOND: Readonly<Record<PlaybackSpeed, number>> = {
	game: 0.25,
	fast: 4,
	'very-fast': 60
};

const MINIMUM_UPDATE_INTERVAL_MILLISECONDS = 50;
const MAXIMUM_FRAME_MILLISECONDS = 100;

export interface FrameScheduler {
	request(callback: (timestampMilliseconds: number) => void): number;
	cancel(handle: number): void;
}

export function createBrowserFrameScheduler(): FrameScheduler {
	return {
		request: (callback) => requestAnimationFrame(callback),
		cancel: (handle) => cancelAnimationFrame(handle)
	};
}

/**
 * Pętla odtwarzania doby: z każdej klatki liczy czas rzeczywisty i oddaje przyrost minut gry
 * najwyżej co 50 ms (20 razy na sekundę). Jedna klatka liczy się za najwyżej 100 ms, żeby powrót
 * z ukrytej karty nie przeskoczył godzin.
 */
export class RoutinePlayback {
	private speed: PlaybackSpeed = 'game';
	private handle: number | null = null;
	private lastTimestamp: number | null = null;
	private accumulatedMilliseconds = 0;

	constructor(
		private readonly scheduler: FrameScheduler,
		private readonly advance: (elapsedGameMinutes: number) => void
	) {}

	get isPlaying(): boolean {
		return this.handle !== null;
	}

	start(speed: PlaybackSpeed): void {
		this.stop();
		this.speed = speed;
		this.lastTimestamp = null;
		this.accumulatedMilliseconds = 0;
		this.scheduleNextFrame();
	}

	setSpeed(speed: PlaybackSpeed): void {
		this.speed = speed;
	}

	stop(): void {
		if (this.handle !== null) this.scheduler.cancel(this.handle);
		this.handle = null;
	}

	private scheduleNextFrame(): void {
		this.handle = this.scheduler.request((timestamp) => this.runFrame(timestamp));
	}

	private runFrame(timestamp: number): void {
		if (this.lastTimestamp !== null) {
			this.accumulatedMilliseconds += Math.min(
				timestamp - this.lastTimestamp,
				MAXIMUM_FRAME_MILLISECONDS
			);
		}
		this.lastTimestamp = timestamp;
		if (this.accumulatedMilliseconds >= MINIMUM_UPDATE_INTERVAL_MILLISECONDS) {
			const elapsedSeconds = this.accumulatedMilliseconds / 1000;
			this.accumulatedMilliseconds = 0;
			this.advance(elapsedSeconds * PLAYBACK_MINUTES_PER_SECOND[this.speed]);
		}
		if (this.handle !== null) this.scheduleNextFrame();
	}
}
