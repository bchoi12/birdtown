import * as BABYLON from '@babylonjs/core/Legacy/legacy'

import { game } from 'game'
import { AttributeType } from 'game/component/api'
import { Entity } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { ColorFactory } from 'game/factory/color_factory'
import { System, SystemBase } from 'game/system'
import { SystemType, MaterialType } from 'game/system/api'

// TODO: should be factory?
export class MaterialCache extends SystemBase implements System {

	private _materials : Map<MaterialType, BABYLON.Material>;

	constructor() {
		super(SystemType.MATERIAL_CACHE);

		this._materials = new Map();
	}

	override initialize() : void {
		super.initialize();

		let cloud = new BABYLON.StandardMaterial(MaterialType[MaterialType.CLOUD], game.scene());
		cloud.alpha = 0.4;
		cloud.needDepthPrePass = true;
		this._materials.set(MaterialType.CLOUD, cloud);

		let boltBlue = new BABYLON.StandardMaterial(MaterialType[MaterialType.BOLT_BLUE], game.scene());
		boltBlue.diffuseColor = ColorFactory.boltBlue.toBabylonColor3();
		this._materials.set(MaterialType.BOLT_BLUE, boltBlue);

		let boltOrange = new BABYLON.StandardMaterial(MaterialType[MaterialType.BOLT_ORANGE], game.scene());
		boltOrange.diffuseColor = ColorFactory.boltOrange.toBabylonColor3();
		this._materials.set(MaterialType.BOLT_ORANGE, boltOrange);

		let sparkBlue = new BABYLON.StandardMaterial(MaterialType[MaterialType.SPARK_BLUE], game.scene());
		sparkBlue.diffuseColor = ColorFactory.sparkBlue.toBabylonColor3();
		this._materials.set(MaterialType.SPARK_BLUE, sparkBlue);

		let sparkOrange = new BABYLON.StandardMaterial(MaterialType[MaterialType.SPARK_ORANGE], game.scene());
		sparkOrange.diffuseColor = ColorFactory.sparkOrange.toBabylonColor3();
		this._materials.set(MaterialType.SPARK_ORANGE, sparkOrange);
	}

	material(type : MaterialType) : BABYLON.Material { return this._materials.get(type); }

	materialForEntity(entity : Entity) : BABYLON.Material {
		switch (entity.type()) {
		case EntityType.BOLT:
			if (entity.getAttribute(AttributeType.CHARGED)) {
				return this.material(MaterialType.BOLT_ORANGE);
			}
			return this.material(MaterialType.BOLT_BLUE);
		case EntityType.CLOUD:
			return this.material(MaterialType.CLOUD);
		default:
			console.error("Error: no material set for %s", entity.name());
			return new BABYLON.StandardMaterial("unknown_material", game.scene());
		}
	}

}