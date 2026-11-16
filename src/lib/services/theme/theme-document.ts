import type { ResolvedTheme } from './theme-preference.js';

/** Miejsce, w którym motyw się pokazuje: dokument strony i ustawienie jasnego trybu w systemie. */
export interface ThemeDocument {
	readSystemPrefersLight(): boolean;
	listenForSystemSchemeChange(onChange: () => void): void;
	showTheme(theme: ResolvedTheme): void;
}

/** Dokument zastępczy dla budowania na serwerze, gdzie nie ma strony do pokolorowania. */
export const NO_THEME_DOCUMENT: ThemeDocument = {
	readSystemPrefersLight: () => false,
	listenForSystemSchemeChange: () => undefined,
	showTheme: () => undefined
};

const THEME_COLOR_BY_THEME: Record<ResolvedTheme, string> = {
	dark: '#0f1c1d',
	light: '#a8bdb5'
};

export class BrowserThemeDocument implements ThemeDocument {
	constructor(
		private readonly root: HTMLElement,
		private readonly colorSchemeQuery: MediaQueryList,
		private readonly themeColorMeta: HTMLMetaElement | null
	) {}

	static forBrowser(): BrowserThemeDocument {
		return new BrowserThemeDocument(
			document.documentElement,
			window.matchMedia('(prefers-color-scheme: light)'),
			document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
		);
	}

	readSystemPrefersLight(): boolean {
		return this.colorSchemeQuery.matches;
	}

	listenForSystemSchemeChange(onChange: () => void): void {
		this.colorSchemeQuery.addEventListener('change', onChange);
	}

	showTheme(theme: ResolvedTheme): void {
		this.root.dataset.theme = theme;
		this.root.classList.toggle('dark', theme === 'dark');
		this.themeColorMeta?.setAttribute('content', THEME_COLOR_BY_THEME[theme]);
	}
}
