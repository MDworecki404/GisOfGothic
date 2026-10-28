import { CustomShader, UniformType } from 'cesium';
import type { TileColorGrade } from '#lib/data/world-catalog.js';

/**
 * Buduje shader korygujący kolor kafli świata. Gamma poniżej 1 rozjaśnia cienie tekstur (ciemne
 * miejsca zyskują najwięcej, jasne prawie nic), nasycenie powyżej 1 ożywia barwy, a jasność skaluje
 * całość. Działa na kolor materiału, więc oświetlenie sceny nadal się liczy.
 */
export class TileColorGrader {
	createShader(grade: TileColorGrade): CustomShader {
		return new CustomShader({
			uniforms: {
				u_gamma: { type: UniformType.FLOAT, value: grade.gamma },
				u_saturation: { type: UniformType.FLOAT, value: grade.saturation },
				u_brightness: { type: UniformType.FLOAT, value: grade.brightness }
			},
			fragmentShaderText: `
				void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
					vec3 liftedColor = pow(max(material.diffuse, vec3(0.0)), vec3(u_gamma));
					float luminance = dot(liftedColor, vec3(0.299, 0.587, 0.114));
					vec3 saturatedColor = mix(vec3(luminance), liftedColor, u_saturation);
					material.diffuse = clamp(saturatedColor * u_brightness, 0.0, 1.0);
				}
			`
		});
	}
}
