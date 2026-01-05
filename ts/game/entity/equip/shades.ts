import * as BABYLON from '@babylonjs/core/Legacy/legacy'

import { AttributeType } from 'game/component/api'
import { Model } from 'game/component/model'
import { EntityType } from 'game/entity/api'
import { Entity, EntityOptions } from 'game/entity'
import { Equip, AttachType } from 'game/entity/equip'
import { Player } from 'game/entity/bird/player'
import { MaterialType, MeshType } from 'game/factory/api'
import { MeshFactory, LoadResult } from 'game/factory/mesh_factory'

export class Shades extends Equip<Player> {

	constructor(entityOptions : EntityOptions) {
		super(EntityType.SHADES, entityOptions);

		this.addComponent<Model>(new Model({
			meshFn: (model : Model) => {
				MeshFactory.load(MeshType.SHADES, (result : LoadResult) => {
					let mesh = result.mesh;
					model.setMesh(mesh);
				});
			},
			init: entityOptions.modelInit,
		}));
	}

	override attachType() : AttachType { return AttachType.EYE; }
}