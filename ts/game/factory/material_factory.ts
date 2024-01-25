import * as BABYLON from '@babylonjs/core/Legacy/legacy'

import { game } from 'game'
import { AttributeType } from 'game/component/api'
import { Entity } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { MaterialType } from 'game/factory/api'
import { ColorFactory } from 'game/factory/color_factory'

type MaterialFn<T extends BABYLON.Material> = (material : T) => void;

export namespace MaterialFactory {

	let initialized = false;
	let materials = new Map<MaterialType, BABYLON.Material>;

	export function material(type : MaterialType) : BABYLON.Material {
		if (!initialized) {
			initialize();
		}
		return materials.get(type);
	}

	export function initialize() : void {
		if (initialized) {
			return;
		}

		standardMaterial(MaterialType.ARCH_BACKGROUND_RED, (mat : BABYLON.StandardMaterial) => {
			mat.diffuseColor = ColorFactory.archBackgroundRed.toBabylonColor3();
		});

		standardMaterial(MaterialType.BOLT_BLUE, (mat : BABYLON.StandardMaterial) => {
			mat.emissiveColor = ColorFactory.boltBlue.toBabylonColor3();
			mat.disableLighting = true;
		});
		standardMaterial(MaterialType.BOLT_ORANGE, (mat : BABYLON.StandardMaterial) => {
			mat.emissiveColor = ColorFactory.boltOrange.toBabylonColor3();
			mat.disableLighting = true;
		});
		standardMaterial(MaterialType.BOLT_EXPLOSION, (mat : BABYLON.StandardMaterial) => {
			mat.emissiveColor = ColorFactory.boltExplosion.toBabylonColor3();
			mat.disableLighting = true;
			mat.alpha = 0.7;
		});

		standardMaterial(MaterialType.CLOUD, (mat : BABYLON.StandardMaterial) => {
			mat.alpha = 0.4;
			mat.needDepthPrePass = true;
		});

		standardMaterial(MaterialType.ROCKET_EXPLOSION, (mat : BABYLON.StandardMaterial) => {
			mat.emissiveColor = ColorFactory.rocketExplosion.toBabylonColor3();
			mat.disableLighting = true;
			mat.alpha = 0.7;
		});

		standardMaterial(MaterialType.SPARK_BLUE, (mat : BABYLON.StandardMaterial) => {
			mat.emissiveColor = ColorFactory.sparkBlue.toBabylonColor3();
			mat.disableLighting = true;
			mat.alpha = 0.7;
		});

		initialized = true;
	}

	function standardMaterial(type : MaterialType, fn : MaterialFn<BABYLON.StandardMaterial>) : void {
		let mat = new BABYLON.StandardMaterial(MaterialType[type], game.scene());
		fn(mat);
		materials.set(type, mat);
	}
}
