import { CATEGORY_DEFINITIONS } from '../data/categories.js';
import type { Category, Entry } from '../data/types.js';
import { ALL_ENTRIES, findEntry } from '../data/world.js';

export type ToolId = 'layers' | 'time' | 'measure' | 'saved';
export type DeviceClass = 'desktop' | 'tablet' | 'mobile';
export type SheetDetent = 'peek' | 'half' | 'full';

export interface SearchGroup {
	category: Category;
	results: Entry[];
}

export interface BaseLayers {
	terrain: boolean;
	contours: boolean;
	roads: boolean;
	rivers: boolean;
	regions: boolean;
}

function removeDiacritics(text: string): string {
	return text.toLocaleLowerCase('pl').replace(/ł/g, 'l').normalize('NFD').replace(/[̀-ͯ]/g, '');
}

export class MockupState {
	device = $state<DeviceClass>('desktop');
	selectedId = $state<string | null>(null);
	tool = $state<ToolId | null>(null);
	sheetDetent = $state<SheetDetent>('half');
	searchOpen = $state(false);
	query = $state('');
	searchCategory = $state<Category | 'all'>('all');
	visibleCategories = $state<Record<Category, boolean>>({
		location: true,
		character: true,
		item: true,
		monster: true,
		quest: true
	});
	baseLayers = $state<BaseLayers>({
		terrain: true,
		contours: true,
		roads: true,
		rivers: true,
		regions: true
	});
	hour = $state(14);
	chapter = $state(3);
	savedIds = $state<string[]>(['wieza-xardasa', 'oko-innosa']);
	recentIds = $state<string[]>(['klasztor-innosa', 'harad', 'khorinis-port']);
	measurePoints = $state<{ x: number; y: number }[]>([]);
	toastMessage = $state<string | null>(null);
	private toastTimer: number | undefined;

	constructor() {
		const queries: [DeviceClass, string][] = [
			['mobile', '(max-width: 47.99rem)'],
			['tablet', '(max-width: 69.99rem)'],
			['desktop', '(min-width: 0px)']
		];
		const update = () => {
			const matched = queries.find(([, query]) => window.matchMedia(query).matches);
			this.device = matched ? matched[0] : 'desktop';
		};
		update();
		window.addEventListener('resize', update);
	}

	get selectedEntry(): Entry | undefined {
		return this.selectedId ? findEntry(this.selectedId) : undefined;
	}

	get searchGroups(): SearchGroup[] {
		const normalizedQuery = removeDiacritics(this.query.trim());
		if (!normalizedQuery) {
			return [];
		}
		return CATEGORY_DEFINITIONS.flatMap((definition) => {
			if (this.searchCategory !== 'all' && this.searchCategory !== definition.id) {
				return [];
			}
			const results = ALL_ENTRIES.filter(
				(entry) =>
					entry.category === definition.id &&
					removeDiacritics(`${entry.name} ${entry.summary}`).includes(normalizedQuery)
			).sort((first, second) => {
				const firstStarts = removeDiacritics(first.name).startsWith(normalizedQuery) ? 0 : 1;
				const secondStarts = removeDiacritics(second.name).startsWith(normalizedQuery) ? 0 : 1;
				return firstStarts - secondStarts;
			});
			return results.length > 0 ? [{ category: definition.id, results }] : [];
		});
	}

	get searchCategoryCounts(): Record<Category | 'all', number> {
		const normalizedQuery = removeDiacritics(this.query.trim());
		const counts: Record<Category | 'all', number> = {
			all: 0,
			location: 0,
			character: 0,
			item: 0,
			monster: 0,
			quest: 0
		};
		if (!normalizedQuery) {
			return counts;
		}
		for (const entry of ALL_ENTRIES) {
			if (removeDiacritics(`${entry.name} ${entry.summary}`).includes(normalizedQuery)) {
				counts[entry.category] += 1;
				counts.all += 1;
			}
		}
		return counts;
	}

	get visibleEntries(): Entry[] {
		return ALL_ENTRIES.filter((entry) => this.visibleCategories[entry.category]);
	}

	select(entryId: string | null): void {
		this.selectedId = entryId;
		if (entryId) {
			this.recentIds = [entryId, ...this.recentIds.filter((id) => id !== entryId)].slice(0, 5);
			this.sheetDetent = 'half';
		}
	}

	toggleTool(toolId: ToolId): void {
		this.tool = this.tool === toolId ? null : toolId;
		this.sheetDetent = 'half';
	}

	toggleCategory(category: Category): void {
		this.visibleCategories[category] = !this.visibleCategories[category];
	}

	toggleSaved(entryId: string): void {
		const isSaved = this.savedIds.includes(entryId);
		this.savedIds = isSaved
			? this.savedIds.filter((id) => id !== entryId)
			: [...this.savedIds, entryId];
		this.showToast(isSaved ? 'Usunięto z zakładek' : 'Dodano do zakładek');
	}

	openSearch(): void {
		this.searchOpen = true;
	}

	closeSearch(): void {
		this.searchOpen = false;
		this.query = '';
		this.searchCategory = 'all';
	}

	showToast(message: string): void {
		this.toastMessage = message;
		window.clearTimeout(this.toastTimer);
		this.toastTimer = window.setTimeout(() => {
			this.toastMessage = null;
		}, 2600);
	}

	formatHour(hour: number = this.hour): string {
		const wrapped = ((hour % 24) + 24) % 24;
		const whole = Math.floor(wrapped);
		const minutes = Math.round((wrapped - whole) * 60);
		return `${String(whole).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
	}
}

export const mockupState = new MockupState();
