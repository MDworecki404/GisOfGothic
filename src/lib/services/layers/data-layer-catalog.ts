import { describeCategory } from '#lib/data/category-names.js';
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

export type DataLayerId = 'items' | 'containers' | 'characters' | 'npcs';

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
}

export interface IdentifiableFeature {
	lon: number;
	lat: number;
	h: number;
	quantity: number;
	iconId: MapIconId;
	spawnChapter: number | null;
	identification: FeatureIdentification;
}

export interface DataLayerDefinition {
	id: DataLayerId;
	name: string;
	description: string;
	fileName: string;
	metadataCountKey: string;
	color: string;
	legend: readonly IconLegendEntry[];
	isFilteredByChapter: boolean;
	readFeatures(json: unknown): IdentifiableFeature[];
}

function describeInventoryLine(line: InventoryLine): string {
	return line.amount > 1 ? `${line.name} ×${line.amount}` : line.name;
}

function presentItem(properties: ItemProperties): FeatureIdentification {
	return {
		layerName: 'Przedmioty w świecie',
		title: properties.name,
		subtitle: describeCategory(properties.category),
		facts: [
			{ label: 'Sztuk', value: String(properties.amount) },
			{
				label: 'Pochodzenie',
				value: properties.isInsertedByScript ? 'wstawiany skryptem' : 'leży od początku gry'
			},
			{ label: 'Kod', value: properties.code }
		],
		listTitle: null,
		listItems: [],
		searchQuery: properties.name,
		encyclopediaUrl: null
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
		encyclopediaUrl: null
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
				: null
		};
	};
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
	}
];
