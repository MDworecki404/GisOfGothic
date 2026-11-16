/**
 * Stan przycisków paska sterowania jednym podglądem 3D: czy model obraca się sam i czy podgląd
 * jest na pełnym ekranie. To wyłącznie dane interfejsu; kamerą steruje `ModelPreview`.
 */
export class ModelPreviewControlsState {
	isAutoRotating: boolean;
	isFullscreen: boolean;

	constructor() {
		this.isAutoRotating = $state(false);
		this.isFullscreen = $state(false);
	}
}
