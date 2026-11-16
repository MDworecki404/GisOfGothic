export type IssueReportKind = 'bug' | 'idea' | 'data';

export interface IssueReportContext {
	appVersion: string;
	worldName: string | null;
	viewUrl: string;
	userAgent: string;
	viewportSize: string;
	graphicsQualityLabel: string;
}

interface IssueTemplate {
	fileName: string;
	fillsEnvironment: boolean;
	fillsViewLink: boolean;
}

const ISSUE_TEMPLATES: Record<IssueReportKind, IssueTemplate> = {
	bug: { fileName: 'bug.yml', fillsEnvironment: true, fillsViewLink: true },
	data: { fileName: 'data.yml', fillsEnvironment: false, fillsViewLink: true },
	idea: { fileName: 'idea.yml', fillsEnvironment: false, fillsViewLink: false }
};

/**
 * Buduje adres nowego zgłoszenia na GitHubie z formularzem (`.github/ISSUE_TEMPLATE/`) wypełnionym
 * danymi o środowisku i widoku. Nic nie jest wysyłane z aplikacji: użytkownik widzi gotowe pola na GitHubie
 * i sam decyduje, czy je wysłać. Nazwy pól (`environment`, `view_link`) muszą zgadzać się z `id` w szablonach.
 */
export class IssueReportLinkBuilder {
	constructor(private readonly repositoryUrl: string) {}

	build(kind: IssueReportKind, context: IssueReportContext): string {
		const template = ISSUE_TEMPLATES[kind];
		const parameters = new URLSearchParams({ template: template.fileName });
		if (template.fillsEnvironment) parameters.set('environment', this.describeEnvironment(context));
		if (template.fillsViewLink) parameters.set('view_link', context.viewUrl);
		return `${this.repositoryUrl}/issues/new?${parameters.toString()}`;
	}

	private describeEnvironment(context: IssueReportContext): string {
		return [
			`Wersja aplikacji: ${context.appVersion}`,
			`Świat: ${context.worldName ?? 'nie otwarto'}`,
			`Przeglądarka: ${context.userAgent}`,
			`Rozmiar okna: ${context.viewportSize}`,
			`Jakość grafiki: ${context.graphicsQualityLabel}`
		].join('\n');
	}
}
