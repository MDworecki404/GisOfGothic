import type { Viewer } from 'cesium';

export type ViewerOptions = Viewer.ConstructorOptions;

export class ViewerOptionsBuilder {
	private options: ViewerOptions = {};

	withoutIonBaseLayer(): this {
		this.options = { ...this.options, baseLayer: false, baseLayerPicker: false, geocoder: false };
		return this;
	}

	withoutToolbarWidgets(): this {
		this.options = {
			...this.options,
			animation: false,
			timeline: false,
			homeButton: false,
			sceneModePicker: false,
			navigationHelpButton: false,
			fullscreenButton: false
		};
		return this;
	}

	withoutFeatureInfoPopups(): this {
		this.options = { ...this.options, infoBox: false, selectionIndicator: false };
		return this;
	}

	withHiddenCredits(): this {
		this.options = { ...this.options, creditContainer: document.createElement('div') };
		return this;
	}

	build(): ViewerOptions {
		return { ...this.options };
	}
}
