import * as BABYLON from '@babylonjs/core/Legacy/legacy'

import { game } from 'game'
import { AttributeType } from 'game/component/api'
import { Entity } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { MaterialType } from 'game/factory/api'
import { ColorFactory } from 'game/factory/color_factory'

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

		let cloud = standardMaterial(MaterialType.CLOUD);
		cloud.alpha = 0.4;
		cloud.needDepthPrePass = true;
		materials.set(MaterialType.CLOUD, cloud);

		let boltBlue = standardMaterial(MaterialType.BOLT_BLUE);
		boltBlue.emissiveColor = ColorFactory.boltBlue.toBabylonColor3();
		boltBlue.disableLighting = true;
		materials.set(MaterialType.BOLT_BLUE, boltBlue);

		let boltOrange = standardMaterial(MaterialType.BOLT_ORANGE);
		boltOrange.emissiveColor = ColorFactory.boltOrange.toBabylonColor3();
		boltOrange.disableLighting = true;
		materials.set(MaterialType.BOLT_ORANGE, boltOrange);

		let boltExplosion = standardMaterial(MaterialType.BOLT_EXPLOSION);
		boltExplosion.emissiveColor = ColorFactory.boltExplosion.toBabylonColor3();
		boltExplosion.disableLighting = true;
		materials.set(MaterialType.BOLT_EXPLOSION, boltExplosion);

		let rocketExplosion = standardMaterial(MaterialType.ROCKET_EXPLOSION);
		rocketExplosion.emissiveColor = ColorFactory.rocketExplosion.toBabylonColor3();
		rocketExplosion.disableLighting = true;
		materials.set(MaterialType.ROCKET_EXPLOSION, rocketExplosion);

		let sparkBlue = standardMaterial(MaterialType.SPARK_BLUE);
		sparkBlue.emissiveColor = ColorFactory.sparkBlue.toBabylonColor3();
		sparkBlue.disableLighting = true;
		sparkBlue.alpha = 0.7;
		materials.set(MaterialType.SPARK_BLUE, sparkBlue);

		initialized = true;
	}

	function standardMaterial(type : MaterialType) : BABYLON.StandardMaterial {
		return new BABYLON.StandardMaterial(MaterialType[type], game.scene());
	}
}
