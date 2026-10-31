import { describeCategory } from '#lib/data/category-names.js';
import { parseSearchIndex } from '#lib/data/parsers.js';
import type { QuestPlaceRole, SearchEntry } from '#lib/data/types.js';
import { QUEST_ROLE_PRESENTATION } from '#lib/services/search/search-entry-presenter.js';
import { EncyclopediaLinkBuilder } from '#lib/services/encyclopedia/encyclopedia-link-builder.js';
import {
	ITEM_ICON_LEGEND,
	pickItemIcon,
	type IconLegendEntry,
	type MapIconId
} from './map-icons.js';
import {
	parseCharacterProperties,
	omitItemPlaceholders,
	parseContainerProperties,
	parseItemProperties,
	parsePointFeatures,
	type CharacterProperties,
	type ContainerProperties,
	type InventoryLine,
	type ItemProperties
} from '#lib/data/layer-features.js';

export type DataLayerId = 'items' | 'containers' | 'characters' | 'npcs' | 'quests';

export interface FeatureFact {
	label: string;
	value: string;
}

export interface FeatureIdentification {
	layerName: string;
	title: string;
	subtitle: string;
	facts: FeatureFact[];
	listTitle: string | null;
	listItems: string[];
	searchQuery: string | null;
	encyclopediaUrl: string | null;
	/** Kody zestawów losowego łupu (Gothic 3); koordynator zamienia je na `possibleItems`. */
	treasureSetCodes: string[];
	possibleItems: string[];
	/** Plik podglądu 3D względem adresu modeli świata albo `null`. */
	modelFile: string | null;
}

export interface IdentifiableFeature {
	lon: number;
	lat: number;
	h: number;
	quantity: number;
	iconId: MapIconId;
	spawnChapter: number | null;
	/** Kolor tego punktu zamiast koloru warstwy. */
	cssColor?: string;
	identification: FeatureIdentification;
}

export interface DataLayerDefinition {
	id: DataLayerId;
	name: string;
	description: string;
	fileName: string;
	/** Klucz liczności w `metadata.json`; `null`, gdy liczby punktów nie da się z niego odczytać. */
	metadataCountKey: string | null;
	color: string;
	legend: readonly IconLegendEntry[];
	isFilteredByChapter: boolean;
	readFeatures(json: unknown): IdentifiableFeature[];
}

function describeInventoryLine(line: InventoryLine): string {
	return line.amount > 1 ? `${line.name} ×${line.amount}` : line.name;
}

function presentItem(properties: ItemProperties): FeatureIdentification {
	const facts: FeatureFact[] = [
		{ label: 'Sztuk', value: String(properties.amount) },
		{
			label: 'Pochodzenie',
			value: properties.isInsertedByScript
				? 'wstawiany skryptem, w trakcie fabuły'
				: 'leży od początku gry'
		}
	];
	if (properties.isInsertedByScript && properties.spot) {
		facts.push({ label: 'Miejsce wstawienia', value: properties.spot });
	}
	facts.push({ label: 'Kod', value: properties.code });
	return {
		layerName: 'Przedmioty w świecie',
		title: properties.name,
		subtitle: describeCategory(properties.category),
		facts,
		listTitle: null,
		listItems: [],
		searchQuery: properties.name,
		encyclopediaUrl: null,
		treasureSetCodes: [],
		possibleItems: [],
		modelFile: null
	};
}

function describeLock(properties: ContainerProperties): string {
	if (!properties.isLocked) return 'otwarta';
	if (properties.keyName && properties.lockCombination) {
		return `zamknięta: klucz ${properties.keyName} albo wytrych, kombinacja ${properties.lockCombination}`;
	}
	if (properties.keyName) return `zamknięta na klucz ${properties.keyName}`;
	if (properties.lockCombination) {
		return `zamknięta, kombinacja wytrycha ${properties.lockCombination}`;
	}
	return 'zamknięta';
}

function presentContainer(properties: ContainerProperties): FeatureIdentification {
	return {
		layerName: 'Skrzynie',
		title: 'Skrzynia',
		subtitle: describeLock(properties),
		facts: [{ label: 'Przedmiotów', value: String(properties.contents.length) }],
		listTitle: properties.contents.length > 0 ? 'Zawartość' : null,
		listItems: properties.contents.map(describeInventoryLine),
		searchQuery: null,
		encyclopediaUrl: null,
		treasureSetCodes: properties.treasureSetCodes,
		possibleItems: [],
		modelFile: properties.model
	};
}

const encyclopediaLinkBuilder = new EncyclopediaLinkBuilder();

function presentCharacter(layerName: string) {
	return (properties: CharacterProperties): FeatureIdentification => {
		const isUniqueCharacter = layerName === 'Unikatowa postać';
		const facts: FeatureFact[] = [];
		if (properties.level !== null) facts.push({ label: 'Poziom', value: String(properties.level) });
		if (properties.chapter !== null) {
			facts.push({ label: 'Pojawia się w rozdziale', value: String(properties.chapter) });
		}
		if (properties.waypoint) facts.push({ label: 'Punkt wstawienia', value: properties.waypoint });
		return {
			layerName,
			title: properties.name,
			subtitle: describeCategory(properties.guild),
			facts,
			listTitle: null,
			listItems: [],
			searchQuery: isUniqueCharacter ? properties.name : null,
			encyclopediaUrl: isUniqueCharacter
				? encyclopediaLinkBuilder.buildSearchUrl(properties.name)
				: null,
			treasureSetCodes: properties.treasureSetCodes,
			possibleItems: [],
			modelFile: null
		};
	};
}

function presentQuestPlace(
	entry: SearchEntry,
	role: QuestPlaceRole,
	placeLabel: string
): FeatureIdentification {
	const facts: FeatureFact[] = [];
	if (entry.giver) facts.push({ label: 'Zleca', value: entry.giver });
	if (entry.chapter !== null && entry.chapter !== undefined) {
		facts.push({ label: 'Rozdział startu', value: String(entry.chapter) });
	}
	if (placeLabel) facts.push({ label: 'Miejsce', value: placeLabel });
	return {
		layerName: 'Questy',
		title: entry.name,
		subtitle: QUEST_ROLE_PRESENTATION[role].label,
		facts,
		listTitle: null,
		listItems: [],
		searchQuery: entry.name,
		encyclopediaUrl: null,
		treasureSetCodes: [],
		possibleItems: [],
		modelFile: null
	};
}

/**
 * Każde pewne miejsce każdego questu z indeksu wyszukiwania to osobny punkt, barwiony rolą miejsca (zleca, cel, etap).
 * Miejsca „możliwe” pomijamy: to wstawienia zwykłych potworów i kandydatów na zleceniodawcę, a nie miejsca questa,
 * więc mapa pokazywałaby np. wszystkich orków świata jako cele questa z innego świata.
 */
function readQuestPlaces(json: unknown): IdentifiableFeature[] {
	const features: IdentifiableFeature[] = [];
	for (const entry of parseSearchIndex(json).entries) {
		if (entry.type !== 'quest') continue;
		for (const place of entry.places) {
			if (place.certainty === 'possible') continue;
			const role = place.role ?? 'target';
			features.push({
				lon: place.lon,
				lat: place.lat,
				h: place.h,
				quantity: 1,
				iconId: 'quest',
				spawnChapter: entry.chapter ?? null,
				cssColor: QUEST_ROLE_PRESENTATION[role].color,
				identification: presentQuestPlace(entry, role, place.label)
			});
		}
	}
	return features;
}

function readPresentedFeatures<P>(
	json: unknown,
	description: string,
	parseProperties: (properties: Record<string, unknown>, description: string) => P,
	present: (properties: P) => FeatureIdentification,
	pickIcon: (properties: P) => MapIconId,
	readQuantity: (properties: P) => number = () => 1,
	readSpawnChapter: (properties: P) => number | null = () => null
): IdentifiableFeature[] {
	return parsePointFeatures(json, description, parseProperties).map((feature) => ({
		lon: feature.lon,
		lat: feature.lat,
		h: feature.h,
		quantity: readQuantity(feature.properties),
		iconId: pickIcon(feature.properties),
		spawnChapter: readSpawnChapter(feature.properties),
		identification: present(feature.properties)
	}));
}

export const DATA_LAYERS: readonly DataLayerDefinition[] = [
	{
		id: 'items',
		name: 'Przedmioty w świecie',
		description: 'leżące na ziemi i wstawiane skryptem',
		fileName: 'items.geojson',
		metadataCountKey: 'items',
		color: '#e0662f',
		legend: ITEM_ICON_LEGEND,
		isFilteredByChapter: false,
		readFeatures: (json) =>
			readPresentedFeatures(
				omitItemPlaceholders(json),
				'items.geojson',
				parseItemProperties,
				presentItem,
				(properties) => pickItemIcon(properties.category),
				(properties) => properties.amount
			)
	},
	{
		id: 'containers',
		name: 'Skrzynie',
		description: 'z zawartością i zamkiem',
		fileName: 'containers.geojson',
		metadataCountKey: 'containers',
		color: '#8aa3a0',
		legend: [{ label: 'Skrzynia', iconId: 'chest' }],
		isFilteredByChapter: false,
		readFeatures: (json) =>
			readPresentedFeatures(
				json,
				'containers.geojson',
				parseContainerProperties,
				presentContainer,
				() => 'chest'
			)
	},
	{
		id: 'characters',
		name: 'Unikatowe postacie',
		description: 'miejsce pojawienia się',
		fileName: 'characters.geojson',
		metadataCountKey: 'search_characters',
		color: '#c9a24a',
		legend: [{ label: 'Postać', iconId: 'person' }],
		isFilteredByChapter: true,
		readFeatures: (json) =>
			readPresentedFeatures(
				json,
				'characters.geojson',
				parseCharacterProperties,
				presentCharacter('Unikatowa postać'),
				() => 'person',
				() => 1,
				(properties) => properties.chapter
			)
	},
	{
		id: 'npcs',
		name: 'Wszyscy NPC i potwory',
		description: 'każde wstawienie do świata',
		fileName: 'npcs.geojson',
		metadataCountKey: 'npcs',
		color: '#b07ad0',
		legend: [{ label: 'Postać lub potwór', iconId: 'person' }],
		isFilteredByChapter: true,
		readFeatures: (json) =>
			readPresentedFeatures(
				json,
				'npcs.geojson',
				parseCharacterProperties,
				presentCharacter('NPC albo potwór'),
				() => 'person',
				() => 1,
				(properties) => properties.chapter
			)
	},
	{
		id: 'quests',
		name: 'Questy',
		description: 'pewni zleceniodawcy, cele i miejsca etapów',
		fileName: 'search_index.json',
		metadataCountKey: null,
		color: QUEST_ROLE_PRESENTATION.giver.color,
		legend: [
			{ label: 'Zleceniodawca', iconId: 'quest', color: QUEST_ROLE_PRESENTATION.giver.color },
			{ label: 'Cel', iconId: 'quest', color: QUEST_ROLE_PRESENTATION.target.color },
			{ label: 'Etap', iconId: 'quest', color: QUEST_ROLE_PRESENTATION.stage.color }
		],
		isFilteredByChapter: true,
		readFeatures: readQuestPlaces
	}
];
