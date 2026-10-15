import type { Anchor, Place, SearchEntry } from '#lib/data/types.js';
import type { AppEventBus } from '#lib/events/app-events.js';
import type { WorldPosition } from '#lib/services/geodesy/world-frame.js';
import type { LocalPoint } from '#lib/services/measurement/measurement-calculator.js';
import {
	PLACE_KIND_PRESENTATION,
	SearchEntryPresenter,
	type SearchResult
} from '#lib/services/search/search-entry-presenter.js';
import type { SearchService } from '#lib/services/search/search-service.js';
import { LocalProjector } from './local-projector.js';
import { NearestPlacesFinder, type NearestMatch } from './nearest-places-finder.js';

export type AnalysisMode = 'nearest';

export interface AnalysisDisplay {
	showNearestPlaces(origin: LocalPoint, targets: readonly LocalPoint[]): void;
	flyToLocalPoint(point: LocalPoint, rangeMetres: number): void;
	clearAnalysis(): void;
}

export interface AnalysisSubject {
	id: string;
	name: string;
	placeCount: number;
}

export interface NearestPlaceView {
	index: number;
	description: string;
	kindLabel: string | null;
	color: string;
	straightMetres: number;
	horizontalMetres: number;
}

export interface AnalysisView {
	mode: AnalysisMode;
	subjectQuery: string;
	subjectSuggestions: SearchResult[];
	subject: AnalysisSubject | null;
	origin: WorldPosition | null;
	nearestPlaces: NearestPlaceView[];
}

interface LocatedPlace extends LocalPoint {
	place: Place;
}

const NEAREST_PLACE_COUNT = 5;
const SUGGESTION_COUNT = 6;
const PLACE_CLOSE_UP_RANGE_METRES = 45;

function capitalize(text: string): string {
	return text.charAt(0).toLocaleUpperCase('pl-PL') + text.slice(1);
}

/**
 * Narzędzie Analizy. Trzyma wybrany przedmiot albo postać (temat analizy), punkt wskazany na mapie
 * i wynik liczony czystymi klasami z `services/analysis/`; rysowanie zleca wyświetlaczowi mapy.
 */
export class AnalysisCoordinator {
	private readonly presenter = new SearchEntryPresenter();
	private readonly nearestPlacesFinder = new NearestPlacesFinder();
	private projector: LocalProjector | null = null;
	private mode: AnalysisMode = 'nearest';
	private subjectQuery = '';
	private subject: SearchEntry | null = null;
	private origin: WorldPosition | null = null;
	private nearestMatches: NearestMatch<LocatedPlace>[] = [];
	private isToolActive = false;

	constructor(
		private readonly eventBus: AppEventBus,
		private readonly getSearchService: () => SearchService | null,
		private readonly getDisplay: () => AnalysisDisplay | null
	) {}

	resetForNewWorld(): void {
		this.projector = null;
		this.subjectQuery = '';
		this.subject = null;
		this.origin = null;
		this.nearestMatches = [];
		this.getDisplay()?.clearAnalysis();
		this.publish();
	}

	useAnchor(anchor: Anchor): void {
		this.projector = new LocalProjector(anchor);
		this.refresh();
	}

	activate(): void {
		this.isToolActive = true;
		this.showResultOnMap();
	}

	deactivate(): void {
		this.isToolActive = false;
		this.getDisplay()?.clearAnalysis();
	}

	setSubjectQuery(query: string): void {
		this.subjectQuery = query;
		this.publish();
	}

	selectSubject(entryId: string): void {
		const entry = this.getSearchService()?.findEntry(entryId);
		if (!entry) return;
		this.subject = entry;
		this.subjectQuery = '';
		this.refresh();
	}

	clearSubject(): void {
		this.subject = null;
		this.refresh();
	}

	setOrigin(position: WorldPosition): void {
		this.origin = position;
		this.refresh();
	}

	flyToNearestPlace(index: number): void {
		const match = this.nearestMatches.at(index);
		if (match) this.getDisplay()?.flyToLocalPoint(match.candidate, PLACE_CLOSE_UP_RANGE_METRES);
	}

	private refresh(): void {
		this.nearestMatches = this.findNearestMatches();
		this.showResultOnMap();
		this.publish();
	}

	private findNearestMatches(): NearestMatch<LocatedPlace>[] {
		const projector = this.projector;
		if (!projector || !this.subject || !this.origin) return [];
		const located = this.subject.places.map((place) => ({
			...projector.projectToLocalPoint(place.lon, place.lat, place.h),
			place
		}));
		return this.nearestPlacesFinder.findNearest(this.origin, located, NEAREST_PLACE_COUNT);
	}

	private showResultOnMap(): void {
		const display = this.getDisplay();
		if (!display || !this.isToolActive) return;
		display.clearAnalysis();
		if (this.origin) {
			display.showNearestPlaces(
				this.origin,
				this.nearestMatches.map((match) => match.candidate)
			);
		}
	}

	private publish(): void {
		this.eventBus.publish({
			type: 'analysis-changed',
			analysis: {
				mode: this.mode,
				subjectQuery: this.subjectQuery,
				subjectSuggestions: this.suggestSubjects(),
				subject: this.subject
					? {
							id: this.subject.id,
							name: this.subject.name,
							placeCount: this.subject.places.length
						}
					: null,
				origin: this.origin,
				nearestPlaces: this.nearestMatches.map((match, index) => {
					const presentation = PLACE_KIND_PRESENTATION[match.candidate.place.kind];
					const description = capitalize(match.candidate.place.label);
					return {
						index,
						description,
						kindLabel: description === presentation.label ? null : presentation.label,
						color: presentation.color,
						straightMetres: match.straightMetres,
						horizontalMetres: match.horizontalMetres
					};
				})
			}
		});
	}

	private suggestSubjects(): SearchResult[] {
		return (this.getSearchService()?.search(this.subjectQuery, 'all') ?? [])
			.slice(0, SUGGESTION_COUNT)
			.map((entry) => this.presenter.presentResult(entry));
	}
}
