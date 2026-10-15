export const TOOL_IDS = ['search', 'layers', 'measure', 'time'] as const;

export type ToolId = (typeof TOOL_IDS)[number];
