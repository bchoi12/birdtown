import * as BABYLON from 'babylonjs'

import { game } from 'game'
import { AttributeType, ComponentType } from 'game/component/api'
import { Attributes } from 'game/component/attributes'
import { Model } from 'game/component/model'
import { Entity, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Equip } from 'game/entity/equip'
import { Player } from 'game/entity/player'
import { MeshType } from 'game/factory/api'
import { MeshFactory, LoadResult } from 'game/factory/mesh_factory'

import { KeyType } from 'ui/api'

import { defined } from 'util/common'
import { Timer } from 'util/timer'
import { Vec2 } from 'util/vector'

export abstract class Weapon extends Equip<Player> {
	private static readonly _shootNodeName = "shoot";

	protected _model : Model;
	protected _reloadTimer : Timer;

	protected _shoot : BABYLON.TransformNode;

	constructor(entityType : EntityType, entityOptions : EntityOptions) {
		super(entityType, entityOptions);
		this._allTypes.add(EntityType.WEAPON);

		this.addNameParams({
			base: "weapon",
			id: this.id(),
		});

		this._model = this.addComponent<Model>(new Model({
			meshFn: (model : Model) => {
				MeshFactory.load(this.meshType(), (result : LoadResult) => {
					let mesh = <BABYLON.Mesh>result.meshes[0];

					result.transformNodes.forEach((node : BABYLON.TransformNode) => {
						if (node.name === Weapon._shootNodeName) {
							this._shoot = node;
						}
					});

					model.setMesh(mesh);
				});
			},
		}));

		this._reloadTimer = this.newTimer();
	}

	override ready() { return super.ready(); }

	abstract meshType() : MeshType;
	shootNode() : BABYLON.TransformNode { return defined(this._shoot) ? this._shoot : this._model.mesh(); }

	reload(time : number) : void {
		this._attributes.setAttribute(AttributeType.READY, false);
		this._reloadTimer.start(time, () => {
			this._attributes.setAttribute(AttributeType.READY, true);
		});
	}
	reloadTimeLeft() : number {
		return this._reloadTimer.timeLeft();
	}
}
