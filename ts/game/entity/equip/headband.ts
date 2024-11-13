import * as BABYLON from '@babylonjs/core/Legacy/legacy'
import earcut from 'earcut'

import { game } from 'game'
import { StepData } from 'game/game_object'
import { AttributeType } from 'game/component/api'
import { Model } from 'game/component/model'
import { EntityType } from 'game/entity/api'
import { Entity, EntityOptions } from 'game/entity'
import { BoneType } from 'game/entity/api'
import { Equip, AttachType } from 'game/entity/equip'
import { Player } from 'game/entity/player'
import { ColorType, MaterialType, MeshType, SoundType } from 'game/factory/api'
import { ColorFactory } from 'game/factory/color_factory'
import { MaterialFactory } from 'game/factory/material_factory'
import { MeshFactory, LoadResult } from 'game/factory/mesh_factory'

import { HudType, HudOptions, KeyType, KeyState } from 'ui/api'

import { Fns, InterpType } from 'util/fns'
import { Timer } from 'util/timer'
import { Vec2, Vec3 } from 'util/vector'

export class Headband extends Equip<Player> {

	private static readonly _trailVertices = [
        new BABYLON.Vector3(0, 0, 0.4),
        new BABYLON.Vector3(-2, 0, 0),
        new BABYLON.Vector3(0, 0, -0.4),
	];

	private static readonly _chargeDelay = 500;
	private static readonly _cooldown = 1000;
	private static readonly _groundCooldown = 500;
	private static readonly _dashTime = 250;
	private static readonly _maxJuice = 100;
	private static readonly _force = 0.8;

	private _juice : number;
	private _cooldown : number;
	private _chargeDelayTimer : Timer;
	private _dashTimer : Timer;
	private _trail : BABYLON.Mesh;

	private _model : Model;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.HEADBAND, entityOptions);

		this._juice = Headband._maxJuice;
		this._cooldown = Headband._cooldown;
		this._chargeDelayTimer = this.newTimer({
			canInterrupt: true,
		});
		this._dashTimer = this.newTimer({
			canInterrupt: true,
		});
		this._trail = BABYLON.MeshBuilder.ExtrudePolygon(this.name() + "-trail", {
			shape: Headband._trailVertices,
			depth: 0.3,
		}, game.scene(), earcut);
		this._trail.rotation.x = Math.PI / 2;
		this._trail.rotation.y = -Math.PI / 2;
		this._trail.material = MaterialFactory.material(MaterialType.EASTERN_PURPLE_TRAIL);
		this._trail.isVisible = false;

		this._model = this.addComponent<Model>(new Model({
			meshFn: (model : Model) => {
				MeshFactory.load(MeshType.HEADBAND, (result : LoadResult) => {
					let mesh = result.mesh;
					model.setMesh(mesh);
				});
			},
			init: entityOptions.modelInit,
		}));

		this.soundPlayer().registerSound(SoundType.DASH);
	}

	override attachType() : AttachType { return AttachType.FOREHEAD; }

	override getHudData() : Map<HudType, HudOptions> {
		let hudData = super.getHudData();
		hudData.set(HudType.DASH, {
			charging: this._juice < Headband._maxJuice,
			percentGone: 1 - this._juice / Headband._maxJuice,
			empty: true,
			keyType: KeyType.ALT_MOUSE_CLICK,
			color: this.clientColorOr(ColorFactory.color(ColorType.EASTERN_PURPLE).toString()),
		});
		return hudData;
	}

	override initialize() : void {
		super.initialize();

		this.owner().model().onLoad((model : Model) => {
			this._trail.attachToBone(model.getBone(BoneType.BACK), model.mesh());
		})
	}

	override dispose() : void {
		super.dispose();

		this._trail.dispose();
	}

	private canDash() : boolean { return this._juice >= Headband._maxJuice; }

	override update(stepData : StepData) : void {
		super.update(stepData);

		const millis = stepData.millis;

		if (this.canDash() && this.key(KeyType.ALT_MOUSE_CLICK, KeyState.DOWN)) {
			this.owner().profile().setVel({x: 0, y: 0});

			// Only allow source to jump since otherwise it's jittery.
			let force = this.inputDir().clone().scale(Headband._force);
			this.owner().addForce(force);

			this._juice = Math.max(0, this._juice - Headband._maxJuice);
			this._cooldown = Headband._cooldown;
			this._chargeDelayTimer.start(Headband._chargeDelay);
			this._dashTimer.start(Headband._dashTime);

			this.soundPlayer().playFromEntity(SoundType.DASH, this.owner());
		}

		if (!this._chargeDelayTimer.hasTimeLeft()) {
			if (this.owner().getAttribute(AttributeType.GROUNDED)) {
				// Touch ground to unlock faster charge rate.
				this._cooldown = Math.min(this._cooldown, Headband._groundCooldown);
			}
			this._juice = Math.min(Headband._maxJuice, this._juice + Headband._maxJuice * millis / this._cooldown);
		}
	}

	override preRender() : void {
		super.preRender();

		if (!this.owner().model().hasMesh()) {
			return;
		}

		if (this._dashTimer.hasTimeLeft()) {
			this._trail.isVisible = true;

			const weight = 1 - Fns.interp(InterpType.CUBIC, this._dashTimer.percentElapsed());
			this._trail.scaling.x = weight;
		} else {
			this._trail.isVisible = false;
		}
	}
}