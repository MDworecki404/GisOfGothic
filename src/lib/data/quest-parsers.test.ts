import { describe, expect, it } from 'vitest';
import { parseQuestCatalog } from './quest-parsers.js';

const questJson = {
	id: 'quest:TOPIC_RESCUEBENNET',
	name: 'Bennet siedzi w więzieniu',
	section: 'mission',
	chapter: 3,
	giver: null,
	giver_candidates: [{ code: 'BAU_908_HODGES', name: 'Hodges' }],
	stages: [
		{ seq: 1, kind: 'entry', text: 'Kowal został aresztowany.', chapter: null, conditional: false },
		{ seq: 2, kind: 'status', status: 'SUCCESS', chapter: 3, conditional: true }
	],
	characters: [
		{
			code: 'SLD_809_BENNET',
			name: 'Bennet',
			role: 'stage',
			certainty: 'always',
			id: 'character:SLD_809_BENNET'
		},
		{ code: 'X', name: 'Nieznany', role: 'wymyślona-rola', certainty: 'always', id: null }
	],
	items: [
		{
			code: 'ITMI_GOLD',
			name: 'Złoto',
			role: 'reward',
			amount: 35,
			certainty: 'possible',
			id: null
		}
	],
	rewards: { xp: 750, xp_certainty: 'always' }
};

describe('parseQuestCatalog', () => {
	const [quest] = parseQuestCatalog({ version: 1, quests: [questJson] }).quests;

	it('czyta zleceniodawców, etapy i nagrodę', () => {
		expect(quest.giver).toBeNull();
		expect(quest.giverCandidates).toEqual([{ code: 'BAU_908_HODGES', name: 'Hodges' }]);
		expect(quest.experiencePoints).toBe(750);
		expect(quest.stages[0]).toMatchObject({ kind: 'entry', text: 'Kowal został aresztowany.' });
		expect(quest.stages[1]).toMatchObject({
			kind: 'status',
			status: 'SUCCESS',
			isConditional: true
		});
	});

	it('zachowuje link tylko dla postaci z indeksu i pomija nieznane role', () => {
		expect(quest.people).toHaveLength(1);
		expect(quest.people[0]).toMatchObject({ entryId: 'character:SLD_809_BENNET' });
		expect(quest.items[0]).toMatchObject({ entryId: null, amount: 35, certainty: 'possible' });
	});

	it('czyta zależności, poziom i miejsce etapu z paczki v6 oraz kolejność questa', () => {
		const catalog = parseQuestCatalog({
			version: 2,
			quests: [
				{
					...questJson,
					order: 'dependency',
					stages: [
						{
							seq: 1,
							kind: 'entry',
							text: 'Idź do kowala.',
							requires: [],
							level: 0,
							alternative_group: null,
							place: {
								lon: 0.1,
								lat: 0.2,
								h: 3,
								label: 'Kowal: cały dzień',
								waypoint: 'W1',
								certainty: 'default'
							}
						},
						{ seq: 2, kind: 'entry', text: 'Wróć.', requires: [1, 'x'], level: 1 }
					]
				}
			]
		});
		const [quest] = catalog.quests;
		expect(quest?.order).toBe('dependency');
		expect(quest?.stages[0]?.place).toEqual({
			lon: 0.1,
			lat: 0.2,
			h: 3,
			label: 'Kowal: cały dzień',
			waypoint: 'W1',
			isDefaultRoutine: true
		});
		expect(quest?.stages[1]).toMatchObject({ requires: [1], level: 1, place: null });
	});

	it('quest z paczki bez pola order ma kolejność ze skryptów', () => {
		expect(parseQuestCatalog({ version: 1, quests: [questJson] }).quests[0]?.order).toBe('script');
	});

	it('odrzuca quest bez sekcji z czytelnym komunikatem', () => {
		const broken = { version: 1, quests: [{ ...questJson, section: 'x' }] };
		expect(() => parseQuestCatalog(broken)).toThrow(/quest #0/);
	});

	it('quest bez etapów, postaci i nagrody dostaje puste wartości', () => {
		const minimal = { id: 'quest:A', name: 'A', section: 'note' };
		const [parsed] = parseQuestCatalog({ version: 1, quests: [minimal] }).quests;
		expect(parsed).toMatchObject({ stages: [], people: [], items: [], experiencePoints: null });
	});
});
