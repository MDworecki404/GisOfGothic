import { describe, expect, it } from 'vitest';
import { IssueReportLinkBuilder, type IssueReportContext } from './issue-report-link-builder.js';

const context: IssueReportContext = {
	appVersion: '1.2.3',
	worldName: 'Khorinis',
	viewUrl: 'https://example.test/g2nk/khorinis?x=1&y=2',
	userAgent: 'TestBrowser/1.0',
	viewportSize: '1280×720',
	graphicsQualityLabel: 'Wysoka'
};

const builder = new IssueReportLinkBuilder('https://github.com/owner/repo');

function readParameters(link: string): URLSearchParams {
	return new URL(link).searchParams;
}

describe('IssueReportLinkBuilder', () => {
	it('wypełnia środowisko i link do widoku w zgłoszeniu błędu', () => {
		const link = builder.build('bug', context);
		const parameters = readParameters(link);
		expect(link.startsWith('https://github.com/owner/repo/issues/new?')).toBe(true);
		expect(parameters.get('template')).toBe('bug.yml');
		expect(parameters.get('view_link')).toBe(context.viewUrl);
		expect(parameters.get('environment')).toContain('Wersja aplikacji: 1.2.3');
		expect(parameters.get('environment')).toContain('Świat: Khorinis');
		expect(parameters.get('environment')).toContain('Przeglądarka: TestBrowser/1.0');
	});

	it('dla błędu w danych dołącza tylko link do widoku', () => {
		const parameters = readParameters(builder.build('data', context));
		expect(parameters.get('template')).toBe('data.yml');
		expect(parameters.get('view_link')).toBe(context.viewUrl);
		expect(parameters.has('environment')).toBe(false);
	});

	it('dla pomysłu nie dołącza żadnych danych o użytkowniku', () => {
		const parameters = readParameters(builder.build('idea', context));
		expect([...parameters.keys()]).toEqual(['template']);
		expect(parameters.get('template')).toBe('idea.yml');
	});

	it('opisuje brak otwartego świata', () => {
		const parameters = readParameters(builder.build('bug', { ...context, worldName: null }));
		expect(parameters.get('environment')).toContain('Świat: nie otwarto');
	});
});
