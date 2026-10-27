import type { GeoportalDataLoader } from '#lib/data/geoportal-data-loader.js';
import {
	parseCharacterProperties,
	parsePointFeatures,
	type PointFeature
} from '#lib/data/layer-features.js';
import {
	describeRoutineAction,
	parseRoutinePlaceProperties,
	type RoutinePlaceProperties
} from '#lib/data/routine-places.js';
import type { AppEventBus } from '#lib/events/app-events.js';
import type { DataLayersDisplay } from '#lib/services/layers/data-layers-coordinator.js';
import { ChapterFilter, SpawnChapterIndex } from '#lib/services/chapters/chapter-filter.js';
import { EncyclopediaLinkBuilder } from '#lib/services/encyclopedia/encyclopedia-link-builder.js';
import { DailySchedule, isMinuteWithinInterval, parseTimeInterval } from './daily-schedule.js';

export const ROUTINE_LAYER_ID = 'routines';
const ROUTINE_LAYER_COLOR = '#ffd27a';
const ROUTINE_FILE_NAME = 'character_places.geojson';
const SPAWN_FILE_NAME = 'npcs.geojson';
const NOON_MINUTE = 12 * 60;

export interface ShadowSettings {
	areEnabled: boolean;
	areSoft: boolean;
}

export interface TimeOfDayDisplay extends DataLayersDisplay {
	showTimeOfDay(minuteOfDay: number): void;
	showShadows(settings: ShadowSettings): void;
}

export type RoutineLayerStatus = 'hidden' | 'loading' | 'visible' | 'error';

type RoutinePlace = PointFeature<RoutinePlaceProperties>;

function describeError(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}

/**
 * Pora dnia w świecie: światło i cienie mapy oraz warstwa „gdzie są postacie o tej godzinie” z rutyn dnia.
 * Pokazuje tylko rutyny domyślne — rutyny po zadaniach dotyczą innych etapów gry. Wybrany rozdział
 * ukrywa postacie, które skrypt wstawia do świata dopiero w późniejszym rozdziale.
 */
export class TimeCoordinator {
	private readonly encyclopediaLinkBuilder = new EncyclopediaLinkBuilder();
	private minuteOfDay = NOON_MINUTE;
	private status: RoutineLayerStatus = 'hidden';
	private schedule: DailySchedule<RoutinePlace> | null = null;
	private spawnChapters: SpawnChapterIndex | null = null;
	private chapterFilter = new ChapterFilter(null);
	private placesOnMap: RoutinePlace[] = [];
	private dataLoader: GeoportalDataLoader | null = null;
	private areRoutineTimesApproximate = false;
	private shadows: ShadowSettings = { areEnabled: false, areSoft: true };

	constructor(
		private readonly eventBus: AppEventBus,
		private readonly getDisplay: () => TimeOfDayDisplay | null
	) {}

	useWorld(dataLoader: GeoportalDataLoader | null): void {
		this.getDisplay()?.hideDataLayer(ROUTINE_LAYER_ID);
		this.dataLoader = dataLoader;
		this.schedule = null;
		this.spawnChapters = null;
		this.placesOnMap = [];
		this.status = 'hidden';
		this.publish();
	}

	/** Gothic 3 zapisuje tylko punkty rutyn, więc godziny w danych są robocze i karta oznacza je jako orientacyjne. */
	useApproximateRoutineTimes(areApproximate: boolean): void {
		this.areRoutineTimesApproximate = areApproximate;
	}

	useChapterFilter(chapterFilter: ChapterFilter): void {
		this.chapterFilter = chapterFilter;
		if (this.status === 'visible') this.showCharactersAtCurrentTime();
		this.publish();
	}

	setMinuteOfDay(minuteOfDay: number): void {
		this.minuteOfDay = minuteOfDay;
		this.getDisplay()?.showTimeOfDay(minuteOfDay);
		if (this.status === 'visible') this.showCharactersAtCurrentTime();
		this.publish();
	}

	setShadows(settings: ShadowSettings): void {
		this.shadows = settings;
		this.getDisplay()?.showShadows(settings);
		this.publish();
	}

	async toggleRoutineLayer(): Promise<void> {
		if (this.status === 'loading') return;
		if (this.status === 'visible') {
			this.getDisplay()?.hideDataLayer(ROUTINE_LAYER_ID);
			this.placesOnMap = [];
			this.status = 'hidden';
			this.publish();
			return;
		}
		if (!this.schedule && !(await this.loadSchedule())) return;
		this.status = 'visible';
		this.showCharactersAtCurrentTime();
		this.publish();
	}

	showOnMap(): void {
		this.getDisplay()?.showTimeOfDay(this.minuteOfDay);
		this.getDisplay()?.showShadows(this.shadows);
		if (this.status === 'visible') this.showCharactersAtCurrentTime();
	}

	identifyCharacter(featureIndex: number): void {
		const place = this.placesOnMap.at(featureIndex);
		if (!place) return;
		const properties = place.properties;
		const currentRange = properties.timeRanges.find((range) => {
			const interval = parseTimeInterval(range);
			return interval ? isMinuteWithinInterval(this.minuteOfDay, interval) : false;
		});
		const action = properties.actions.at(0);
		this.eventBus.publish({
			type: 'feature-identified',
			identification: {
				layerName: 'Postać o tej porze',
				title: properties.characterName,
				subtitle: action ? describeRoutineAction(action) : 'przebywa tutaj',
				facts: [
					{
						label: 'Tutaj',
						value: this.describeRoutineRange(currentRange)
					},
					{ label: 'Miejsce', value: properties.waypoint }
				],
				listTitle: null,
				listItems: [],
				searchQuery: properties.characterName,
				encyclopediaUrl: this.encyclopediaLinkBuilder.buildSearchUrl(properties.characterName),
				treasureSetCodes: [],
				possibleItems: [],
				modelFile: null
			}
		});
	}

	private describeRoutineRange(range: string | undefined): string {
		if (range === undefined) return '—';
		return this.areRoutineTimesApproximate ? `${range} (orientacyjnie)` : range;
	}

	private async loadSchedule(): Promise<boolean> {
		const dataLoader = this.dataLoader;
		if (!dataLoader) return false;
		this.status = 'loading';
		this.publish();
		try {
			const [routineJson, spawnJson] = await Promise.all([
				dataLoader.loadLayerFile(ROUTINE_FILE_NAME),
				dataLoader.loadLayerFile(SPAWN_FILE_NAME)
			]);
			const places = parsePointFeatures(
				routineJson,
				ROUTINE_FILE_NAME,
				parseRoutinePlaceProperties
			).filter((place) => place.properties.isDefaultRoutine);
			const spawns = parsePointFeatures(spawnJson, SPAWN_FILE_NAME, parseCharacterProperties);
			if (dataLoader !== this.dataLoader) return false;
			this.spawnChapters = new SpawnChapterIndex(
				spawns.map(({ properties }) => ({ code: properties.code, chapter: properties.chapter }))
			);
			this.schedule = new DailySchedule(places, (place) => place.properties.timeRanges);
			return true;
		} catch (error) {
			if (dataLoader !== this.dataLoader) return false;
			console.error(error);
			this.status = 'error';
			this.eventBus.publish({
				type: 'data-layer-load-failed',
				layerName: 'Postacie o tej godzinie',
				message: describeError(error)
			});
			this.publish();
			return false;
		}
	}

	private showCharactersAtCurrentTime(): void {
		const spawnChapters = this.spawnChapters;
		this.placesOnMap = (this.schedule?.findActiveAt(this.minuteOfDay) ?? [])
			.map((active) => active.value)
			.filter((place) =>
				this.chapterFilter.isSpawnVisible(
					spawnChapters?.findEarliestSpawnChapter(place.properties.characterCode) ?? null
				)
			);
		this.getDisplay()?.showDataLayer(
			ROUTINE_LAYER_ID,
			this.placesOnMap.map(({ lon, lat, h }) => ({ lon, lat, h, iconId: 'person' })),
			ROUTINE_LAYER_COLOR
		);
	}

	private publish(): void {
		this.eventBus.publish({
			type: 'time-of-day-changed',
			minuteOfDay: this.minuteOfDay,
			routineLayerStatus: this.status,
			charactersOnMap: this.status === 'visible' ? this.placesOnMap.length : null,
			shadows: this.shadows
		});
	}
}
