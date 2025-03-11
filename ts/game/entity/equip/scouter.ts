import * as BABYLON from '@babylonjs/core/Legacy/legacy'

import { StepData } from 'game/game_object'
import { AttributeType } from 'game/component/api'
import { Model } from 'game/component/model'
import { EntityType } from 'game/entity/api'
import { Entity, EntityOptions } from 'game/entity'
import { Equip, AttachType } from 'game/entity/equip'
import { Weapon } from 'game/entity/equip/weapon'
import { CubeParticle } from 'game/entity/particle/cube_particle'
import { Player } from 'game/entity/player'
import { ColorType, MaterialType, MeshType } from 'game/factory/api'
import { ColorFactory } from 'game/factory/color_factory'
import { MeshFactory, LoadResult } from 'game/factory/mesh_factory'

import { HudType, HudOptions, KeyType, KeyState } from 'ui/api'

import { Fns, InterpType } from 'util/fns'
import { RateLimiter } from 'util/rate_limiter'
import { Vec2, Vec3 } from 'util/vector'

export class Scouter extends Equip<Player> {

	private static readonly _lookVertical = 5;
	private static readonly _lookHorizontal = 11;
	private static readonly _lookPanTime = 200;
	private static readonly _particleInterval = 250;

	private _look : Vec3;
	private _lookWeight : number;
	private _weapon : Weapon;
	private _particleLimiter : RateLimiter;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.SCOUTER, entityOptions);

		this._look = Vec3.zero();
		this._lookWeight = 0;
		this._weapon = null;
		this._particleLimiter = new RateLimiter(Scouter._particleInterval);

		this.addComponent<Model>(new Model({
			meshFn: (model : Model) => {
				MeshFactory.load(MeshType.SCOUTER, (result : LoadResult) => {
					let mesh = result.mesh;
					model.setMesh(mesh);
				});
			},
			init: entityOptions.modelInit,
		}));
	}

	override attachType() : AttachType { return AttachType.EYE; }

	override preUpdate(stepData : StepData) : void {
		super.preUpdate(stepData);
		const millis = stepData.millis;

		if (this._weapon === null || this._weapon.deleted()) {
			const weapons = <Weapon[]>this.owner().equips().findN((equip : Equip<Player>) => {
				return equip.allTypes().has(EntityType.WEAPON) && equip.valid();
			}, 1);

			if (weapons.length < 1) {
				return;
			}

			this._weapon = weapons[0];
		}

		if (this.key(KeyType.ALT_MOUSE_CLICK, KeyState.PRESSED)) {
			this._look = Vec3.fromVec(this.inputDir()).normalize();
			this._look.scale(Math.abs(this._look.y) * Scouter._lookVertical + (1 - Math.abs(this._look.y)) * Scouter._lookHorizontal);
			this._lookWeight = 0;
		}

		if (this.key(KeyType.ALT_MOUSE_CLICK, KeyState.DOWN)) {
			this._lookWeight = Math.min(Scouter._lookPanTime, this._lookWeight + millis);
			this._weapon.setCharging(true);
		} else {
			this._lookWeight = Math.max(0, this._lookWeight - 1.5 * millis);
			this._weapon.setCharging(false);
		}
	}

	override update(stepData : StepData) : void {
		super.update(stepData);
		const millis = stepData.millis;

		if (this._weapon === null || this._weapon.deleted()) {
			return;
		}

		if (!this._particleLimiter.check(millis)) {
			return;
		}

		if (!this._weapon.charging() || !this._weapon.model().hasMesh()) {
			return;
		}

		const offset = Vec2.unitFromDeg(Math.random() * 360).scale(0.4);
		const pos = this._weapon.shootPos();

		const size = 0.05 + 0.45 * (Math.min(this._weapon.chargedThreshold(), this._weapon.chargeMillis()) / 1000);
		const [cube, hasCube] = this.addEntity<CubeParticle>(EntityType.ENERGY_CUBE_PARTICLE, {
			offline: true,
			ttl: 1.5 * this._weapon.chargedThreshold(),
			profileInit: {
				pos: pos.clone().add(offset),
				vel: {
					x: 0.05 * offset.y,
					y: 0.05 * offset.x,
				},
				angle: 0,
			},
			modelInit: {
				transforms: {
					translate: { z: size / 2 },
					scale: { x: size, y: size, z: size },
				},
				materialType: MaterialType.SHOOTER_ORANGE,
			}
		});

		if (hasCube) {
			cube.profile().setAngularVelocity(-0.1 * Math.sign(offset.x));
			cube.overrideUpdateFn((stepData : StepData, particle : CubeParticle) => {
				particle.profile().moveTo(pos, {
					millis: stepData.millis,
					posEpsilon: 0.05,
					maxAccel: 0.05,
				});
				particle.model().scaling().setScalar(size * (1 - particle.ttlElapsed()));
			});
		}
	}

	override cameraOffset() : Vec3 {
		if (this._lookWeight <= 0) {
			return super.cameraOffset();
		}
		const weight = Fns.interp(InterpType.NEGATIVE_SQUARE, Math.min(1, this._lookWeight / Scouter._lookPanTime));
		return this._look.clone().scale(weight);
	}

	override getHudData() : Map<HudType, HudOptions> {
		if (this._weapon === null || this._weapon.deleted()) {
			return super.getHudData();
		}

		let hudData = super.getHudData();
		hudData.set(HudType.CHARGE, {
			charging: !this._weapon.charged(),
			percentGone: 1 - this._weapon.chargeMillis() / this._weapon.chargedThreshold(),
			empty: true,
			color: this.clientColorOr(ColorFactory.color(ColorType.SHOOTER_DARK_ORANGE).toString()),
			keyType: KeyType.ALT_MOUSE_CLICK,
		});
		return hudData;
	}
}