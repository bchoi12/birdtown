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

import { FnGlobals, InterpType } from 'global/fn_globals'

import { KeyType, KeyState } from 'ui/api'

import { Vec3 } from 'util/vector'

export class Scouter extends Equip<Player> {

	private static readonly _lookLength = 8;
	private static readonly _lookPanTime = 200;

	private _look : Vec3;
	private _lookWeight : number;
	private _weapons : Equip<Player>[];

	private _model : Model;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.SCOUTER, entityOptions);

		this._look = Vec3.zero();
		this._lookWeight = 0;
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

	override equipName() : string { return "scouter"; }
	override attachType() : AttachType { return AttachType.EYE; }

	override preUpdate(stepData : StepData) : void {
		super.preUpdate(stepData);
		const millis = stepData.millis;

		this._weapons = this.owner().equips().findAll((equip : Equip<Player>) => {
			return equip.allTypes().has(EntityType.WEAPON);
		});

		if (this.key(KeyType.ALT_MOUSE_CLICK, KeyState.PRESSED)) {
			this._look = Vec3.fromVec(this.inputDir()).normalize().scale(Scouter._lookLength);
			this._lookWeight = 0;			
		}

		if (this.key(KeyType.ALT_MOUSE_CLICK, KeyState.DOWN)) {
			this._lookWeight = Math.min(Scouter._lookPanTime, this._lookWeight + millis);

			this._weapons.forEach((weapon : Equip<Player>) => {
				weapon.setAttribute(AttributeType.CHARGING, true);
				weapon.addCounter(CounterType.CHARGE, millis);
			});
		} else {
			this._lookWeight = Math.max(0, this._lookWeight - 2 * millis);

			this._weapons.forEach((weapon : Equip<Player>) => {
				weapon.setAttribute(AttributeType.CHARGING, false);
				weapon.setCounter(CounterType.CHARGE, 0);
			});
		}
	}

	override cameraOffset() : Vec3 {
		if (this._lookWeight <= 0) {
			return super.cameraOffset();
		}
		const weight = FnGlobals.interp(InterpType.NEGATIVE_SQUARE, Math.min(1, this._lookWeight / Scouter._lookPanTime));
		return this._look.clone().scale(weight);
	}

}