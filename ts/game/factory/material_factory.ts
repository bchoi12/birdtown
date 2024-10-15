import * as BABYLON from '@babylonjs/core/Legacy/legacy'
import { CustomMaterial } from '@babylonjs/materials/custom/customMaterial'
import { GradientMaterial } from '@babylonjs/materials/Gradient'

import { game } from 'game'
import { AttributeType } from 'game/component/api'
import { Entity } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { ColorType, MaterialType, TextureType } from 'game/factory/api'
import { ColorFactory } from 'game/factory/color_factory'
import { TextureFactory } from 'game/factory/texture_factory'

import { HexColor } from 'util/hex_color'

type MaterialFn<T extends BABYLON.Material> = (material : T) => void;

export namespace MaterialFactory {

	let initialized = false;
	let materials = new Map<MaterialType, BABYLON.Material>;

	export function material<T extends BABYLON.Material>(type : MaterialType) : T {
		if (!initialized) {
			initialize();
		}
		return <T>materials.get(type);
	}

	export function initialize() : void {
		if (initialized) {
			return;
		}

		levelBackgroundMaterial(MaterialType.ARCH_BACKGROUND_RED, ColorFactory.color(ColorType.LEVEL_BACKGROUND_RED));
		levelBackgroundMaterial(MaterialType.ARCH_BACKGROUND_ORANGE, ColorFactory.color(ColorType.LEVEL_BACKGROUND_ORANGE));
		levelBackgroundMaterial(MaterialType.ARCH_BACKGROUND_YELLOW, ColorFactory.color(ColorType.LEVEL_BACKGROUND_YELLOW));
		levelBackgroundMaterial(MaterialType.ARCH_BACKGROUND_GREEN, ColorFactory.color(ColorType.LEVEL_BACKGROUND_GREEN));
		levelBackgroundMaterial(MaterialType.ARCH_BACKGROUND_BLUE, ColorFactory.color(ColorType.LEVEL_BACKGROUND_BLUE));
		levelBackgroundMaterial(MaterialType.ARCH_BACKGROUND_PURPLE, ColorFactory.color(ColorType.LEVEL_BACKGROUND_PURPLE));

		standardMaterial(MaterialType.BLACK_HOLE, (mat : BABYLON.StandardMaterial) => {
			mat.alpha = 0.9;
			mat.disableLighting = true;
			mat.emissiveColor = ColorFactory.color(ColorType.BLACK).toBabylonColor3();
		});

		standardMaterial(MaterialType.CLOUD, (mat : BABYLON.StandardMaterial) => {
			mat.alpha = 0.4;
			mat.needDepthPrePass = true;
		});

		standardMaterial(MaterialType.DYING_STAR, (mat : BABYLON.StandardMaterial) => {
			mat.alpha = 0.8;
			mat.specularPower = 8;
			mat.diffuseColor = ColorFactory.color(ColorType.WHITE).toBabylonColor3();
		});

		standardMaterial(MaterialType.DYING_STAR_RING, (mat : BABYLON.StandardMaterial) => {
			mat.alpha = 0.7;
			mat.disableLighting = true;
			mat.emissiveColor = ColorFactory.color(ColorType.SHOOTER_ORANGE).toBabylonColor3();
		});

		standardMaterial(MaterialType.SPAWN_POINT, (mat : BABYLON.StandardMaterial) => {
			mat.diffuseColor = ColorFactory.color(ColorType.YELLOW).toBabylonColor3();
		});

		standardMaterial(MaterialType.SWEAT, (mat : BABYLON.StandardMaterial) => {
			mat.disableLighting = true;
			mat.emissiveColor = ColorFactory.color(ColorType.SWEAT).toBabylonColor3();
		});

		standardMaterial(MaterialType.SHOOTER_BLUE, (mat : BABYLON.StandardMaterial) => {
			mat.disableLighting = true;
			mat.emissiveColor = ColorFactory.color(ColorType.SHOOTER_BLUE).toBabylonColor3();
		});
		standardMaterial(MaterialType.SHOOTER_LIGHT_BLUE, (mat : BABYLON.StandardMaterial) => {
			mat.disableLighting = true;
			mat.emissiveColor = ColorFactory.color(ColorType.SHOOTER_LIGHT_BLUE).toBabylonColor3();
		});
		standardMaterial(MaterialType.SHOOTER_YELLOW, (mat : BABYLON.StandardMaterial) => {
			mat.disableLighting = true;
			mat.emissiveColor = ColorFactory.color(ColorType.SHOOTER_YELLOW).toBabylonColor3();
		});
		standardMaterial(MaterialType.SHOOTER_WHITE, (mat : BABYLON.StandardMaterial) => {
			mat.disableLighting = true;
			mat.emissiveColor = ColorFactory.color(ColorType.WHITE).toBabylonColor3();
		});
		standardMaterial(MaterialType.SHOOTER_ORANGE, (mat : BABYLON.StandardMaterial) => {
			mat.disableLighting = true;
			mat.emissiveColor = ColorFactory.color(ColorType.SHOOTER_ORANGE).toBabylonColor3();
		});
		standardMaterial(MaterialType.SHOOTER_LIGHT_ORANGE, (mat : BABYLON.StandardMaterial) => {
			mat.alpha = 0.7;
			mat.disableLighting = true;
			mat.emissiveColor = ColorFactory.color(ColorType.SHOOTER_LIGHT_ORANGE).toBabylonColor3();
		});
		standardMaterial(MaterialType.PARTICLE_ORANGE, (mat : BABYLON.StandardMaterial) => {
			mat.alpha = 0.7;
			mat.disableLighting = true;
			mat.emissiveColor = ColorFactory.color(ColorType.PARTICLE_ORANGE).toBabylonColor3();
		});

		standardMaterial(MaterialType.WESTERN_YELLOW_TRAIL, (mat : BABYLON.StandardMaterial) => {
			mat.alpha = 0.7;
			mat.disableLighting = true;
			mat.emissiveColor = ColorFactory.color(ColorType.WESTERN_YELLOW).toBabylonColor3();
		});
		standardMaterial(MaterialType.WESTERN_YELLOW, (mat : BABYLON.StandardMaterial) => {
			mat.disableLighting = true;
			mat.emissiveColor = ColorFactory.color(ColorType.WESTERN_YELLOW).toBabylonColor3();
		});

		standardMaterial(MaterialType.PICKUP_BLUE, (mat : BABYLON.StandardMaterial) => {
			mat.diffuseColor = ColorFactory.color(ColorType.PICKUP_BLUE).toBabylonColor3();
		});
		standardMaterial(MaterialType.PICKUP_RED, (mat : BABYLON.StandardMaterial) => {
			mat.diffuseColor = ColorFactory.color(ColorType.PICKUP_RED).toBabylonColor3();
		});
		standardMaterial(MaterialType.PICKUP_YELLOW, (mat : BABYLON.StandardMaterial) => {
			mat.diffuseColor = ColorFactory.color(ColorType.PICKUP_YELLOW).toBabylonColor3();
		});

		standardMaterial(MaterialType.EASTERN_PURPLE_TRAIL, (mat : BABYLON.StandardMaterial) => {
			mat.alpha = 0.7;
			mat.disableLighting = true;
			mat.emissiveColor = ColorFactory.color(ColorType.EASTERN_PURPLE).toBabylonColor3();
		});

		standardMaterial(MaterialType.EASTERN_PURPLE_SOLID_TRAIL, (mat : BABYLON.StandardMaterial) => {
			mat.disableLighting = true;
			mat.emissiveColor = ColorFactory.color(ColorType.EASTERN_PURPLE).toBabylonColor3();
		});

		gradientMaterial(MaterialType.SKY_DAY, (mat : GradientMaterial) => {
		    mat.topColor = ColorFactory.color(ColorType.SKY_DAY_TOP).toBabylonColor3();
		    mat.bottomColor = ColorFactory.color(ColorType.SKY_DAY_BOTTOM).toBabylonColor3();

			mat.backFaceCulling = false;
		    mat.offset = 0;
		    mat.smoothness = 1;
		    mat.scale = 0.03
		    mat.disableLighting = true;
		});

		gradientMaterial(MaterialType.SKY_EVENING, (mat : GradientMaterial) => {
		    mat.topColor = ColorFactory.color(ColorType.SKY_EVENING_TOP).toBabylonColor3();
		    mat.bottomColor = ColorFactory.color(ColorType.SKY_EVENING_BOTTOM).toBabylonColor3();

			mat.backFaceCulling = false;
		    mat.offset = 0;
		    mat.smoothness = 1;
		    mat.scale = 0.03
		    mat.disableLighting = true;
		});

		gradientMaterial(MaterialType.SKY_NIGHT, (mat : GradientMaterial) => {
		    mat.topColor = ColorFactory.color(ColorType.SKY_NIGHT_TOP).toBabylonColor3();
		    mat.bottomColor = ColorFactory.color(ColorType.SKY_NIGHT_BOTTOM).toBabylonColor3();

			mat.backFaceCulling = false;
		    mat.offset = 0;
		    mat.smoothness = 1;
		    mat.scale = 0.03
		    mat.disableLighting = true;
		});

		standardMaterial(MaterialType.PARTICLE_RED, (mat : BABYLON.StandardMaterial) => {
			mat.alpha = 0.7;
			mat.disableLighting = true;
			mat.emissiveColor = ColorFactory.color(ColorType.PARTICLE_RED).toBabylonColor3();
		});

		standardMaterial(MaterialType.PARTICLE_BLUE, (mat : BABYLON.StandardMaterial) => {
			mat.alpha = 0.7;
			mat.disableLighting = true;
			mat.emissiveColor = ColorFactory.color(ColorType.PARTICLE_BLUE).toBabylonColor3();
		});

		standardMaterial(MaterialType.PARTICLE_YELLOW, (mat : BABYLON.StandardMaterial) => {
			mat.alpha = 0.7;
			mat.disableLighting = true;
			mat.emissiveColor = ColorFactory.color(ColorType.PARTICLE_YELLOW).toBabylonColor3();
		});

		standardMaterial(MaterialType.PARTICLE_PURPLE, (mat : BABYLON.StandardMaterial) => {
			mat.alpha = 0.7;
			mat.disableLighting = true;
			mat.emissiveColor = ColorFactory.color(ColorType.PARTICLE_PURPLE).toBabylonColor3();
		});

		initialized = true;
	}

	export function levelBackgroundMaterials() : MaterialType[] {
		return [
			MaterialType.ARCH_BACKGROUND_RED,
			MaterialType.ARCH_BACKGROUND_ORANGE,
			MaterialType.ARCH_BACKGROUND_YELLOW,
			MaterialType.ARCH_BACKGROUND_GREEN,
			MaterialType.ARCH_BACKGROUND_BLUE,
			MaterialType.ARCH_BACKGROUND_PURPLE,
		];
	}

	function levelBackgroundMaterial(type : MaterialType, color : HexColor) : void {
		customMaterial(type, (mat : CustomMaterial) => {
			mat.diffuseTexture = TextureFactory.loadCached(TextureType.ARCH_WINDOWS);
			mat.diffuseTexture.hasAlpha = true;
			mat.useAlphaFromDiffuseTexture = true;
			mat.Fragment_Before_FragColor(`
				if (color.a < 1.) {
					color = vec4(` + color.toShaderVec3() + `, 1);
				}
	        `);
			mat.specularPower = 128;
			mat.disableLighting = false;
		});
	}

	function standardMaterial(type : MaterialType, fn : MaterialFn<BABYLON.StandardMaterial>) : void {
		let mat = new BABYLON.StandardMaterial(MaterialType[type], game.scene());
		fn(mat);

		if (!mat.needDepthPrePass) {
			mat.freeze();
		}

		if (materials.has(type)) {
			console.error("Warning: overwriting material", MaterialType[type]);
		}
		materials.set(type, mat);
	}

	function customMaterial(type : MaterialType, fn : MaterialFn<CustomMaterial>) : void {
		let mat = new CustomMaterial(MaterialType[type], game.scene());
		fn(mat);
		if (!mat.needDepthPrePass) {
			mat.freeze();
		}

		if (materials.has(type)) {
			console.error("Warning: overwriting material", MaterialType[type]);
		}
		materials.set(type, mat);
	}

	function gradientMaterial(type : MaterialType, fn : MaterialFn<GradientMaterial>) : void {
		let mat = new GradientMaterial(MaterialType[type], game.scene());
		fn(mat);
		if (!mat.needDepthPrePass) {
			mat.freeze();
		}

		if (materials.has(type)) {
			console.error("Warning: overwriting material", MaterialType[type]);
		}
		materials.set(type, mat);
	}
}
