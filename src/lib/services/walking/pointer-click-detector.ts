const MAXIMUM_CLICK_TRAVEL_PIXELS = 5;
const MAXIMUM_CLICK_DURATION_MILLISECONDS = 450;

/**
 * Odróżnia kliknięcie od przeciągnięcia: kliknięciem jest dotyk lub przycisk puszczony szybko i prawie
 * w tym samym miejscu, w którym został wciśnięty. Przeciągnięcie służy wtedy do rozglądania się.
 */
export class PointerClickDetector {
	private startX = 0;
	private startY = 0;
	private startMilliseconds = 0;
	private hasTravelledTooFar = false;
	private isPressed = false;

	press(x: number, y: number, nowMilliseconds: number): void {
		this.startX = x;
		this.startY = y;
		this.startMilliseconds = nowMilliseconds;
		this.hasTravelledTooFar = false;
		this.isPressed = true;
	}

	move(x: number, y: number): void {
		if (!this.isPressed) return;
		if (Math.hypot(x - this.startX, y - this.startY) > MAXIMUM_CLICK_TRAVEL_PIXELS) {
			this.hasTravelledTooFar = true;
		}
	}

	/** Kończy gest i mówi, czy był kliknięciem. */
	release(nowMilliseconds: number): boolean {
		const wasClick =
			this.isPressed &&
			!this.hasTravelledTooFar &&
			nowMilliseconds - this.startMilliseconds <= MAXIMUM_CLICK_DURATION_MILLISECONDS;
		this.isPressed = false;
		return wasClick;
	}

	cancel(): void {
		this.isPressed = false;
	}
}
