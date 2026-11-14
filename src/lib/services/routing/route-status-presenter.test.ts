import { describe, expect, it } from 'vitest';
import type { RouteView } from '#lib/services/measurement/measurement-coordinator.js';
import { RouteStatusPresenter } from './route-status-presenter.js';

const presenter = new RouteStatusPresenter();

function createView(overrides: Partial<RouteView>): RouteView {
	return {
		availability: 'ready',
		hasStart: true,
		hasEnd: true,
		outcome: 'found',
		startApproachMetres: 0,
		endApproachMetres: 0,
		...overrides
	};
}

describe('RouteStatusPresenter', () => {
	it('mówi, że świat nie ma sieci dróg', () => {
		expect(presenter.describeStatus(createView({ availability: 'unavailable' }))).toBe(
			'Ten świat nie ma sieci dróg z gry.'
		);
	});

	it('mówi, że sieć się wczytuje', () => {
		expect(presenter.describeStatus(createView({ availability: 'loading' }))).toBe(
			'Wczytuję sieć dróg…'
		);
	});

	it('prowadzi użytkownika przez wybór początku i celu', () => {
		expect(presenter.describeStatus(createView({ hasStart: false, hasEnd: false }))).toBe(
			'Kliknij początek trasy na mapie.'
		);
		expect(presenter.describeStatus(createView({ hasEnd: false }))).toBe('Kliknij cel trasy.');
	});

	it('wyjaśnia, dlaczego nie ma trasy', () => {
		expect(presenter.describeStatus(createView({ outcome: 'too-far-from-network' }))).toBe(
			'W pobliżu nie ma dróg z gry. Wybierz punkt bliżej drogi.'
		);
		expect(presenter.describeStatus(createView({ outcome: 'no-path' }))).toBe(
			'Nie ma drogi między tymi miejscami w sieci gry.'
		);
	});

	it('dla znalezionej trasy nie pokazuje komunikatu stanu', () => {
		expect(presenter.describeStatus(createView({}))).toBeNull();
	});

	it('opisuje dojście spoza sieci jako sumę obu odcinków', () => {
		const note = presenter.describeApproach(
			createView({ startApproachMetres: 10, endApproachMetres: 25 }),
			(metres) => `${metres} m`
		);
		expect(note).toBe('Dojście poza siecią dróg: 35 m');
	});

	it('bez dojścia poza siecią nie pokazuje opisu', () => {
		expect(presenter.describeApproach(createView({}), (metres) => `${metres} m`)).toBeNull();
	});
});
