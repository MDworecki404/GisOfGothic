const ENCYCLOPEDIA_SEARCH_URL = 'https://gothic.fandom.com/pl/wiki/Special:Search';

/** Buduje odnośniki do Gothicpedii. Prowadzą do jej wyszukiwarki, bo tytuł artykułu nie zawsze równa się nazwie w grze. */
export class EncyclopediaLinkBuilder {
	buildSearchUrl(articleName: string): string {
		const searchUrl = new URL(ENCYCLOPEDIA_SEARCH_URL);
		searchUrl.searchParams.set('query', articleName);
		return searchUrl.toString();
	}
}
