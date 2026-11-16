import { ModelPreviewControlsState } from '#lib/state/model-preview-controls-state.svelte.js';
import { ModelPreview, type PreviewView } from './model-preview.js';
import type { PreviewOrientation } from '#lib/services/models/preview-orientation.js';

/**
 * Uchwyt jednego podglądu 3D dla interfejsu: polecenia kamery oraz reaktywny stan przycisków.
 * Komponent nie widzi Cesium — zna tylko te metody.
 */
export class ModelPreviewSession {
	readonly controls = new ModelPreviewControlsState();

	private readonly preview: ModelPreview;

	constructor(container: HTMLElement) {
		this.preview = new ModelPreview(container, {
			onAutoRotationChanged: (isAutoRotating) => {
				this.controls.isAutoRotating = isAutoRotating;
			}
		});
	}

	showModel(
		glb: Uint8Array<ArrayBuffer>,
		cacheKey: string,
		orientation: PreviewOrientation
	): Promise<void> {
		return this.preview.showModel(glb, cacheKey, orientation);
	}

	showModels(
		parts: readonly { glb: Uint8Array<ArrayBuffer>; cacheKey: string }[],
		orientation: PreviewOrientation,
		view: PreviewView
	): Promise<void> {
		return this.preview.showModels(parts, orientation, view);
	}

	tiltUp(): void {
		this.preview.tiltUp();
	}

	tiltDown(): void {
		this.preview.tiltDown();
	}

	zoomIn(): void {
		this.preview.zoomIn();
	}

	zoomOut(): void {
		this.preview.zoomOut();
	}

	resetView(): void {
		this.preview.resetView();
	}

	toggleAutoRotation(): void {
		this.preview.setAutoRotation(!this.controls.isAutoRotating);
	}

	setFullscreen(isFullscreen: boolean): void {
		this.controls.isFullscreen = isFullscreen;
		this.preview.refreshSize();
	}

	destroy(): void {
		this.preview.destroy();
	}
}
