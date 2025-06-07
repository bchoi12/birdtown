import * as BABYLON from '@babylonjs/core/Legacy/legacy'

import { StepData } from 'game/game_object'
import { AttributeType } from 'game/component/api'
import { Model } from 'game/component/model'
import { EntityType } from 'game/entity/api'
import { Entity, EntityOptions } from 'game/entity'
import { Equip, AttachType } from 'game/entity/equip'
import { DyingStar } from 'game/entity/dying_star'
import { Player } from 'game/entity/player'
import { ColorType, MeshType } from 'game/factory/api'
import { ColorFactory } from 'game/factory/color_factory'
import { MeshFactory, LoadResult } from 'game/factory/mesh_factory'

import { HudType, HudOptions, KeyType, KeyState } from 'ui/api'

import { Fns, InterpType } from 'util/fns'
import { Timer } from 'util/timer'
import { Vec3 } from 'util/vector'

export class Headphones extends Equip<Player> {

	private _model : Model;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.HEADPHONES, entityOptions);

		this._model = this.addComponent<Model>(new Model({
			meshFn: (model : Model) => {
				MeshFactory.load(MeshType.HEADPHONES, (result : LoadResult) => {
					model.setMesh(result.mesh);
				});
			},
			init: entityOptions.modelInit,
		}));
	}

	override attachType() : AttachType { return AttachType.FOREHEAD; }

	protected override hudType() : HudType { return HudType.HEADPHONES; }

	override update(stepData : StepData) : void {
		super.update(stepData);
		const millis = stepData.millis;

		if (this.canUse() && this.key(this.useKeyType(), KeyState.DOWN)) {
			this.recordUse();
		}
	}

	protected override simulateUse(uses : number) : void {
		super.simulateUse(uses);

		const [star, ok] = this.addEntity<DyingStar>(EntityType.DYING_STAR, {
			profileInit: {
				pos: this.owner().profile().pos(),
			},
		});

		if (ok) {
			star.setTarget(this.inputMouse());
		}
	}
}