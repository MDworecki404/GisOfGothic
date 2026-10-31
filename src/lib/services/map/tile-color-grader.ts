import { Cartesian3, CustomShader, Matrix3, UniformType } from 'cesium';
import type { TileColorGrade } from '#lib/data/world-catalog.js';
import { NO_MAP_OVERLAYS, type MapOverlays } from '#lib/services/overlays/map-overlays.js';
import { OVERLAY_COMPOSITION_GLSL, OVERLAY_LINE_FUNCTION_GLSL } from './terrain-overlay-glsl.js';

const UNCHANGED_COLOR_GRADE: TileColorGrade = { gamma: 1, saturation: 1, brightness: 1 };

/**
 * Buduje shader kafli świata. Korekta koloru: gamma poniżej 1 rozjaśnia cienie tekstur (ciemne
 * miejsca zyskują najwięcej, jasne prawie nic), nasycenie powyżej 1 ożywia barwy, a jasność skaluje
 * całość. Nakładki (poziomice i siatka) rysuje po korekcie, na kolorze materiału, więc oświetlenie
 * sceny nadal się liczy. `null` zamiast korekty zostawia kolory modelu.
 */
export class TileColorGrader {
	createShader(
		grade: TileColorGrade | null,
		overlays: MapOverlays = NO_MAP_OVERLAYS
	): CustomShader {
		const appliedGrade = grade ?? UNCHANGED_COLOR_GRADE;
		return new CustomShader({
			uniforms: {
				u_gamma: { type: UniformType.FLOAT, value: appliedGrade.gamma },
				u_saturation: { type: UniformType.FLOAT, value: appliedGrade.saturation },
				u_brightness: { type: UniformType.FLOAT, value: appliedGrade.brightness },
				u_contoursEnabled: {
					type: UniformType.FLOAT,
					value: overlays.areContoursVisible ? 1 : 0
				},
				u_gridEnabled: { type: UniformType.FLOAT, value: overlays.isGridVisible ? 1 : 0 },
				u_ecToEnu: { type: UniformType.MAT3, value: Matrix3.clone(Matrix3.IDENTITY) },
				u_cameraEnu: { type: UniformType.VEC3, value: Cartesian3.clone(Cartesian3.ZERO) }
			},
			fragmentShaderText: `
				${OVERLAY_LINE_FUNCTION_GLSL}
				${OVERLAY_COMPOSITION_GLSL}
				void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
					vec3 liftedColor = pow(max(material.diffuse, vec3(0.0)), vec3(u_gamma));
					float luminance = dot(liftedColor, vec3(0.299, 0.587, 0.114));
					vec3 saturatedColor = mix(vec3(luminance), liftedColor, u_saturation);
					vec3 gradedColor = clamp(saturatedColor * u_brightness, 0.0, 1.0);
					vec3 worldPosition = u_cameraEnu + u_ecToEnu * fsInput.attributes.positionEC;
					material.diffuse = applyOverlays(gradedColor, worldPosition);
				}
			`
		});
	}
}
