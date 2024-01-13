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

	export function materialForEntity(entity : Entity) : BABYLON.Material {
		switch (entity.type()) {
		case EntityType.BOLT:
			if (entity.getAttribute(AttributeType.CHARGED)) {
				return material(MaterialType.BOLT_ORANGE);
			}
			return material(MaterialType.BOLT_BLUE);
		case EntityType.CLOUD:
			return material(MaterialType.CLOUD);
		default:
			console.error("Error: no material set for %s", entity.name());
			return new BABYLON.StandardMaterial("unknown_material", game.scene());
		}
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
		boltBlue.diffuseColor = ColorFactory.boltBlue.toBabylonColor3();
		materials.set(MaterialType.BOLT_BLUE, boltBlue);

		let boltOrange = standardMaterial(MaterialType.BOLT_ORANGE);
		boltOrange.diffuseColor = ColorFactory.boltOrange.toBabylonColor3();
		materials.set(MaterialType.BOLT_ORANGE, boltOrange);

		let sparkBlue = standardMaterial(MaterialType.SPARK_BLUE);
		sparkBlue.diffuseColor = ColorFactory.sparkBlue.toBabylonColor3();
		materials.set(MaterialType.SPARK_BLUE, sparkBlue);

		let sparkOrange = standardMaterial(MaterialType.SPARK_ORANGE);
		sparkOrange.diffuseColor = ColorFactory.sparkOrange.toBabylonColor3();
		materials.set(MaterialType.SPARK_ORANGE, sparkOrange);

		initialized = true;
	}

	function standardMaterial(type : MaterialType) : BABYLON.StandardMaterial {
		return new BABYLON.StandardMaterial(MaterialType[type], game.scene());
	}
}
