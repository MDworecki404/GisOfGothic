export const TOOL_IDS = ['search', 'layers', 'measure', 'analysis', 'time'] as const;

export type ToolId = (typeof TOOL_IDS)[number];
