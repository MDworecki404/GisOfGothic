import { Cartesian3, Color, CustomShader, CustomShaderTranslucencyMode, UniformType } from 'cesium';

export const DEFAULT_TINT_STRENGTH = 0.62;

/**
 * Shader „widmowego” świata w porównaniu rozmiarów: kolor modelu zmieszany z barwą świata i stała przezroczystość.
 * Przezroczystość (`u_alpha`) zmienia się bez przebudowy shadera, więc podświetlenie po najechaniu jest tanie.
 */
export class GhostWorldShaderBuilder {
	createShader(
		tintCssColor: string,
		alpha: number,
		tintStrength: number = DEFAULT_TINT_STRENGTH
	): CustomShader {
		const tint = Color.fromCssColorString(tintCssColor);
		return new CustomShader({
			translucencyMode: CustomShaderTranslucencyMode.TRANSLUCENT,
			uniforms: {
				u_tint: { type: UniformType.VEC3, value: new Cartesian3(tint.red, tint.green, tint.blue) },
				u_alpha: { type: UniformType.FLOAT, value: alpha },
				u_tintStrength: { type: UniformType.FLOAT, value: tintStrength }
			},
			fragmentShaderText: `
				void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
					material.diffuse = mix(material.diffuse, u_tint, u_tintStrength);
					material.alpha = u_alpha;
				}
			`
		});
	}

	/** `0` pokazuje prawdziwe kolory modelu, `DEFAULT_TINT_STRENGTH` mocno zabarwia światy, żeby dało się je odróżnić. */
	setTintStrength(shader: CustomShader, strength: number): void {
		shader.setUniform('u_tintStrength', strength);
	}

	setAlpha(shader: CustomShader, alpha: number): void {
		shader.setUniform('u_alpha', alpha);
	}
}
