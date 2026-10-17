const DEFAULT_WINDOW_MILLISECONDS = 4000;
const STALL_MILLISECONDS = 1000;

/**
 * Liczy średnie FPS w kolejnych oknach czasu. Przerwa między klatkami dłuższa niż sekunda
 * (karta w tle, uśpiony ekran) unieważnia bieżące okno, żeby nie była liczona jako spadek wydajności.
 */
export class FrameRateMonitor {
	private windowStartMilliseconds: number | null = null;
	private previousFrameMilliseconds: number | null = null;
	private framesInWindow = 0;

	constructor(private readonly windowMilliseconds = DEFAULT_WINDOW_MILLISECONDS) {}

	/** Zwraca średnie FPS, gdy okno się zamknęło; w trakcie okna zwraca `null`. */
	recordFrame(timestampMilliseconds: number): number | null {
		const previous = this.previousFrameMilliseconds;
		this.previousFrameMilliseconds = timestampMilliseconds;
		if (previous === null || timestampMilliseconds - previous > STALL_MILLISECONDS) {
			this.windowStartMilliseconds = timestampMilliseconds;
			this.framesInWindow = 0;
			return null;
		}
		this.framesInWindow++;
		const elapsed = timestampMilliseconds - (this.windowStartMilliseconds ?? timestampMilliseconds);
		if (elapsed < this.windowMilliseconds) return null;
		const framesPerSecond = (this.framesInWindow / elapsed) * 1000;
		this.windowStartMilliseconds = timestampMilliseconds;
		this.framesInWindow = 0;
		return framesPerSecond;
	}

	restartWindow(): void {
		this.windowStartMilliseconds = null;
		this.previousFrameMilliseconds = null;
		this.framesInWindow = 0;
	}
}
