import {
	readCertainty,
	readOptionalBoolean,
	readOptionalChapter,
	readOptionalNumber,
	readOptionalString,
	requireNumber,
	requireRecord,
	requireString
} from './parsers.js';
import type {
	QuestCatalog,
	QuestItem,
	QuestItemRole,
	QuestPerson,
	QuestPersonRole,
	QuestRecord,
	QuestSection,
	QuestStage,
	QuestStageStatus
} from './types.js';

const SECTIONS: readonly QuestSection[] = ['mission', 'note'];
const STAGE_STATUSES: readonly QuestStageStatus[] = ['RUNNING', 'SUCCESS', 'FAILED', 'OBSOLETE'];
const PERSON_ROLES: readonly QuestPersonRole[] = [
	'giver',
	'giver_candidate',
	'stage',
	'insert',
	'routine'
];
const ITEM_ROLES: readonly QuestItemRole[] = ['reward', 'handover', 'placed'];

function readList(record: Record<string, unknown>, key: string, description: string): unknown[] {
	const value = record[key];
	if (value === undefined || value === null) return [];
	if (!Array.isArray(value)) throw new Error(`${description}: pole "${key}" musi być listą`);
	return value;
}

function readChapterOrNull(record: Record<string, unknown>): number | null {
	return readOptionalChapter(record) ?? null;
}

function parseNamedPerson(value: unknown, description: string): { code: string; name: string } {
	const record = requireRecord(value, description);
	return {
		code: requireString(record, 'code', description),
		name: requireString(record, 'name', description)
	};
}

function parseStage(value: unknown, description: string): QuestStage {
	const record = requireRecord(value, description);
	const kind = record.kind === 'status' ? 'status' : 'entry';
	return {
		seq: requireNumber(record, 'seq', description),
		kind,
		text: readOptionalString(record, 'text') ?? null,
		status: STAGE_STATUSES.find((status) => status === record.status) ?? null,
		chapter: readChapterOrNull(record),
		isConditional: readOptionalBoolean(record, 'conditional') ?? false
	};
}

function parsePerson(value: unknown, description: string): QuestPerson | null {
	const record = requireRecord(value, description);
	const role = PERSON_ROLES.find((candidate) => candidate === record.role);
	if (!role) return null;
	return {
		...parseNamedPerson(record, description),
		role,
		certainty: readCertainty(record) ?? 'always',
		entryId: readOptionalString(record, 'id') ?? null
	};
}

function parseItem(value: unknown, description: string): QuestItem | null {
	const record = requireRecord(value, description);
	const role = ITEM_ROLES.find((candidate) => candidate === record.role);
	if (!role) return null;
	return {
		...parseNamedPerson(record, description),
		role,
		amount: readOptionalNumber(record, 'amount') ?? 1,
		certainty: readCertainty(record) ?? 'always',
		entryId: readOptionalString(record, 'id') ?? null
	};
}

function parseQuest(value: unknown, position: number): QuestRecord {
	const description = `quests.json: quest #${position}`;
	const record = requireRecord(value, description);
	const section = SECTIONS.find((candidate) => candidate === record.section);
	if (!section) throw new Error(`${description}: nieznana sekcja`);
	const rewards = record.rewards === null ? {} : requireRecord(record.rewards ?? {}, description);
	return {
		id: requireString(record, 'id', description),
		name: requireString(record, 'name', description),
		section,
		chapter: readChapterOrNull(record),
		giver: record.giver ? parseNamedPerson(record.giver, `${description}, zleceniodawca`) : null,
		giverCandidates: readList(record, 'giver_candidates', description).map((candidate) =>
			parseNamedPerson(candidate, `${description}, kandydat`)
		),
		stages: readList(record, 'stages', description).map((stage, index) =>
			parseStage(stage, `${description}, etap #${index}`)
		),
		people: readList(record, 'characters', description)
			.map((person, index) => parsePerson(person, `${description}, postać #${index}`))
			.filter((person) => person !== null),
		items: readList(record, 'items', description)
			.map((item, index) => parseItem(item, `${description}, przedmiot #${index}`))
			.filter((item) => item !== null),
		experiencePoints: readOptionalNumber(rewards, 'xp') ?? null
	};
}

export function parseQuestCatalog(json: unknown): QuestCatalog {
	const root = requireRecord(json, 'quests.json');
	if (!Array.isArray(root.quests)) throw new Error('quests.json: brak listy questów');
	return {
		version: requireNumber(root, 'version', 'quests.json'),
		quests: root.quests.map(parseQuest)
	};
}
