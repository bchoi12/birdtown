import * as BABYLON from '@babylonjs/core/Legacy/legacy'
import { CustomMaterial } from '@babylonjs/materials/custom/customMaterial'

import { game } from 'game'
import { AttributeType } from 'game/component/api'
import { Entity } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { MaterialType, TextureType } from 'game/factory/api'
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

		archBackgroundMaterial(MaterialType.ARCH_BACKGROUND_RED, ColorFactory.archBackgroundRed);
		archBackgroundMaterial(MaterialType.ARCH_BACKGROUND_ORANGE, ColorFactory.archBackgroundOrange);
		archBackgroundMaterial(MaterialType.ARCH_BACKGROUND_YELLOW, ColorFactory.archBackgroundYellow);
		archBackgroundMaterial(MaterialType.ARCH_BACKGROUND_GREEN, ColorFactory.archBackgroundGreen);
		archBackgroundMaterial(MaterialType.ARCH_BACKGROUND_BLUE, ColorFactory.archBackgroundBlue);
		archBackgroundMaterial(MaterialType.ARCH_BACKGROUND_PURPLE, ColorFactory.archBackgroundPurple);

		standardMaterial(MaterialType.BLACK_HOLE, (mat : BABYLON.StandardMaterial) => {
			mat.alpha = 0.5;
			mat.disableLighting = true;
			mat.emissiveColor = ColorFactory.black.toBabylonColor3();
		});

		standardMaterial(MaterialType.BOLT_BLUE, (mat : BABYLON.StandardMaterial) => {
			mat.disableLighting = true;
			mat.emissiveColor = ColorFactory.boltBlue.toBabylonColor3();
		});
		standardMaterial(MaterialType.BOLT_LIGHT_BLUE, (mat : BABYLON.StandardMaterial) => {
			mat.alpha = 0.7;
			mat.disableLighting = true;
			mat.emissiveColor = ColorFactory.boltLightOrange.toBabylonColor3();
		});
		standardMaterial(MaterialType.BOLT_ORANGE, (mat : BABYLON.StandardMaterial) => {
			mat.disableLighting = true;
			mat.emissiveColor = ColorFactory.boltOrange.toBabylonColor3();
		});
		standardMaterial(MaterialType.BOLT_LIGHT_ORANGE, (mat : BABYLON.StandardMaterial) => {
			mat.alpha = 0.7;
			mat.disableLighting = true;
			mat.emissiveColor = ColorFactory.boltLightOrange.toBabylonColor3();
		});
		standardMaterial(MaterialType.BOLT_EXPLOSION, (mat : BABYLON.StandardMaterial) => {
			mat.alpha = 0.7;
			mat.disableLighting = true;
			mat.emissiveColor = ColorFactory.boltExplosion.toBabylonColor3();
		});

		standardMaterial(MaterialType.BULLET_TRAIL, (mat : BABYLON.StandardMaterial) => {
			mat.alpha = 0.7;
			mat.disableLighting = true;
			mat.emissiveColor = ColorFactory.bulletYellow.toBabylonColor3();
		});
		standardMaterial(MaterialType.BULLET_YELLOW, (mat : BABYLON.StandardMaterial) => {
			mat.disableLighting = true;
			mat.emissiveColor = ColorFactory.bulletYellow.toBabylonColor3();
		});

		standardMaterial(MaterialType.CALIBER_YELLOW, (mat : BABYLON.StandardMaterial) => {
			mat.disableLighting = true;
			mat.emissiveColor = ColorFactory.caliberYellow.toBabylonColor3();
		});

		standardMaterial(MaterialType.CLOUD, (mat : BABYLON.StandardMaterial) => {
			mat.alpha = 0.4;
			mat.needDepthPrePass = true;
		});

		standardMaterial(MaterialType.CRATE_BLUE, (mat : BABYLON.StandardMaterial) => {
			mat.diffuseColor = ColorFactory.crateBlue.toBabylonColor3();
		});
		standardMaterial(MaterialType.CRATE_RED, (mat : BABYLON.StandardMaterial) => {
			mat.diffuseColor = ColorFactory.crateRed.toBabylonColor3();
		});
		standardMaterial(MaterialType.CRATE_YELLOW, (mat : BABYLON.StandardMaterial) => {
			mat.diffuseColor = ColorFactory.crateYellow.toBabylonColor3();
		});

		standardMaterial(MaterialType.DASH_TRAIL, (mat : BABYLON.StandardMaterial) => {
			mat.alpha = 0.7;
			mat.disableLighting = true;
			mat.emissiveColor = ColorFactory.starPurple.toBabylonColor3();
		});

		standardMaterial(MaterialType.DYING_STAR, (mat : BABYLON.StandardMaterial) => {
			mat.alpha = 0.5;
			mat.disableLighting = true;
			mat.emissiveColor = ColorFactory.black.toBabylonColor3();
		});

		standardMaterial(MaterialType.PELLET_TRAIL, (mat : BABYLON.StandardMaterial) => {
			mat.alpha = 0.7;
			mat.disableLighting = true;
			mat.emissiveColor = ColorFactory.pelletYellow.toBabylonColor3();
		});
		standardMaterial(MaterialType.PELLET_YELLOW, (mat : BABYLON.StandardMaterial) => {
			mat.disableLighting = true;
			mat.emissiveColor = ColorFactory.pelletYellow.toBabylonColor3();
		});

		standardMaterial(MaterialType.ROCKET_EXPLOSION, (mat : BABYLON.StandardMaterial) => {
			mat.alpha = 0.7;
			mat.disableLighting = true;
			mat.emissiveColor = ColorFactory.bazookaRed.toBabylonColor3();
		});

		standardMaterial(MaterialType.SPARK_BLUE, (mat : BABYLON.StandardMaterial) => {
			mat.alpha = 0.7;
			mat.disableLighting = true;
			mat.emissiveColor = ColorFactory.sparkBlue.toBabylonColor3();
		});

		standardMaterial(MaterialType.SPARK_YELLOW, (mat : BABYLON.StandardMaterial) => {
			mat.alpha = 0.7;
			mat.disableLighting = true;
			mat.emissiveColor = ColorFactory.sparkYellow.toBabylonColor3();
		});

		standardMaterial(MaterialType.STAR_EXPLOSION, (mat : BABYLON.StandardMaterial) => {
			mat.alpha = 0.7;
			mat.disableLighting = true;
			mat.emissiveColor = ColorFactory.starExplosionPurple.toBabylonColor3();
		});
		standardMaterial(MaterialType.STAR_TRAIL, (mat : BABYLON.StandardMaterial) => {
			mat.disableLighting = true;
			mat.emissiveColor = ColorFactory.starPurple.toBabylonColor3();
		});

		standardMaterial(MaterialType.SWEAT, (mat : BABYLON.StandardMaterial) => {
			mat.disableLighting = true;
			mat.emissiveColor = ColorFactory.sweatBlue.toBabylonColor3();
		});

		initialized = true;
	}

	export function archBackgroundMaterials() : MaterialType[] {
		return [
			MaterialType.ARCH_BACKGROUND_RED,
			MaterialType.ARCH_BACKGROUND_ORANGE,
			MaterialType.ARCH_BACKGROUND_YELLOW,
			MaterialType.ARCH_BACKGROUND_GREEN,
			MaterialType.ARCH_BACKGROUND_BLUE,
			MaterialType.ARCH_BACKGROUND_PURPLE,
		];
	}

	function archBackgroundMaterial(type : MaterialType, color : HexColor) : void {
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
}
