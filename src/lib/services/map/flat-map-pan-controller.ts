import { ScreenSpaceEventHandler, ScreenSpaceEventType, type Viewer } from 'cesium';

/**
 * Przeciąganie mapy w widoku 2D. Własny obrót kamery Cesium (lewy przycisk) jest tam wyłączony, bo bez trafienia
 * w kafel obraca kamerę wokół globu i psuje północ oraz nachylenie. W rzucie ortogonalnym piksel to stała liczba
 * metrów, więc przesunięcie kursora zamienia się wprost na przesunięcie kamery w płaszczyźnie ekranu.
 */
export class FlatMapPanController {
	private inputHandler: ScreenSpaceEventHandler | null = null;
	private isDragging = false;

	/** @param readMetresPerPixel metry na piksel w rzucie ortogonalnym; `null`, gdy jeszcze nieznane */
	constructor(
		private readonly viewer: Viewer,
		private readonly readMetresPerPixel: () => number | null
	) {}

	start(): void {
		if (this.inputHandler) return;
		const handler = new ScreenSpaceEventHandler(this.viewer.scene.canvas);
		handler.setInputAction(() => {
			this.isDragging = true;
		}, ScreenSpaceEventType.LEFT_DOWN);
		handler.setInputAction(() => {
			this.isDragging = false;
		}, ScreenSpaceEventType.LEFT_UP);
		handler.setInputAction((movement: ScreenSpaceEventHandler.MotionEvent) => {
			if (this.isDragging) this.panBy(movement);
		}, ScreenSpaceEventType.MOUSE_MOVE);
		this.inputHandler = handler;
	}

	stop(): void {
		this.inputHandler?.destroy();
		this.inputHandler = null;
		this.isDragging = false;
	}

	private panBy(movement: ScreenSpaceEventHandler.MotionEvent): void {
		const metresPerPixel = this.readMetresPerPixel();
		if (metresPerPixel === null || !Number.isFinite(metresPerPixel)) return;
		const deltaX = movement.endPosition.x - movement.startPosition.x;
		const deltaY = movement.endPosition.y - movement.startPosition.y;
		const camera = this.viewer.camera;
		camera.moveLeft(deltaX * metresPerPixel);
		camera.moveUp(deltaY * metresPerPixel);
	}
}
