import * as BABYLON from '@babylonjs/core/Legacy/legacy'

import { Model } from 'game/component/model'
import { Entity, EquipEntity, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Equip, AttachType } from 'game/entity/equip'
import { MeshType } from 'game/factory/api'
import { MeshFactory, LoadResult } from 'game/factory/mesh_factory'

import { defined } from 'util/common'

export abstract class Headwear extends Equip<Entity & EquipEntity> {

	private static readonly _top = "top";

	private _model : Model;
	private _top : BABYLON.TransformNode;

	constructor(entityType : EntityType, entityOptions : EntityOptions) {
		super(entityType, entityOptions);
		this.addType(EntityType.HEADWEAR);

		this._model = this.addComponent<Model>(new Model({
			meshFn: (model : Model) => {
				MeshFactory.load(this.meshType(), (result : LoadResult) => {
					let mesh = result.mesh;

					result.transformNodes.forEach((node : BABYLON.TransformNode) => {
						if (node.name === Headwear._top) {
							this._top = node;
						}
					});

					if (!defined(Headwear._top)) {
						console.error("Warning: headwear %s is missing top bone", this.name());
					}

					model.setMesh(mesh);
				});
			},
			init: entityOptions.modelInit,
		}));
	}

	abstract meshType() : MeshType;

	override attachType() : AttachType { return AttachType.HEAD; }

	shouldHide(type : AttachType) : boolean { return type === AttachType.HEAD; }
}