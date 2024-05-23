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

import { Timer } from 'util/timer'
import { Vec3 } from 'util/vector'

export class Headband extends Equip<Player> {

	private static readonly _chargeDelay = 500;
	private static readonly _maxJuice = 100;

	private _juice : number;
	private _chargeDelayTimer : Timer;

	private _model : Model;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.HEADBAND, entityOptions);

		this._juice = Headband._maxJuice;
		this._chargeDelayTimer = this.newTimer({
			canInterrupt: true,
		});

		this._model = this.addComponent<Model>(new Model({
			meshFn: (model : Model) => {
				MeshFactory.load(MeshType.HEADBAND, (result : LoadResult) => {
					let mesh = <BABYLON.Mesh>result.meshes[0];
					model.setMesh(mesh);
				});
			},
			init: entityOptions.modelInit,
		}));
	}

	override attachType() : AttachType { return AttachType.FOREHEAD; }

	override getCounts() : Map<CounterType, number> {
		return new Map([
			[CounterType.JUICE, Math.ceil(this._juice)],
		]);
	}

	override update(stepData : StepData) : void {
		super.update(stepData);

		// Only allow source to jump since otherwise it's jittery.
		if (!this.isSource()) {
			return;
		}

		const millis = stepData.millis;

		if (this._juice >= 100 && this.key(KeyType.ALT_MOUSE_CLICK, KeyState.PRESSED)) {
			this.owner().profile().setVel({x: 0, y: 0});

			let dir = this.inputDir().clone();
			this.owner().addForce(dir.scale(0.8));

			this._juice = Math.max(0, this._juice - 100);
			this._chargeDelayTimer.start(Headband._chargeDelay);
		}

		if (!this._chargeDelayTimer.hasTimeLeft()) {
			this._juice = Math.min(Headband._maxJuice, this._juice + 2 * Headband._maxJuice * millis / 1000);
		}
	}
}