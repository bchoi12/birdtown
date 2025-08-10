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
import { BuffType, MaterialType, MeshType, SoundType, StatType } from 'game/factory/api'
import { ColorFactory } from 'game/factory/color_factory'
import { MaterialFactory } from 'game/factory/material_factory'
import { MeshFactory, LoadResult } from 'game/factory/mesh_factory'

import { HudType, HudOptions, KeyType, KeyState } from 'ui/api'

import { CardinalDir } from 'util/cardinal'
import { Fns, InterpType } from 'util/fns'
import { RateLimiter } from 'util/rate_limiter'
import { Timer } from 'util/timer'
import { Vec2, Vec3 } from 'util/vector'

export class BlackHeadband extends Equip<Player> {

	private static readonly _jumpTime = 250;
	private static readonly _floatTime = 2000;
	private static readonly _dustInterval = 80;

	private _jumpTimer : Timer;
	private _floatTimer : Timer;
	private _duster : RateLimiter;
	private _dir : number;

	private _model : Model;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.BLACK_HEADBAND, entityOptions);

		this._jumpTimer = this.newTimer({
			canInterrupt: true,
		});
		this._floatTimer = this.newTimer({
			canInterrupt: true,
		});
		this._duster = new RateLimiter(BlackHeadband._dustInterval);
		this._dir = 1;

		this._model = this.addComponent<Model>(new Model({
			meshFn: (model : Model) => {
				MeshFactory.load(MeshType.BLACK_HEADBAND, (result : LoadResult) => {
					let mesh = result.mesh;
					model.setMesh(mesh);
				});
			},
			init: entityOptions.modelInit,
		}));

		this.soundPlayer().registerSound(SoundType.DASH);
	}

	override attachType() : AttachType { return AttachType.FOREHEAD; }
	override checkCanUse() : boolean { return super.checkCanUse() && !this._jumpTimer.hasTimeLeft() && !this._floatTimer.hasTimeLeft(); }
	protected override hudType() : HudType { return HudType.TORNADO; }
	protected override canCharge() : boolean { return super.canCharge() && !this._floatTimer.hasTimeLeft(); }

	override delete() : void {
		super.delete();

		if (this.hasOwner()) {
			this.owner().setAttribute(AttributeType.LEVITATING, false);
			this.owner().removeBuff(BuffType.BLACK_HEADBAND);

			if (this.owner().hasModel()) {
				this.owner().model().rotation().y = 0;
			}
		}
	}

	override preUpdate(stepData : StepData) : void {
		super.preUpdate(stepData);

		if (!this._jumpTimer.hasTimeLeft() && this._floatTimer.hasTimeLeft() && this.owner().profile().vel().y <= 0) {
			this.owner().setAttribute(AttributeType.LEVITATING, true);
			this.owner().setBuffMin(BuffType.BLACK_HEADBAND, 1);

			this.owner().profile().setVel({y: 0});
		} else {
			this.owner().setAttribute(AttributeType.LEVITATING, false);
			this.owner().removeBuff(BuffType.BLACK_HEADBAND);
		}
	}

	override update(stepData : StepData) : void {
		super.update(stepData);
		const millis = stepData.millis;

		if (this.canUse() && this.key(this.useKeyType(), KeyState.DOWN)) {
			this.recordUse();
		}
		if (!this.key(this.useKeyType(), KeyState.DOWN)) {
			this._floatTimer.reset();
		}

		if (this._floatTimer.hasTimeLeft() && this._duster.check(millis)) {
			const origin = this.owner().profile().getRelativePos(CardinalDir.BOTTOM);
			const width = this.owner().profile().dim().x;

			this.addEntity(EntityType.ENERGY_CUBE_PARTICLE, {
				offline: true,
				ttl: 300,
				profileInit: {
					pos: {
						x: origin.x + Fns.randomNoise(width / 2),
						y: origin.y + 0.06,
					},
					vel: {
						x: Fns.randomNoise(0.03),
						y: -0.15,
					},
					scaling: { x: 0.18, y: 0.18 },
				},
				modelInit: {
					materialType: MaterialType.PARTICLE_YELLOW,
				}
			});
		}
	}

	protected override simulateUse(uses : number) : void {
		super.simulateUse(uses);

		this.owner().profile().setVel({x: 0, y: 0});

		let force = this.inputDir().clone().scale(this.getStat(StatType.FORCE));
		this.owner().addForce({ y: this.getStat(StatType.FORCE) });

		this._jumpTimer.start(BlackHeadband._jumpTime);
		this._floatTimer.start(BlackHeadband._floatTime);

		this._dir *= -1;
		this.soundPlayer().playFromEntity(SoundType.DASH, this.owner());
	}

	override preRender() : void {
		super.preRender();

		this.owner().model().rotation().y = this._dir * 2 * Math.PI * this._jumpTimer.percentElapsed();
	}
}