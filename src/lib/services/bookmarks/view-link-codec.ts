import { isToolId, type ToolId } from '#lib/services/tools/tool-id.js';
import { isChapterNumber, type ChapterNumber } from '#lib/services/chapters/chapter-filter.js';
import { CameraProjectionCodec } from '#lib/services/camera/camera-projection-codec.js';
import type { CameraProjectionSetting } from '#lib/services/camera/camera-projection.js';
import type { ViewMode } from '#lib/services/camera/view-mode.js';
import { CameraViewCodec, type CameraView } from './camera-view-codec.js';

/**
 * To, co odtwarza link: wybrany wpis, kamera, rzut (`null` = domyślny), tryb widoku z wysokością cięcia (`null` = bez cięcia),
 * otwarte narzędzie (`null` = panel zamknięty) i rozdział (`null` = wszystkie).
 */
export interface SharedViewState {
	entryId: string | null;
	camera: CameraView | null;
	projection: CameraProjectionSetting | null;
	viewMode: ViewMode;
	sliceHeightMetres: number | null;
	toolId: ToolId | null;
	chapter: ChapterNumber | null;
}

const ENTRY_PARAMETER = 'wpis';
const CAMERA_PARAMETER = 'widok';
const PROJECTION_PARAMETER = 'rzut';
const VIEW_MODE_PARAMETER = 'tryb';
const SLICE_HEIGHT_PARAMETER = 'ciecie';
const FLAT_MAP_VIEW_MODE_TEXT = '2d';
const SLICE_HEIGHT_DECIMALS_FACTOR = 10;
const TOOL_PARAMETER = 'narzedzie';
const CHAPTER_PARAMETER = 'rozdzial';
const CLOSED_TOOL_VALUE = 'zamkniete';
export const DEFAULT_TOOL_ID: ToolId = 'search';

/**
 * Zamienia widok na parametry adresu (`?wpis=…&widok=…&rzut=…&tryb=2d&ciecie=…&narzedzie=…&rozdzial=…`) i z powrotem.
 * Parametry z wartością domyślną (brak wpisu, kamery, rzutu domyślnego, trybu 3D, cięcia, rozdziału, otwarte wyszukiwanie)
 * są pomijane, żeby adres był krótki. Cięcie obowiązuje tylko z trybem 2D.
 */
export class ViewLinkCodec {
	private readonly cameraCodec = new CameraViewCodec();
	private readonly projectionCodec = new CameraProjectionCodec();

	buildQuery(state: SharedViewState): string {
		const parameters = new URLSearchParams();
		if (state.entryId) parameters.set(ENTRY_PARAMETER, state.entryId);
		if (state.camera) parameters.set(CAMERA_PARAMETER, this.cameraCodec.serialize(state.camera));
		const projectionText = state.projection
			? this.projectionCodec.serialize(state.projection)
			: null;
		if (projectionText !== null) parameters.set(PROJECTION_PARAMETER, projectionText);
		if (state.viewMode === 'view-2d') {
			parameters.set(VIEW_MODE_PARAMETER, FLAT_MAP_VIEW_MODE_TEXT);
			if (state.sliceHeightMetres !== null) {
				const roundedHeight =
					Math.round(state.sliceHeightMetres * SLICE_HEIGHT_DECIMALS_FACTOR) /
					SLICE_HEIGHT_DECIMALS_FACTOR;
				parameters.set(SLICE_HEIGHT_PARAMETER, String(roundedHeight));
			}
		}
		if (state.toolId === null) parameters.set(TOOL_PARAMETER, CLOSED_TOOL_VALUE);
		else if (state.toolId !== DEFAULT_TOOL_ID) parameters.set(TOOL_PARAMETER, state.toolId);
		if (state.chapter !== null) parameters.set(CHAPTER_PARAMETER, String(state.chapter));
		const query = parameters.toString();
		return query ? `?${query}` : '';
	}

	parseQuery(query: string): SharedViewState {
		const parameters = new URLSearchParams(query);
		const cameraText = parameters.get(CAMERA_PARAMETER);
		const projectionText = parameters.get(PROJECTION_PARAMETER);
		const toolText = parameters.get(TOOL_PARAMETER);
		const viewMode: ViewMode =
			parameters.get(VIEW_MODE_PARAMETER) === FLAT_MAP_VIEW_MODE_TEXT ? 'view-2d' : 'view-3d';
		const chapter = Number(parameters.get(CHAPTER_PARAMETER));
		return {
			entryId: parameters.get(ENTRY_PARAMETER) || null,
			camera: cameraText ? this.cameraCodec.parse(cameraText) : null,
			projection: projectionText ? this.projectionCodec.parse(projectionText) : null,
			viewMode,
			sliceHeightMetres:
				viewMode === 'view-2d'
					? this.parseSliceHeight(parameters.get(SLICE_HEIGHT_PARAMETER))
					: null,
			toolId:
				toolText === CLOSED_TOOL_VALUE ? null : isToolId(toolText) ? toolText : DEFAULT_TOOL_ID,
			chapter: isChapterNumber(chapter) ? chapter : null
		};
	}

	private parseSliceHeight(text: string | null): number | null {
		if (text === null || text.trim() === '') return null;
		const metres = Number(text);
		return Number.isFinite(metres) ? metres : null;
	}
}
