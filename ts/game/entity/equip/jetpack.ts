import * as BABYLON from '@babylonjs/core/Legacy/legacy'

import { StepData } from 'game/game_object'
import { AttributeType } from 'game/component/api'
import { Model } from 'game/component/model'
import { EntityType } from 'game/entity/api'
import { Entity, EntityOptions } from 'game/entity'
import { Equip, AttachType } from 'game/entity/equip'
import { Player } from 'game/entity/player'
import { ColorType, MeshType, SoundType, StatType } from 'game/factory/api'
import { ColorFactory } from 'game/factory/color_factory'
import { MeshFactory, LoadResult } from 'game/factory/mesh_factory'

import { HudType, HudOptions, KeyType, KeyState } from 'ui/api'

import { Fns } from 'util/fns'
import { RateLimiter } from 'util/rate_limiter'
import { Timer } from 'util/timer'
import { Vec2 } from 'util/vector'

export class Jetpack extends Equip<Player> {

	private static readonly _fireMeshName = "fire";
	private static readonly _smokeDelay = 30;

	private static readonly _maxAcc = 4.5;
	private static readonly _ownerMaxVel = 0.33;

	private _enabled : boolean;
	private _smoker : RateLimiter;

	private _fire : BABYLON.Mesh;

	private _model : Model;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.JETPACK, entityOptions);

		this._canUseDuringDelay = true;

		this._enabled = false;
		this._smoker = new RateLimiter(Jetpack._smokeDelay);

		this._fire = null;

		this._model = this.addComponent<Model>(new Model({
			meshFn: (model : Model) => {
				MeshFactory.load(MeshType.JETPACK, (result : LoadResult) => {
					let mesh = result.mesh;

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
	protected override hudType() : HudType { return HudType.JETPACK; }

	override preUpdate(stepData : StepData) : void {
		super.preUpdate(stepData);

		this._enabled = false;
	}

	override update(stepData : StepData) : void {
		super.update(stepData);
		const millis = stepData.millis;

		if (this.canUse() && this.key(this.useKeyType(), KeyState.DOWN)) {
			this.recordUse(millis);
		} else {
			if (this.canCharge() && this.owner().getAttribute(AttributeType.GROUNDED)) {
				this.setChargeRate(this.getStat(StatType.FAST_CHARGE_RATE));
			}
			this.soundPlayer().stop(SoundType.JETPACK);
		}
	}

	override postUpdate(stepData : StepData) : void {
		super.postUpdate(stepData);
		const millis = stepData.millis;

		if (this._model.hasMesh() && this._enabled && this._smoker.check(millis)) {
			const scale = 0.2 + 0.2 * Math.random();
			this.addEntity(EntityType.SMOKE_PARTICLE, {
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

	override simulateUse(uses : number) : void {
		super.simulateUse(uses);

		this._enabled = true;

		let ownerProfile = this.owner().profile();
		ownerProfile.addVel({ y: this.computeAcc(ownerProfile.vel().y) * uses / 1000, });

		if (!this.soundPlayer().sound(SoundType.JETPACK).isPlaying) {
			this.soundPlayer().playFromEntity(SoundType.JETPACK, this.owner());
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

	private computeAcc(currentVel : number) : number {
		return Jetpack._maxAcc * Fns.clamp(0, (Jetpack._ownerMaxVel - currentVel) / (2 * Jetpack._ownerMaxVel), 1);
	}
}