import * as BABYLON from '@babylonjs/core/Legacy/legacy'

import { StepData } from 'game/game_object'
import { AttributeType, CounterType } from 'game/component/api'
import { Model } from 'game/component/model'
import { EntityType } from 'game/entity/api'
import { Entity, EntityOptions } from 'game/entity'
import { Equip, AttachType } from 'game/entity/equip'
import { Player } from 'game/entity/player'
import { MeshType } from 'game/factory/api'
import { MeshFactory, LoadResult } from 'game/factory/mesh_factory'

import { KeyType, KeyState } from 'ui/api'

export class Scouter extends Equip<Player> {

	private _weapons : Equip<Player>[];

	private _model : Model;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.SCOUTER, entityOptions);

		this._weapons = [];

		this._model = this.addComponent<Model>(new Model({
			meshFn: (model : Model) => {
				MeshFactory.load(MeshType.SCOUTER, (result : LoadResult) => {
					let mesh = <BABYLON.Mesh>result.meshes[0];
					model.setMesh(mesh);
				});
			},
			init: entityOptions.modelInit,
		}));
	}

	override displayName() : string { return "scouter"; }
	override attachType() : AttachType { return AttachType.EYE; }

	override preUpdate(stepData : StepData) : void {
		super.preUpdate(stepData);

		this._weapons = this.owner().equips().findAll((equip : Equip<Player>) => {
			return equip.allTypes().has(EntityType.WEAPON);
		});
	}

	override update(stepData : StepData) : void {
		super.update(stepData);
		const millis = stepData.millis;

		if (this.key(KeyType.ALT_MOUSE_CLICK, KeyState.DOWN)) {
			this._weapons.forEach((weapon : Equip<Player>) => {
				weapon.setAttribute(AttributeType.CHARGING, true);
				weapon.addCounter(CounterType.CHARGE, millis);
			});
		} else {
			this._weapons.forEach((weapon : Equip<Player>) => {
				weapon.setAttribute(AttributeType.CHARGING, false);
				weapon.setCounter(CounterType.CHARGE, 0);
			});
		}
	}
}