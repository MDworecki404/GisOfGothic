(function () {
	try {
		var saved = localStorage.getItem('gisofgothic:theme:v1');
		var isLight =
			saved === 'light' ||
			(saved !== 'dark' && window.matchMedia('(prefers-color-scheme: light)').matches);
		var root = document.documentElement;
		root.dataset.theme = isLight ? 'light' : 'dark';
		root.classList.toggle('dark', !isLight);
	} catch (error) {
		document.documentElement.dataset.theme = 'dark';
	}
})();
