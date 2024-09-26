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

export class Jetpack extends Equip<Player> {

	private static readonly _fireMeshName = "fire";
	private static readonly _maxJuice = 100;
	private static readonly _useRate = 100;
	private static readonly _chargeRate = 150;
	private static readonly _groundChargeRate = 300;
	private static readonly _chargeDelay = 300;
	private static readonly _smokeDelay = 30;

	private static readonly _maxAcc = 4.5;
	private static readonly _ownerMaxVel = 0.3;

	private _enabled : boolean;
	private _juice : number;
	private _chargeDelayTimer : Timer;
	private _chargeRate : number;
	private _smoker : RateLimiter;

	private _fire : BABYLON.Mesh;

	private _model : Model;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.JETPACK, entityOptions);

		this._enabled = false;
		this._juice = 0;
		this._chargeDelayTimer = this.newTimer({
			canInterrupt: true,
		});
		this._chargeRate = 0;
		this._smoker = new RateLimiter(Jetpack._smokeDelay);

		this._fire = null;

		this._model = this.addComponent<Model>(new Model({
			meshFn: (model : Model) => {
				MeshFactory.load(MeshType.JETPACK, (result : LoadResult) => {
					let mesh = <BABYLON.Mesh>result.meshes[0];

					result.meshes.forEach((fireMesh : BABYLON.Mesh) => {
						if (fireMesh.name === Jetpack._fireMeshName) {
							this._fire = fireMesh;
						}
					});

					if (this._fire === null) {
						console.error("Error: jetpack model missing fire");
						this.delete();
						return;
					}

					this._fire.scaling.y = 0;
					model.setMesh(mesh);
				});
			},
			init: entityOptions.modelInit,
		}));

		this.soundPlayer().registerSound(SoundType.JETPACK);
	}

	override attachType() : AttachType { return AttachType.BACK; }

	override initialize() : void {
		super.initialize();

		this._juice = Jetpack._maxJuice;
	}
	
	override update(stepData : StepData) : void {
		super.update(stepData);
		const millis = stepData.millis;

		this._enabled = false;
		if (this._juice > 0 && this.key(KeyType.ALT_MOUSE_CLICK, KeyState.DOWN)) {
			this._juice = Math.max(this._juice - Jetpack._useRate * millis / 1000, 0);

			this._enabled = true;
			this._chargeRate = 0;
			this._chargeDelayTimer.start(Jetpack._chargeDelay);

			let ownerProfile = this.owner().profile();
			ownerProfile.addVel({ y: this.computeAcc(ownerProfile.vel().y) * millis / 1000, });

			if (!this.soundPlayer().sound(SoundType.JETPACK).isPlaying) {
				this.soundPlayer().playFromEntity(SoundType.JETPACK, this.owner());
			}
		} else {
			if (!this._chargeDelayTimer.hasTimeLeft()) {
				if (this.owner().getAttribute(AttributeType.GROUNDED)) {
					// Touch ground to unlock faster charge rate.
					this._chargeRate = Math.max(this._chargeRate, Jetpack._groundChargeRate);
				} else {
					this._chargeRate = Math.max(this._chargeRate, Jetpack._chargeRate);
				}
			}

			this.soundPlayer().stop(SoundType.JETPACK);
		}

		if (this._chargeRate > 0) {
			this._juice += this._chargeRate * millis / 1000;
			this._juice = Math.min(this._juice, Jetpack._maxJuice);
		}

		if (this._model.hasMesh() && this._enabled && this._smoker.check(millis)) {
			const scale = 0.2 + 0.2 * Math.random();
			this.addEntity(EntityType.PARTICLE_SMOKE, {
				offline: true,
				ttl: Fns.randomRange(1500, 2000),
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

	override preRender() : void {
		super.preRender();

		if (!this._model.hasMesh()) {
			return;
		}

		if (this._enabled) {
			this._fire.scaling.y = 1 + 3 * Math.random();

		} else {
			this._fire.scaling.y = 0;
		}
	}

	override getHudData() : Map<HudType, HudOptions> {
		let hudData = super.getHudData();
		hudData.set(HudType.JETPACK, {
			charging: this._juice <= 0,
			percentGone: 1 - this._juice / Jetpack._maxJuice,
			color: this.clientColorOr(ColorFactory.color(ColorType.BLASTER_RED).toString()),
			empty: true,
			keyType: KeyType.ALT_MOUSE_CLICK,
		});
		return hudData;
	}

	private computeAcc(currentVel : number) : number {
		return Jetpack._maxAcc * Fns.clamp(0, (Jetpack._ownerMaxVel - currentVel) / (2 * Jetpack._ownerMaxVel), 1);
	}
}