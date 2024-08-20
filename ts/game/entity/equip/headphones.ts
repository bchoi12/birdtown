import * as BABYLON from '@babylonjs/core/Legacy/legacy'

import { StepData } from 'game/game_object'
import { AttributeType, CounterType } from 'game/component/api'
import { Model } from 'game/component/model'
import { SoundPlayer } from 'game/component/sound_player'
import { EntityType } from 'game/entity/api'
import { Entity, EntityOptions } from 'game/entity'
import { Equip, AttachType } from 'game/entity/equip'
import { BlackHole } from 'game/entity/explosion/black_hole'
import { Player } from 'game/entity/player'
import { MeshType, SoundType } from 'game/factory/api'
import { MeshFactory, LoadResult } from 'game/factory/mesh_factory'

import { KeyType, KeyState } from 'ui/api'

import { Fns, InterpType } from 'util/fns'
import { Timer } from 'util/timer'
import { Vec3 } from 'util/vector'

export class Headphones extends Equip<Player> {

	private static readonly _reloadTime = 500;

	private _timer : Timer;

	private _model : Model;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.HEADPHONES, entityOptions);

		this._timer = this.newTimer({
			canInterrupt: false,
		});

		this._model = this.addComponent<Model>(new Model({
			meshFn: (model : Model) => {
				MeshFactory.load(MeshType.HEADPHONES, (result : LoadResult) => {
					let mesh = <BABYLON.Mesh>result.meshes[0];
					model.setMesh(mesh);
				});
			},
			init: entityOptions.modelInit,
		}));
	}

	override attachType() : AttachType { return AttachType.FOREHEAD; }

	override update(stepData : StepData) : void {
		super.update(stepData);
		const millis = stepData.millis;

		if (!this.key(KeyType.ALT_MOUSE_CLICK, KeyState.PRESSED) || this._timer.hasTimeLeft()) {
			return;
		}

		this.addEntity<BlackHole>(EntityType.BLACK_HOLE, {
			associationInit: {
				owner: this.owner(),
			},
			profileInit: {
				pos: this.owner().profile().pos(),
			},
		});
		this._timer.start(Headphones._reloadTime);
	}
}