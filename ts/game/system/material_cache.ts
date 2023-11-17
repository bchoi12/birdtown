import * as BABYLON from '@babylonjs/core/Legacy/legacy'

import { game } from 'game'
import { EntityType } from 'game/entity/api'
import { System, SystemBase } from 'game/system'
import { SystemType } from 'game/system/api'

export class MaterialCache extends SystemBase implements System {

	private _materials : Map<EntityType, BABYLON.Material>;

	constructor() {
		super(SystemType.MATERIAL_CACHE);

		this._materials = new Map();
	}

	override initialize() : void {
		super.initialize();

		let cloud = new BABYLON.StandardMaterial("cloud_material", game.scene());
		cloud.alpha = 0.4;
		cloud.needDepthPrePass = true;
		this._materials.set(EntityType.CLOUD, cloud);
	}

	hasMaterial(type : EntityType) : boolean { return this._materials.has(type); }
	material(type : EntityType) : BABYLON.Material { return this._materials.get(type); }
}