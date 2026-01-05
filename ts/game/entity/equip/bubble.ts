
import * as BABYLON from '@babylonjs/core/Legacy/legacy'
import * as MATTER from 'matter-js'

import { game } from 'game'
import { GameState } from 'game/api'
import { AttributeType } from 'game/component/api'
import { Model } from 'game/component/model'
import { Entity, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Equip, AttachType } from 'game/entity/equip'
import { Player } from 'game/entity/bird/player'
import { StepData } from 'game/game_object'

import { Timer } from 'util/timer'
import { Vec3 } from 'util/vector'

export class Bubble extends Equip<Player> {

	private static readonly _alpha = 0.3;
	private static readonly _cameraOffset = -1.5;
	private static readonly _popDuration = 750;
	private static readonly _minLifeDuration = 250;
	private static readonly _lifeDuration = 10000;

	private _cameraOffset : Vec3;
	private _material : BABYLON.StandardMaterial;
	private _popped : boolean;
	private _lifeTimer : Timer;

	private _model : Model;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.BUBBLE, entityOptions);

		this._cameraOffset = new Vec3({ x: 0, y: Bubble._cameraOffset, z: 0 });

		this._material = new BABYLON.StandardMaterial(this.name() + "-material", game.scene());
		this._material.alpha = Bubble._alpha;
		this._material.specularPower = 16;
		this._material.needDepthPrePass = true;

		this._popped = false;
		this._lifeTimer = this.newTimer({
			canInterrupt: false,
		});

		this._model = this.addComponent<Model>(new Model({
			meshFn: (model : Model) => {
				const ownerDim = this.owner().profile().dim();

				let bubble = BABYLON.MeshBuilder.CreateSphere(this.name(), {
					diameter: 2 * Math.max(ownerDim.x, ownerDim.y),
				}, game.scene());

				this._material.diffuseColor = BABYLON.Color3.FromHexString(this.clientColorOr("#000000"));

				bubble.material = this._material;
				model.setMesh(bubble);
			},
			init: entityOptions.modelInit,
		}));

		this.addProp<boolean>({
			has: () => { return this._popped; },
			import: (obj : boolean) => { this.importPop(); },
			export: () => { return this._popped; },
		});
	}

	lightPop() : void {
		if (game.controller().gameState() !== GameState.FREE && this._lifeTimer.millisElapsed() <= Bubble._popDuration) {
			return;
		}

		this.pop();
	}

	pop() : void {
		if (this._lifeTimer.millisElapsed() <= Bubble._minLifeDuration) {
			return;
		}

		this.hardPop();
	}

	hardPop() : void {
		if (!this.isSource()) {
			return;
		}

		this.importPop();
	}

	private importPop() : void {
		if (this._popped) {
			return;
		}

		this._popped = true;

		if (this.hasOwner()) {
			this.owner().setAttribute(AttributeType.BUBBLED, false);
		}

		this.setTTL(Bubble._popDuration);
	}

	override initialize() : void {
		super.initialize();

		if (this.isSource() && this.owner().getAttribute(AttributeType.BUBBLED)) {
			this.delete();
			return;
		}

		this.owner().setAttribute(AttributeType.BUBBLED, true);
		this.owner().setAttribute(AttributeType.INVINCIBLE, true);

		this._lifeTimer.start(Bubble._lifeDuration, () => {
			this.pop();
		});
	}

	override delete() : void {
		super.delete();

		if (this.hasOwner()) {
			this.owner().upright();
			this.owner().setAttribute(AttributeType.BUBBLED, false);
			this.owner().setAttribute(AttributeType.INVINCIBLE, false);
		}
	}

	override cameraOffset() : Vec3 {
		this._cameraOffset.y = Bubble._cameraOffset * this.interpWeight();
		return this._cameraOffset;
	}

	override update(stepData : StepData) : void {
		super.update(stepData);

		if (!this._model.hasMesh() || !this._popped) {
			return;
		}

		this._material.alpha = Bubble._alpha * this.interpWeight();

		const scaling = 1 + this.ttlElapsed();
		this._model.scaling().x = scaling;
		this._model.scaling().y = scaling;
		this._model.scaling().z = scaling;
	}

	override attachType() : AttachType { return AttachType.ROOT; }

	private interpWeight() : number { return this._popped ? (1 - this.ttlElapsed()) : 1; }
}