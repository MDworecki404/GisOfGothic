import { isToolId, type ToolId } from '#lib/services/tools/tool-id.js';
import { CameraViewCodec, type CameraView } from './camera-view-codec.js';

/** To, co odtwarza link: wybrany wpis, kamera i otwarte narzędzie (`null` = panel zamknięty). */
export interface SharedViewState {
	entryId: string | null;
	camera: CameraView | null;
	toolId: ToolId | null;
}

const ENTRY_PARAMETER = 'wpis';
const CAMERA_PARAMETER = 'widok';
const TOOL_PARAMETER = 'narzedzie';
const CLOSED_TOOL_VALUE = 'zamkniete';
export const DEFAULT_TOOL_ID: ToolId = 'search';

/**
 * Zamienia widok na parametry adresu (`?wpis=…&widok=…&narzedzie=…`) i z powrotem. Parametry
 * z wartością domyślną (brak wpisu, kamery, otwarte wyszukiwanie) są pomijane, żeby adres był krótki.
 */
export class ViewLinkCodec {
	private readonly cameraCodec = new CameraViewCodec();

	buildQuery(state: SharedViewState): string {
		const parameters = new URLSearchParams();
		if (state.entryId) parameters.set(ENTRY_PARAMETER, state.entryId);
		if (state.camera) parameters.set(CAMERA_PARAMETER, this.cameraCodec.serialize(state.camera));
		if (state.toolId === null) parameters.set(TOOL_PARAMETER, CLOSED_TOOL_VALUE);
		else if (state.toolId !== DEFAULT_TOOL_ID) parameters.set(TOOL_PARAMETER, state.toolId);
		const query = parameters.toString();
		return query ? `?${query}` : '';
	}

	parseQuery(query: string): SharedViewState {
		const parameters = new URLSearchParams(query);
		const cameraText = parameters.get(CAMERA_PARAMETER);
		const toolText = parameters.get(TOOL_PARAMETER);
		return {
			entryId: parameters.get(ENTRY_PARAMETER) || null,
			camera: cameraText ? this.cameraCodec.parse(cameraText) : null,
			toolId:
				toolText === CLOSED_TOOL_VALUE ? null : isToolId(toolText) ? toolText : DEFAULT_TOOL_ID
		};
	}
}
