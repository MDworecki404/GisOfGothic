import { describe, expect, it } from 'vitest';
import { GeoportalDataLoader } from '#lib/data/geoportal-data-loader.js';
import type { WaypointNetwork } from '#lib/data/types.js';
import type { AppEvent } from '#lib/events/app-events.js';
import type { FeatureIdentification } from '#lib/services/layers/data-layer-catalog.js';
import { EventBus } from '#lib/events/event-bus.js';
import type { DataLayerPoint } from '#lib/services/map/data-layers-renderer.js';
import { ChapterFilter } from '#lib/services/chapters/chapter-filter.js';
import { WorldRoutingContext } from '#lib/services/routing/world-routing-context.js';
import type { FrameScheduler } from './routine-playback.js';
import { TimeCoordinator, type TimeOfDayDisplay } from './time-coordinator.js';

const DEGREES_PER_METRE = 1 / 111319.49;
const WALK_METRES_PER_SECOND = 1.43;
const ANCHOR = { lon: 0, lat: 0, h: 0 };

function createRoutinePlace(
	id: string,
	code: string,
	name: string,
	eastMetres: number,
	times: string[]
) {
	return {
		type: 'Feature',
		geometry: { type: 'Point', coordinates: [eastMetres * DEGREES_PER_METRE, 0, 0] },
		properties: {
			id,
			npc_code: code,
			npc_name: name,
			routine: 'START',
			is_default: true,
			waypoint: id,
			times,
			actions: []
		}
	};
}

function createSpawn(code: string, name: string, chapter: number | null) {
	return {
		type: 'Feature',
		geometry: { type: 'Point', coordinates: [0, 0, 0] },
		properties: { id: `spawn-${code}`, code, name, chapter }
	};
}

const routineFile = {
	type: 'FeatureCollection',
	features: [
		createRoutinePlace('ALPHA_NIGHT', 'NPC_ALPHA', 'Alfa', 0, ['22:00–07:00']),
		createRoutinePlace('ALPHA_DAY', 'NPC_ALPHA', 'Alfa', 143, ['07:00–22:00']),
		createRoutinePlace('BETA_ALL', 'NPC_BETA', 'Beta', 50, ['00:00–00:00'])
	]
};

const spawnFile = {
	type: 'FeatureCollection',
	features: [createSpawn('NPC_ALPHA', 'Alfa', 3), createSpawn('NPC_BETA', 'Beta', null)]
};

function createNode(name: string, eastMetres: number) {
	return {
		name,
		lon: eastMetres * DEGREES_PER_METRE,
		lat: 0,
		height: 0,
		isUnderwater: false
	};
}

const roadNetwork: WaypointNetwork = {
	nodes: [createNode('A', 0), createNode('B', 100), createNode('C', 200)],
	edges: [
		{ from: 'A', to: 'B' },
		{ from: 'B', to: 'C' }
	]
};

class ManualFrameScheduler implements FrameScheduler {
	private callback: ((timestampMilliseconds: number) => void) | null = null;

	request(callback: (timestampMilliseconds: number) => void): number {
		this.callback = callback;
		return 1;
	}

	cancel(): void {
		this.callback = null;
	}

	tick(timestampMilliseconds: number): void {
		const callback = this.callback;
		this.callback = null;
		callback?.(timestampMilliseconds);
	}
}

class RecordingDisplay implements TimeOfDayDisplay {
	readonly layers = new Map<string, readonly DataLayerPoint[]>();
	moveCalls = 0;
	showCalls = 0;

	showTimeOfDay(): void {}
	showShadows(): void {}

	showDataLayer(layerId: string, points: readonly DataLayerPoint[]): void {
		this.showCalls++;
		this.layers.set(layerId, points);
	}

	moveDataLayerPoints(layerId: string, points: readonly DataLayerPoint[]): boolean {
		const previous = this.layers.get(layerId);
		if (!previous || previous.length !== points.length) return false;
		this.moveCalls++;
		this.layers.set(layerId, points);
		return true;
	}

	hideDataLayer(layerId: string): void {
		this.layers.delete(layerId);
	}
}

function createLoader(): GeoportalDataLoader {
	return new GeoportalDataLoader('/d', async (url) => {
		const fileName = url.split('/').pop();
		if (fileName === 'character_places.geojson') return new Response(JSON.stringify(routineFile));
		if (fileName === 'npcs.geojson') return new Response(JSON.stringify(spawnFile));
		return new Response('', { status: 404 });
	});
}

function settle(): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, 0));
}

function minute(hours: number, minutes = 0): number {
	return hours * 60 + minutes;
}

function createFixture(options: { withRoads?: boolean } = {}) {
	const eventBus = new EventBus<AppEvent>();
	const display = new RecordingDisplay();
	const scheduler = new ManualFrameScheduler();
	let latest: Extract<AppEvent, { type: 'time-of-day-changed' }> | null = null;
	let identification: FeatureIdentification | null = null;
	eventBus.subscribe('time-of-day-changed', (event) => (latest = event));
	eventBus.subscribe('feature-identified', (event) => (identification = event.identification));
	const coordinator = new TimeCoordinator(eventBus, () => display, scheduler);
	coordinator.useWorld(createLoader());
	coordinator.useWalkingSpeed(WALK_METRES_PER_SECOND);
	if (options.withRoads !== false) {
		coordinator.useRoutingContext(new WorldRoutingContext(async () => roadNetwork, ANCHOR));
	}
	coordinator.setMinuteOfDay(minute(22, 10));
	return {
		coordinator,
		display,
		scheduler,
		eventBus,
		readEvent: () => latest,
		readIdentification: () => identification
	};
}

describe('TimeCoordinator: odtwarzanie rutyn', () => {
	it('start odtwarzania włącza warstwę i buduje animator z drogami', async () => {
		const { coordinator, display, readEvent } = createFixture();
		await coordinator.startPlayback('fast');
		const event = readEvent();
		expect(event?.routineLayerStatus).toBe('visible');
		expect(event?.playback).toMatchObject({ isPlaying: true, isPreparing: false, walkingCount: 1 });
		expect(display.layers.get('routines')).toHaveLength(2);
	});

	it('godzina rośnie w tempie, a punkty się przesuwają bez przebudowy warstwy', async () => {
		const { coordinator, display, scheduler, readEvent } = createFixture();
		await coordinator.startPlayback('very-fast');
		const showCallsBefore = display.showCalls;
		const moveCallsBefore = display.moveCalls;
		const pointsBefore = display.layers.get('routines');
		scheduler.tick(0);
		scheduler.tick(60);
		const pointsAfter = display.layers.get('routines');
		expect(readEvent()?.minuteOfDay).toBe(minute(22, 13));
		expect(display.moveCalls - moveCallsBefore).toBe(1);
		expect(display.showCalls).toBe(showCallsBefore);
		const alphaBefore = pointsBefore?.find(
			(point) => point.lon > 0 && point.lon < 143 * DEGREES_PER_METRE
		);
		const alphaAfter = pointsAfter?.find(
			(point) => point.lon > 0 && point.lon < 143 * DEGREES_PER_METRE
		);
		expect(alphaBefore).toBeDefined();
		expect(alphaAfter).toBeDefined();
		expect(alphaAfter?.lon).toBeLessThan(alphaBefore?.lon ?? 0);
	});

	it('przeciągnięcie suwaka zatrzymuje odtwarzanie', async () => {
		const { coordinator, readEvent } = createFixture();
		await coordinator.startPlayback('fast');
		coordinator.setMinuteOfDay(minute(9));
		expect(readEvent()?.playback.isPlaying).toBe(false);
	});

	it('ukrycie warstwy i zmiana świata zatrzymują odtwarzanie', async () => {
		const first = createFixture();
		await first.coordinator.startPlayback('fast');
		await first.coordinator.toggleRoutineLayer();
		expect(first.readEvent()?.playback.isPlaying).toBe(false);

		const second = createFixture();
		await second.coordinator.startPlayback('fast');
		second.coordinator.useWorld(null);
		expect(second.readEvent()?.playback.isPlaying).toBe(false);
	});

	it('wynik budowania animatora po zmianie świata jest pomijany', async () => {
		const eventBus = new EventBus<AppEvent>();
		const display = new RecordingDisplay();
		let latest: Extract<AppEvent, { type: 'time-of-day-changed' }> | null = null;
		eventBus.subscribe('time-of-day-changed', (event) => (latest = event));
		const coordinator = new TimeCoordinator(eventBus, () => display, new ManualFrameScheduler());
		coordinator.useWorld(createLoader());
		coordinator.useWalkingSpeed(WALK_METRES_PER_SECOND);
		let finishDownload: (network: WaypointNetwork | null) => void = () => undefined;
		coordinator.useRoutingContext(
			new WorldRoutingContext(
				() => new Promise<WaypointNetwork | null>((resolve) => (finishDownload = resolve)),
				ANCHOR
			)
		);
		const started = coordinator.startPlayback('fast');
		await settle();
		expect(latest).toMatchObject({ playback: { isPreparing: true } });
		coordinator.useWorld(null);
		finishDownload(roadNetwork);
		await started;
		expect(latest).toMatchObject({
			routineLayerStatus: 'hidden',
			playback: { isPlaying: false, isPreparing: false }
		});
		expect(display.layers.size).toBe(0);
	});

	it('kliknięcie punktu identyfikuje postać z właściwego indeksu przy filtrze rozdziału', async () => {
		const { coordinator, readIdentification } = createFixture();
		coordinator.useChapterFilter(new ChapterFilter(1));
		await coordinator.startPlayback('fast');
		coordinator.identifyCharacter(0);
		expect(readIdentification()?.title).toBe('Beta');
	});

	it('w marszu karta mówi, skąd i dokąd postać idzie', async () => {
		const { coordinator, readIdentification } = createFixture();
		await coordinator.startPlayback('fast');
		coordinator.identifyCharacter(0);
		const facts = readIdentification()?.facts ?? [];
		const nowFact = facts.find((fact) => fact.label === 'Teraz');
		expect(nowFact?.value).toMatch(/idzie z ALPHA_DAY do ALPHA_NIGHT, dotrze o 22:25/);
	});

	it('bez kontekstu tras postacie skaczą, ale odtwarzanie działa', async () => {
		const { coordinator, readEvent } = createFixture({ withRoads: false });
		await coordinator.startPlayback('fast');
		expect(readEvent()?.playback).toMatchObject({
			isPlaying: true,
			walkingCount: 0,
			withoutRoadCount: 1
		});
	});
});
