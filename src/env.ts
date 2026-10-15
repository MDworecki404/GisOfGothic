import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	PUBLIC_CESIUM_ION_TOKEN: {
		public: true,
		static: true,
		description: 'Token Cesium ion — model świata jest hostowany jako 3D Tiles na ion',
		schema: (value) => value || undefined
	}
});
