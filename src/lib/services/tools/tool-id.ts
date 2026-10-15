export const TOOL_IDS = ['search', 'layers', 'measure', 'analysis', 'time', 'bookmarks'] as const;

export type ToolId = (typeof TOOL_IDS)[number];

export const TOOL_LABELS: Readonly<Record<ToolId, string>> = {
	search: 'Szukaj',
	layers: 'Warstwy',
	measure: 'Pomiary',
	analysis: 'Analizy',
	time: 'Czas',
	bookmarks: 'Zakładki'
};

export function isToolId(value: unknown): value is ToolId {
	return TOOL_IDS.some((toolId) => toolId === value);
}
