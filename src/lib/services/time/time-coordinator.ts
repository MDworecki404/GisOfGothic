import { MAP_PALETTE } from '#lib/services/map/map-palette.js';
import type { GeoportalDataLoader } from '#lib/data/geoportal-data-loader.js';
import { parseCharacterProperties, parsePointFeatures } from '#lib/data/layer-features.js';
import { describeRoutineAction, parseRoutinePlaceProperties } from '#lib/data/routine-places.js';
import type { AppEventBus } from '#lib/events/app-events.js';
import type { DataLayersDisplay } from '#lib/services/layers/data-layers-coordinator.js';
import { ChapterFilter, SpawnChapterIndex } from '#lib/services/chapters/chapter-filter.js';
import { EncyclopediaLinkBuilder } from '#lib/services/encyclopedia/encyclopedia-link-builder.js';
import {
	DailySchedule,
	MINUTES_PER_DAY,
	formatMinuteOfDay,
	isMinuteWithinInterval,
	parseTimeInterval
} from './daily-schedule.js';
import { CharacterTimeline, type RoutinePlace } from './character-timeline.js';
import {
	RoutineAnimator,
	type AnimatedCharacter,
	type CharacterFrame
} from './routine-animator.js';
import { RoutineMovementPlanner } from './routine-movement-planner.js';
import {
	RoutinePlayback,
	createBrowserFrameScheduler,
	type FrameScheduler,
	type PlaybackSpeed
} from './routine-playback.js';
import type { WorldRoutingContext } from '#lib/services/routing/world-routing-context.js';

export const ROUTINE_LAYER_ID = 'routines';
const ROUTINE_LAYER_COLOR = MAP_PALETTE.emberLight;
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

export interface RoutinePlaybackView {
	isPlaying: boolean;
	isPreparing: boolean;
	speed: PlaybackSpeed;
	walkingCount: number;
	withoutRoadCount: number;
}

const CHARACTERS_PER_PREPARATION_BATCH = 25;

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
	private routingContext: WorldRoutingContext | null = null;
	private walkMetresPerSecond: number | null = null;
	private routinePlaces: RoutinePlace[] = [];
	private animator: RoutineAnimator | null = null;
	private framesOnMap: CharacterFrame[] = [];
	private playbackSpeed: PlaybackSpeed = 'game';
	private isPreparing = false;
	private preparationRequest = 0;
	private readonly playback: RoutinePlayback;

	constructor(
		private readonly eventBus: AppEventBus,
		private readonly getDisplay: () => TimeOfDayDisplay | null,
		frameScheduler: FrameScheduler = createBrowserFrameScheduler()
	) {
		this.playback = new RoutinePlayback(frameScheduler, (elapsedGameMinutes) =>
			this.advanceMinuteOfDay(elapsedGameMinutes)
		);
	}

	useWorld(dataLoader: GeoportalDataLoader | null): void {
		this.stopPlayback();
		this.animator = null;
		this.routinePlaces = [];
		this.framesOnMap = [];
		this.routingContext = null;
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

	/** Ustawia godzinę ręcznie (suwak); zatrzymuje odtwarzanie doby. */
	setMinuteOfDay(minuteOfDay: number): void {
		this.stopPlayback();
		this.applyMinuteOfDay(minuteOfDay);
	}

	useRoutingContext(context: WorldRoutingContext | null): void {
		this.routingContext = context;
	}

	/** Prędkość marszu bohatera (m/s) z metadanych świata; bez niej postacie nie chodzą po drogach, tylko skaczą. */
	useWalkingSpeed(metresPerSecond: number | null): void {
		this.walkMetresPerSecond = metresPerSecond;
	}

	async startPlayback(speed: PlaybackSpeed): Promise<void> {
		const request = ++this.preparationRequest;
		this.playback.stop();
		this.playbackSpeed = speed;
		if (this.status !== 'visible') await this.toggleRoutineLayer();
		if (request !== this.preparationRequest || this.status !== 'visible') return;
		if (!this.animator) {
			this.isPreparing = true;
			this.publish();
			const animator = await this.buildAnimator(request);
			if (request !== this.preparationRequest) return;
			this.isPreparing = false;
			this.animator = animator;
		}
		this.playback.start(speed);
		this.showCharactersAtCurrentTime();
		this.publish();
	}

	setPlaybackSpeed(speed: PlaybackSpeed): void {
		this.playbackSpeed = speed;
		this.playback.setSpeed(speed);
		this.publish();
	}

	stopPlayback(): void {
		this.preparationRequest++;
		this.playback.stop();
		this.isPreparing = false;
		this.publish();
	}

	private advanceMinuteOfDay(elapsedGameMinutes: number): void {
		this.applyMinuteOfDay(this.minuteOfDay + elapsedGameMinutes);
	}

	private applyMinuteOfDay(minuteOfDay: number): void {
		this.minuteOfDay = ((minuteOfDay % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
		this.getDisplay()?.showTimeOfDay(this.minuteOfDay);
		if (this.status === 'visible') this.showCharactersAtCurrentTime();
		this.publish();
	}

	/**
	 * Buduje animator: oś czasu każdej postaci i odcinki marszu między jej miejscami. Praca idzie porcjami,
	 * żeby nie blokować interfejsu; wynik starszego żądania (po zmianie świata albo zatrzymaniu) jest pomijany.
	 */
	private async buildAnimator(request: number): Promise<RoutineAnimator | null> {
		const context = this.routingContext;
		const walkSpeed = this.walkMetresPerSecond;
		let movementPlanner: RoutineMovementPlanner | null = null;
		if (context && walkSpeed) {
			try {
				const routePlanner = await context.loadRoutePlanner();
				if (routePlanner) {
					movementPlanner = new RoutineMovementPlanner(
						routePlanner,
						context.readProjector(),
						walkSpeed
					);
				}
			} catch (error) {
				console.error(error);
			}
		}
		const placesByCharacter = new Map<string, RoutinePlace[]>();
		for (const place of this.routinePlaces) {
			const list = placesByCharacter.get(place.properties.characterCode);
			if (list) list.push(place);
			else placesByCharacter.set(place.properties.characterCode, [place]);
		}
		const characters: AnimatedCharacter[] = [];
		let builtInBatch = 0;
		for (const places of placesByCharacter.values()) {
			if (request !== this.preparationRequest) return null;
			const timeline = CharacterTimeline.build(places);
			if (!timeline) continue;
			const { stays } = timeline;
			characters.push({
				timeline,
				legs: stays.map((stay, index) =>
					movementPlanner && stays.length > 1
						? movementPlanner.planLeg(
								stays[(index - 1 + stays.length) % stays.length].place,
								stay.place
							)
						: null
				)
			});
			if (++builtInBatch % CHARACTERS_PER_PREPARATION_BATCH === 0) {
				await new Promise<void>((resolve) => setTimeout(resolve, 0));
			}
		}
		return request === this.preparationRequest ? new RoutineAnimator(characters) : null;
	}

	setShadows(settings: ShadowSettings): void {
		this.shadows = settings;
		this.getDisplay()?.showShadows(settings);
		this.publish();
	}

	async toggleRoutineLayer(): Promise<void> {
		if (this.status === 'loading') return;
		if (this.status === 'visible') {
			this.playback.stop();
			this.preparationRequest++;
			this.isPreparing = false;
			this.getDisplay()?.hideDataLayer(ROUTINE_LAYER_ID);
			this.placesOnMap = [];
			this.framesOnMap = [];
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
		const frame = this.animator ? this.framesOnMap.at(featureIndex) : undefined;
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
					...(frame ? [{ label: 'Teraz', value: this.describeCurrentActivity(frame) }] : []),
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
			this.routinePlaces = places;
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
		if (this.animator) {
			this.showAnimatedCharactersAtCurrentTime(this.animator);
			return;
		}
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

	private showAnimatedCharactersAtCurrentTime(animator: RoutineAnimator): void {
		const spawnChapters = this.spawnChapters;
		this.framesOnMap = animator
			.readFramesAt(this.minuteOfDay)
			.filter((frame) =>
				this.chapterFilter.isSpawnVisible(
					spawnChapters?.findEarliestSpawnChapter(frame.place.properties.characterCode) ?? null
				)
			);
		this.placesOnMap = this.framesOnMap.map((frame) => frame.place);
		const points = this.framesOnMap.map(({ position }) => ({
			lon: position.lon,
			lat: position.lat,
			h: position.h,
			iconId: 'person' as const
		}));
		const display = this.getDisplay();
		if (display && !display.moveDataLayerPoints(ROUTINE_LAYER_ID, points)) {
			display.showDataLayer(ROUTINE_LAYER_ID, points, ROUTINE_LAYER_COLOR);
		}
	}

	private describeCurrentActivity(frame: CharacterFrame): string {
		const { activity } = frame;
		if (activity.kind === 'walking') {
			return `idzie z ${activity.from.properties.waypoint} do ${activity.to.properties.waypoint}, dotrze o ${formatMinuteOfDay(activity.arrivalMinute)}`;
		}
		return activity.untilMinute === null
			? 'stoi tutaj przez całą dobę'
			: `stoi tutaj do ${formatMinuteOfDay(activity.untilMinute)}`;
	}

	private readPlaybackView(): RoutinePlaybackView {
		return {
			isPlaying: this.playback.isPlaying,
			isPreparing: this.isPreparing,
			speed: this.playbackSpeed,
			walkingCount: this.animator?.countCharactersWalkingOnRoads() ?? 0,
			withoutRoadCount: this.animator?.countCharactersWithoutRoad() ?? 0
		};
	}

	private publish(): void {
		this.eventBus.publish({
			type: 'time-of-day-changed',
			minuteOfDay: Math.floor(this.minuteOfDay),
			routineLayerStatus: this.status,
			charactersOnMap: this.status === 'visible' ? this.placesOnMap.length : null,
			shadows: this.shadows,
			playback: this.readPlaybackView()
		});
	}
}
