import * as BABYLON from '@babylonjs/core/Legacy/legacy'

import { StepData } from 'game/game_object'
import { AttributeType } from 'game/component/api'
import { Model } from 'game/component/model'
import { EntityType } from 'game/entity/api'
import { Entity, EntityOptions } from 'game/entity'
import { Equip, AttachType } from 'game/entity/equip'
import { Player } from 'game/entity/player'
import { ColorType, MeshType, SoundType } from 'game/factory/api'
import { ColorFactory } from 'game/factory/color_factory'
import { MeshFactory, LoadResult } from 'game/factory/mesh_factory'

import { HudType, HudOptions, KeyType, KeyState } from 'ui/api'

import { Fns } from 'util/fns'
import { RateLimiter } from 'util/rate_limiter'
import { Timer } from 'util/timer'
import { Vec2 } from 'util/vector'

export class Booster extends Equip<Player> {

	private static readonly _fireMeshName = "fire";

	private static readonly _maxJuice = 100;
	private static readonly _chargeRate = 30;
	private static readonly _groundChargeRate = 75;
	private static readonly _chargeDelay = 360;
	private static readonly _smokeDelay = 30;
	private static readonly _upwardForce = 2;

	private _juice : number;
	private _chargeDelayTimer : Timer;
	private _chargeRate : number;
	private _smoker : RateLimiter;

	private _fire : BABYLON.Mesh;

	private _model : Model;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.BOOSTER, entityOptions);

		this._juice = 0;
		this._chargeDelayTimer = this.newTimer({
			canInterrupt: true,
		});
		this._chargeRate = 0;
		this._smoker = new RateLimiter(Booster._smokeDelay);

		this._fire = null;

		this._model = this.addComponent<Model>(new Model({
			meshFn: (model : Model) => {
				MeshFactory.load(MeshType.BOOSTER, (result : LoadResult) => {
					let mesh = result.mesh;

					result.meshes.forEach((fireMesh : BABYLON.Mesh) => {
						if (fireMesh.name === Booster._fireMeshName) {
							this._fire = fireMesh;
						}
					});

					if (this._fire === null) {
						console.error("Error: booster model missing fire");
						this.delete();
						return;
					}

					this._fire.scaling.y = 0;
					model.setMesh(mesh);
				});
			},
			init: entityOptions.modelInit,
		}));

		this.soundPlayer().registerSound(SoundType.BOOST);
	}

	override attachType() : AttachType { return AttachType.BACK; }

	override initialize() : void {
		super.initialize();

		this._juice = Booster._maxJuice;
	}
	
	override update(stepData : StepData) : void {
		super.update(stepData);
		const millis = stepData.millis;

		this.setCanUse(this._juice >= Booster._maxJuice);

		if (this.canUse() && this.key(KeyType.ALT_MOUSE_CLICK, KeyState.DOWN)) {
			this.recordUse();
		} else if (!this._chargeDelayTimer.hasTimeLeft()) {
			if (this.owner().getAttribute(AttributeType.GROUNDED)) {
				// Touch ground to unlock faster charge rate.
				this._chargeRate = Math.max(this._chargeRate, Booster._groundChargeRate);
			} else if (!this._chargeDelayTimer.hasTimeLeft()) {
				this._chargeRate = Math.max(this._chargeRate, Booster._chargeRate);
			}
		}

		if (this._chargeRate > 0) {
			this._juice += this._chargeRate * millis / 1000;
			this._juice = Math.min(this._juice, Booster._maxJuice);
		}

		if (this._fire !== null && this._chargeDelayTimer.hasTimeLeft() && this._smoker.check(millis)) {
			const scale = 0.3 + 0.3 * Math.random();
			this.addEntity(EntityType.SMOKE_PARTICLE, {
				offline: true,
				ttl: Fns.randomRange(2500, 3000),
				profileInit: {
					pos: Vec2.fromBabylon3(this._fire.getAbsolutePosition()).add({ x: Fns.randomRange(-0.1, 0.1), y: -0.3, }),
					scaling: { x: scale, y : scale },
				},
				modelInit: {
					transforms: {
						translate: { z: Fns.randomRange(-0.1, 0.1), },
					}
				}
			});
		}
	}

	protected override simulateUse(uses : number) : void {
		this._juice = 0;

		this._chargeRate = 0;
		this._chargeDelayTimer.start(Booster._chargeDelay);

		// Only allow source to jump since otherwise it's jittery.
		if (this.hasOwner()) {
			this.owner().addForce({ y: Booster._upwardForce });
			this.soundPlayer().playFromEntity(SoundType.BOOST, this.owner());
		}
	}

	override preRender() : void {
		super.preRender();

		if (!this._model.hasMesh()) {
			return;
		}

		if (this._chargeDelayTimer.hasTimeLeft()) {
			this._fire.scaling.y = 2 + 4 * Math.random();
		} else {
			this._fire.scaling.y = 0;
		}
	}

	override getHudData() : Map<HudType, HudOptions> {
		let hudData = super.getHudData();
		hudData.set(HudType.BOOSTER, {
			charging: !this.canUse(),
			percentGone: 1 - this._juice / Booster._maxJuice,
			color: this.clientColorOr(ColorFactory.color(ColorType.SHOOTER_BLUE).toString()),
			empty: true,
			keyType: KeyType.ALT_MOUSE_CLICK,
		});
		return hudData;
	}
}