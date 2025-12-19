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

	private static readonly _maxRange = 16;
	private static readonly _fullChargeTime = 750;

	private _charge : number;

	private _model : Model;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.HEADPHONES, entityOptions);

		this._charge = 0;

		this._model = this.addComponent<Model>(new Model({
			meshFn: (model : Model) => {
				MeshFactory.load(MeshType.HEADPHONES, (result : LoadResult) => {
					model.setMesh(result.mesh);
				});
			},
			init: entityOptions.modelInit,
		}));
	}

	override attachType() : AttachType { return AttachType.EARS; }

	protected override hudType() : HudType { return HudType.HEADPHONES; }

	override update(stepData : StepData) : void {
		super.update(stepData);
		const millis = stepData.millis;

		if (this.canUse()) {
			if (this.useKeyDown()) {
				this._charge += millis;
			} else if (this._charge > 0 && this.key(this.useKeyType(), KeyState.UP)) {
				this.recordUse();
			}
		}

		if (this._charge > 0) {
			this._charge = Math.min(this._charge, Headphones._fullChargeTime);

			const shakeStrength = Fns.lerpRange(0.5, this._charge / Headphones._fullChargeTime, 1);
			this._model.translation().copyVec({
				x: shakeStrength * Fns.randomNoise(0.1),
				y: shakeStrength * Fns.randomNoise(0.1),
				z: shakeStrength * Fns.randomNoise(0.05),
			})
		} else {
			this._model.translation().scale(0);
		}
	}

	protected override simulateUse(uses : number) : void {
		super.simulateUse(uses);

		const [star, ok] = this.addEntity<DyingStar>(EntityType.DYING_STAR, {
			associationInit: {
				owner: this.owner(),
			},
			profileInit: {
				pos: this.owner().profile().pos().clone(),
			},
		});

		if (ok) {
			const dir = this.inputDir();
			const range = 0.2 + 0.8 * Fns.normalizeRange(0, this._charge, Headphones._fullChargeTime) * Headphones._maxRange;
			star.setTarget(this.owner().profile().pos().clone().add({
				x: range * dir.x,
				y: range * dir.y,
			}));
		}

		this._charge = 0;
	}
}