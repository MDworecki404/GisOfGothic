import { Cartesian3, Color, CustomShader, CustomShaderTranslucencyMode, UniformType } from 'cesium';

const TINT_STRENGTH = 0.62;

/**
 * Shader „widmowego” świata w porównaniu rozmiarów: kolor modelu zmieszany z barwą świata i stała przezroczystość.
 * Przezroczystość (`u_alpha`) zmienia się bez przebudowy shadera, więc podświetlenie po najechaniu jest tanie.
 */
export class GhostWorldShaderBuilder {
	createShader(tintCssColor: string, alpha: number): CustomShader {
		const tint = Color.fromCssColorString(tintCssColor);
		return new CustomShader({
			translucencyMode: CustomShaderTranslucencyMode.TRANSLUCENT,
			uniforms: {
				u_tint: { type: UniformType.VEC3, value: new Cartesian3(tint.red, tint.green, tint.blue) },
				u_alpha: { type: UniformType.FLOAT, value: alpha }
			},
			fragmentShaderText: `
				void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
					material.diffuse = mix(material.diffuse, u_tint, ${TINT_STRENGTH.toFixed(2)});
					material.alpha = u_alpha;
				}
			`
		});
	}

	setAlpha(shader: CustomShader, alpha: number): void {
		shader.setUniform('u_alpha', alpha);
	}
}
