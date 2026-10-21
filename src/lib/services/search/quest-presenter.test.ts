import { describe, expect, it } from 'vitest';
import type { QuestRecord } from '#lib/data/types.js';
import { QuestPresenter } from './quest-presenter.js';

const quest: QuestRecord = {
	id: 'quest:TOPIC_RESCUEBENNET',
	name: 'Bennet siedzi w więzieniu',
	section: 'mission',
	chapter: 3,
	giver: null,
	giverCandidates: [
		{ code: 'BAU_908_HODGES', name: 'Hodges' },
		{ code: 'SLD_809_BENNET', name: 'Bennet' }
	],
	stages: [
		{ seq: 1, kind: 'status', text: null, status: 'RUNNING', chapter: 3, isConditional: false },
		{ seq: 2, kind: 'status', text: null, status: 'RUNNING', chapter: 3, isConditional: false },
		{
			seq: 3,
			kind: 'entry',
			text: 'Kowal został aresztowany.',
			status: null,
			chapter: null,
			isConditional: true
		},
		{ seq: 4, kind: 'status', text: null, status: 'SUCCESS', chapter: 3, isConditional: false }
	],
	people: [
		{
			code: 'BAU_908_HODGES',
			name: 'Hodges',
			role: 'giver_candidate',
			certainty: 'possible',
			entryId: 'character:BAU_908_HODGES'
		},
		{
			code: 'BAU_908_HODGES',
			name: 'Hodges',
			role: 'stage',
			certainty: 'always',
			entryId: 'character:BAU_908_HODGES'
		},
		{
			code: 'PAL_200_HAGEN',
			name: 'Lord Hagen',
			role: 'stage',
			certainty: 'always',
			entryId: 'character:PAL_200_HAGEN'
		},
		{
			code: 'PAL_200_HAGEN',
			name: 'Lord Hagen',
			role: 'insert',
			certainty: 'always',
			entryId: 'character:PAL_200_HAGEN'
		},
		{ code: 'NPC_X', name: 'Obcy', role: 'routine', certainty: 'possible', entryId: null }
	],
	items: [
		{
			code: 'ITMI_GOLD',
			name: 'Złoto',
			role: 'reward',
			amount: 35,
			certainty: 'always',
			entryId: null
		}
	],
	experiencePoints: 750
};

describe('QuestPresenter', () => {
	const view = new QuestPresenter().presentQuest(quest);

	it('przy niepewnym zleceniodawcy pokazuje listę możliwych, z linkiem do postaci z indeksu', () => {
		expect(view.giverHeading).toBe('Możliwi zleceniodawcy');
		expect(view.givers.map((giver) => giver.name)).toEqual(['Hodges', 'Bennet']);
		expect(view.givers[0]).toMatchObject({
			entryId: 'character:BAU_908_HODGES',
			isUncertain: true
		});
		expect(view.givers[1].entryId).toBeNull();
	});

	it('przy pewnym zleceniodawcy nagłówek jest pojedynczy', () => {
		const certain = new QuestPresenter().presentQuest({
			...quest,
			giver: { code: 'SLD_800_LEE', name: 'Lee' }
		});
		expect(certain.giverHeading).toBe('Zleceniodawca');
		expect(certain.givers).toEqual([
			{ name: 'Lee', description: '', isUncertain: false, entryId: null }
		]);
	});

	it('pokazuje powtórzony status raz i opisuje etapy', () => {
		expect(view.stages.map((stage) => stage.seq)).toEqual([1, 3, 4]);
		expect(view.stages[0]).toMatchObject({
			statusLabel: 'Quest rozpoczęty',
			chapterLabel: 'rozdz. 3'
		});
		expect(view.stages[1]).toMatchObject({
			text: 'Kowal został aresztowany.',
			isConditional: true
		});
		expect(view.stages[2].statusLabel).toBe('Quest ukończony');
	});

	it('postacie bez zleceniodawców, każda raz, z opisem roli', () => {
		expect(view.people.map((person) => person.name)).toEqual(['Hodges', 'Lord Hagen', 'Obcy']);
		expect(view.people[0].description).toBe('występuje w etapach');
		expect(view.people[2]).toMatchObject({ isUncertain: true, entryId: null });
	});

	it('opisuje nagrodę i przedmioty', () => {
		expect(view.experienceLabel).toBe('750 pkt doświadczenia');
		expect(view.items[0]).toMatchObject({ name: 'Złoto', description: 'nagroda, ×35' });
	});
});

describe('QuestPresenter: questy postaci', () => {
	const presenter = new QuestPresenter();
	const stageOnlyQuest: QuestRecord = {
		...quest,
		id: 'quest:TOPIC_OTHER',
		name: 'Inny quest',
		chapter: null,
		giverCandidates: [],
		people: [
			{ code: 'BAU_908_HODGES', name: 'Hodges', role: 'stage', certainty: 'always', entryId: null }
		]
	};

	it('podaje questy po roli: najpierw zlecane, potem tylko występujące', () => {
		const links = presenter.presentQuestsOfCharacter([stageOnlyQuest, quest], ['BAU_908_HODGES']);
		expect(links.map((link) => link.name)).toEqual(['Bennet siedzi w więzieniu', 'Inny quest']);
		expect(links[0]).toMatchObject({
			description: 'możliwy zleceniodawca, rozdz. 3',
			entryId: 'quest:TOPIC_RESCUEBENNET'
		});
		expect(links[1].description).toBe('występuje w etapach');
	});

	it('uwzględnia wszystkie kody instancji postaci i pomija obce questy', () => {
		expect(presenter.presentQuestsOfCharacter([quest], ['PAL_200_HAGEN'])).toHaveLength(1);
		expect(presenter.presentQuestsOfCharacter([quest], ['NIEZNANY', 'PAL_200_HAGEN'])).toHaveLength(
			1
		);
		expect(presenter.presentQuestsOfCharacter([quest], ['NIEZNANY'])).toEqual([]);
	});
});
