import * as BABYLON from '@babylonjs/core/Legacy/legacy'

import { game } from 'game'
import { StepData } from 'game/game_object'
import { AttributeType } from 'game/component/api'
import { Model } from 'game/component/model'
import { SoundPlayer } from 'game/component/sound_player'
import { EntityType } from 'game/entity/api'
import { Entity, EntityOptions } from 'game/entity'
import { Equip, AttachType } from 'game/entity/equip'
import { Weapon } from 'game/entity/equip/weapon'
import { Player } from 'game/entity/player'
import { BuffType, ColorType, MeshType, SoundType, StatType } from 'game/factory/api'
import { ColorFactory } from 'game/factory/color_factory'
import { MeshFactory, LoadResult } from 'game/factory/mesh_factory'

import { HudType, HudOptions, KeyType, KeyState } from 'ui/api'

import { Fns, InterpType } from 'util/fns'
import { Timer } from 'util/timer'
import { Vec3 } from 'util/vector'

export class TopHat extends Equip<Player> {

	private static readonly _dashTime = 275;

	private _dashTimer : Timer;
	private _dir : number;

	private _model : Model;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.TOP_HAT, entityOptions);

		this._dashTimer = this.newTimer({
			canInterrupt: false,
		});
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
	protected override hudType() : HudType { return HudType.ROLL; }

	override update(stepData : StepData) : void {
		super.update(stepData);

		if (this.canUse() && this.useKeyPressed()) {
			this.recordUse();
		}

		if (this.owner().hasMaxedBuff(BuffType.DODGY)) {
			this.owner().setAttribute(AttributeType.DODGY, this._dashTimer.hasTimeLeft());
		}
	}

	protected override checkCanUse() : boolean { return super.checkCanUse() && !this._dashTimer.hasTimeLeft(); }
	protected override simulateUse(uses : number) : void {
		super.simulateUse(uses);

		let force = this.inputDir().clone().scale(this.getStat(StatType.FORCE));
		this._dir = force.x === 0 ? 1 : Math.sign(force.x);

		if (this.hasOwner()) {
			this.owner().profile().setVel({x: 0, y: 0});
			this.owner().addForce(force);
			this.soundPlayer().playFromEntity(SoundType.TUMBLE, this.owner());
		}

		this._dashTimer.start(TopHat._dashTime);
	}

	override preRender() : void {
		super.preRender();

		this.owner().model().rotation().z = -this._dir * 2 * Math.PI * this._dashTimer.percentElapsed();
	}

}