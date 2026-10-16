import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	PUBLIC_MODEL_KEY: {
		public: true,
		static: true,
		description:
			'Klucz odszyfrowania podglądów przedmiotów (scripts/protect-item-models.mjs). Trafia do strony — to utrudnienie, nie tajemnica',
		schema: (value) => value || undefined
	}
});
