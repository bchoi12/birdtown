
import * as BABYLON from '@babylonjs/core/Legacy/legacy'

import { game } from 'game'
import { AttributeType } from 'game/component/api'
import { Profile } from 'game/component/profile'
import { Model } from 'game/component/model'
import { EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Equip, AttachType } from 'game/entity/equip'
import { Player } from 'game/entity/player'
import { BodyFactory } from 'game/factory/body_factory'
import { StepData } from 'game/game_object'

export class Bubble extends Equip<Player> {

	private static readonly _alpha = 0.3;
	private static readonly _popDuration = 300;

	private _material : BABYLON.StandardMaterial;
	private _popped : boolean;

	private _model : Model;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.BUBBLE, entityOptions);

		this._material = new BABYLON.StandardMaterial(this.name() + "-material", game.scene());
		this._material.alpha = Bubble._alpha;
		this._material.needDepthPrePass = true;

		this._popped = false;

		this._model = this.addComponent<Model>(new Model({
			meshFn: (model : Model) => {
				const ownerDim = this.owner().profile().scaledDim();

				let bubble = BABYLON.MeshBuilder.CreateSphere(this.name(), {
					diameter: 2 * Math.max(ownerDim.x, ownerDim.y),
				}, game.scene());

				bubble.material = this._material;
				model.setMesh(bubble);
			},
			init: entityOptions.modelInit,
		}));
	}

	pop() : void {
		if (this._popped) {
			return;
		}

		this._popped = true;

		this.owner().setAttribute(AttributeType.FLOATING, false);

		this.setTTL(Bubble._popDuration);
	}

	override initialize() : void {
		super.initialize();

		this.owner().setAttribute(AttributeType.FLOATING, true);
		this.owner().setAttribute(AttributeType.INVINCIBLE, true);
	}

	override delete() : void {
		super.delete();

		this.owner().setAttribute(AttributeType.INVINCIBLE, false);
	}

	override update(stepData : StepData) : void {
		super.update(stepData);

		if (!this._model.hasMesh() || !this._popped) {
			return;
		}

		this._material.alpha = Bubble._alpha * (1 - this.ttlElapsed());

		const scaling = 1 + this.ttlElapsed();
		this._model.scaling().x = scaling;
		this._model.scaling().y = scaling;
		this._model.scaling().z = scaling;
	}

	override postUpdate(stepData : StepData) : void {
		super.update(stepData);

		if (this.owner().getAttribute(AttributeType.GROUNDED)) {
			this.pop();
		}
	}

	override attachType() : AttachType { return AttachType.ROOT; }
}