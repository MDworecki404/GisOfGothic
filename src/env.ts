import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	PUBLIC_CESIUM_ION_TOKEN: {
		public: true,
		static: true,
		description: 'Opcjonalny token Cesium ion (na razie niepotrzebny)',
		schema: (value) => value || undefined
	}
});
