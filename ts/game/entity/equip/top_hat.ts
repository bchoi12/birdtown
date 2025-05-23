import * as BABYLON from '@babylonjs/core/Legacy/legacy'

import { game } from 'game'
import { StepData } from 'game/game_object'
import { AttributeType } from 'game/component/api'
import { Model } from 'game/component/model'
import { SoundPlayer } from 'game/component/sound_player'
import { EntityType } from 'game/entity/api'
import { Entity, EntityOptions } from 'game/entity'
import { Equip, AttachType } from 'game/entity/equip'
import { Weapon, WeaponState } from 'game/entity/equip/weapon'
import { Player } from 'game/entity/player'
import { ColorType, MeshType, SoundType } from 'game/factory/api'
import { ColorFactory } from 'game/factory/color_factory'
import { MeshFactory, LoadResult } from 'game/factory/mesh_factory'

import { HudType, HudOptions, KeyType, KeyState } from 'ui/api'

import { Fns, InterpType } from 'util/fns'
import { Timer } from 'util/timer'
import { Vec3 } from 'util/vector'

export class TopHat extends Equip<Player> {

	private static readonly _chargeDelay = 275;
	private static readonly _cooldown = 550;
	private static readonly _dashTime = 275;
	private static readonly _maxJuice = 100;

	private _chargeDelayTimer : Timer;
	private _dashTimer : Timer;
	private _juice : number;
	private _dir : number;

	private _model : Model;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.TOP_HAT, entityOptions);

		this._chargeDelayTimer = this.newTimer({
			canInterrupt: true,
		});
		this._dashTimer = this.newTimer({
			canInterrupt: false,
		});
		this._juice = TopHat._maxJuice;
		this._dir = 0;

		this._model = this.addComponent<Model>(new Model({
			meshFn: (model : Model) => {
				MeshFactory.load(MeshType.TOP_HAT, (result : LoadResult) => {
					model.setMesh(result.mesh);
				});
			},
			init: entityOptions.modelInit,
		}));

		this.soundPlayer().registerSound(SoundType.TUMBLE);
	}

	override initialize() : void {
		super.initialize();

		this._model.applyToMeshes((mesh : BABYLON.Mesh) => {
			if (!mesh.material || mesh.material.name !== "player") {
				return;
			}

			let mat = new BABYLON.StandardMaterial(this.name() + "-sash", game.scene());
			mat.diffuseColor = BABYLON.Color3.FromHexString(this.clientColorOr(ColorFactory.color(ColorType.RED).toString()));
			mesh.material = mat;	
		});
	}

	override delete() : void {
		super.delete();

		if (this.hasOwner() && this.owner().hasModel()) {
			this.owner().model().rotation().z = 0;
		}
	}

	override attachType() : AttachType { return AttachType.HEAD; }

	override getHudData() : Map<HudType, HudOptions> {
		let hudData = super.getHudData();
		let percent = this._juice / TopHat._maxJuice;
		hudData.set(HudType.ROLL, {
			charging: !this.canUse(),
			percentGone: 1 - percent,
			empty: true,
			color: this.clientColorOr(ColorFactory.color(ColorType.WHITE).toString()),
			keyType: KeyType.ALT_MOUSE_CLICK,
		});
		return hudData;
	}

	override update(stepData : StepData) : void {
		super.update(stepData);

		const millis = stepData.millis;

		this.setCanUse(this._juice >= TopHat._maxJuice && !this._dashTimer.hasTimeLeft());
		if (this.canUse() && this.key(KeyType.ALT_MOUSE_CLICK, KeyState.DOWN)) {
			this.recordUse();
		}

		if (!this._chargeDelayTimer.hasTimeLeft()) {
			this._juice = Math.min(TopHat._maxJuice, this._juice + TopHat._maxJuice * millis / TopHat._cooldown);
		}
	}

	protected override simulateUse(uses : number) : void {
		let force = this.inputDir().clone().scale(0.6);
		this._dir = force.x === 0 ? 1 : Math.sign(force.x);

		if (this.hasOwner()) {
			this.owner().profile().setVel({x: 0, y: 0});
			this.owner().addForce(force);
			this.soundPlayer().playFromEntity(SoundType.TUMBLE, this.owner());
		}

		this._juice = Math.max(0, this._juice - TopHat._maxJuice);
		this._chargeDelayTimer.start(TopHat._chargeDelay);

		this._dashTimer.start(TopHat._dashTime);
	}

	override preRender() : void {
		super.preRender();

		this.owner().model().rotation().z = -this._dir * 2 * Math.PI * this._dashTimer.percentElapsed();
	}

}