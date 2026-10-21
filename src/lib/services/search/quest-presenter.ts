import type { QuestPerson, QuestRecord, QuestStage, QuestStageStatus } from '#lib/data/types.js';

export interface QuestLinkView {
	name: string;
	/** Dodatkowy opis, np. „w etapach questa” albo „×35”. */
	description: string;
	isUncertain: boolean;
	/** Identyfikator wpisu w wyszukiwarce; `null`, gdy postaci albo przedmiotu nie ma w indeksie. */
	entryId: string | null;
}

export interface QuestStageView {
	seq: number;
	text: string | null;
	statusLabel: string | null;
	chapterLabel: string | null;
	isConditional: boolean;
}

export interface QuestDetailsView {
	giverHeading: string;
	givers: QuestLinkView[];
	stages: QuestStageView[];
	people: QuestLinkView[];
	items: QuestLinkView[];
	experienceLabel: string | null;
}

const STATUS_LABELS: Readonly<Record<QuestStageStatus, string>> = {
	RUNNING: 'Quest rozpoczęty',
	SUCCESS: 'Quest ukończony',
	FAILED: 'Quest nieudany',
	OBSOLETE: 'Quest nieaktualny'
};

const PERSON_ROLE_LABELS = {
	giver: 'zleceniodawca',
	giver_candidate: 'możliwy zleceniodawca',
	stage: 'występuje w etapach',
	insert: 'pojawia się w trakcie questa',
	routine: 'zmienia rutynę'
} as const;

const ITEM_ROLE_LABELS = {
	reward: 'nagroda',
	handover: 'do oddania lub zdobycia',
	placed: 'zostaje w świecie'
} as const;

/** Zamienia surowy quest z `quests.json` na teksty i listy gotowe do pokazania w karcie. */
export class QuestPresenter {
	presentQuest(quest: QuestRecord): QuestDetailsView {
		const hasCertainGiver = quest.giver !== null;
		const giverNames = hasCertainGiver ? [quest.giver] : quest.giverCandidates;
		return {
			giverHeading: hasCertainGiver ? 'Zleceniodawca' : 'Możliwi zleceniodawcy',
			givers: giverNames.flatMap((giver) =>
				giver ? [this.presentGiver(giver, quest.people, hasCertainGiver)] : []
			),
			stages: this.dropRepeatedStatuses(quest.stages).map((stage) => this.presentStage(stage)),
			people: this.presentPeopleOtherThanGivers(quest.people),
			items: quest.items.map((item) => ({
				name: item.name,
				description: [ITEM_ROLE_LABELS[item.role], item.amount > 1 ? `×${item.amount}` : '']
					.filter((part) => part !== '')
					.join(', '),
				isUncertain: item.certainty === 'possible',
				entryId: item.entryId
			})),
			experienceLabel:
				quest.experiencePoints === null ? null : `${quest.experiencePoints} pkt doświadczenia`
		};
	}

	private presentGiver(
		giver: { code: string; name: string },
		people: readonly QuestPerson[],
		isCertain: boolean
	): QuestLinkView {
		const entryId = people.find((person) => person.code === giver.code)?.entryId ?? null;
		return { name: giver.name, description: '', isUncertain: !isCertain, entryId };
	}

	private presentPeopleOtherThanGivers(people: readonly QuestPerson[]): QuestLinkView[] {
		const byCode = new Map<string, QuestPerson>();
		for (const person of people) {
			if (person.role === 'giver' || person.role === 'giver_candidate') continue;
			if (!byCode.has(person.code)) byCode.set(person.code, person);
		}
		return [...byCode.values()].map((person) => ({
			name: person.name,
			description: PERSON_ROLE_LABELS[person.role],
			isUncertain: person.certainty === 'possible',
			entryId: person.entryId
		}));
	}

	/** Ten sam status zapisany kilka razy z rzędu (kilka dialogów) pokazujemy raz. */
	private dropRepeatedStatuses(stages: readonly QuestStage[]): QuestStage[] {
		let previousStatus: QuestStageStatus | null = null;
		return stages.filter((stage) => {
			if (stage.kind !== 'status') return true;
			const isRepeat = stage.status === previousStatus;
			previousStatus = stage.status;
			return !isRepeat;
		});
	}

	private presentStage(stage: QuestStage): QuestStageView {
		return {
			seq: stage.seq,
			text: stage.kind === 'entry' ? stage.text : null,
			statusLabel: stage.kind === 'status' && stage.status ? STATUS_LABELS[stage.status] : null,
			chapterLabel: stage.chapter === null ? null : `rozdz. ${stage.chapter}`,
			isConditional: stage.isConditional
		};
	}
}
