
import { game } from 'game'
import { AttributeType, CounterType } from 'game/component/api'
import { Model } from 'game/component/model'
import { Profile } from 'game/component/profile'
import { SoundPlayer } from 'game/component/sound_player'
import { Entity, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { AttachType, RecoilType } from 'game/entity/equip'
import { Projectile } from 'game/entity/projectile'
import { Bolt } from 'game/entity/projectile/bolt'
import { Weapon, WeaponConfig, WeaponState } from 'game/entity/equip/weapon'
import { ParticleCube } from 'game/entity/particle/particle_cube'
import { ColorType, MaterialType, MeshType, SoundType } from 'game/factory/api'
import { ColorFactory } from 'game/factory/color_factory'
import { EntityFactory } from 'game/factory/entity_factory'
import { StepData } from 'game/game_object'

import { CounterOptions, KeyType, KeyState } from 'ui/api'

import { defined } from 'util/common'
import { RateLimiter } from 'util/rate_limiter'
import { Vec2, Vec3 } from 'util/vector'

export class Sniper extends Weapon {

	private static readonly _config = {
		times: new Map([
			[WeaponState.FIRING, 80],
			[WeaponState.RELOADING, 300],
		]),
		bursts: 3,
	};
	private static readonly _chargedConfig = {
		times: new Map([
			[WeaponState.RELOADING, 500],
		]),
		bursts: 1,
	};

	private static readonly _chargedThreshold = 1000;
	private static readonly _chargeInterval = 250;
	private static readonly _boltTTL = 550;

	private _chargeRateLimiter : RateLimiter;
	private _soundPlayer : SoundPlayer;

	constructor(options : EntityOptions) {
		super(EntityType.SNIPER, options);

		this._chargeRateLimiter = new RateLimiter(Sniper._chargeInterval);

		this._soundPlayer = this.addComponent<SoundPlayer>(new SoundPlayer());
		this._soundPlayer.registerSound(SoundType.LASER, SoundType.LASER);
		this._soundPlayer.registerSound(SoundType.CHARGED_LASER, SoundType.CHARGED_LASER);
	}

	override attachType() : AttachType { return AttachType.ARM; }
	override recoilType() : RecoilType { return RecoilType.SMALL; }
	override meshType() : MeshType { return MeshType.SNIPER; }

	override charged() : boolean { return this.getCounter(CounterType.CHARGE) >= Sniper._chargedThreshold; }

	override weaponConfig() : WeaponConfig {
		return this.charged() ? Sniper._chargedConfig : Sniper._config;
	}

	override update(stepData : StepData) : void {
		super.update(stepData);
		const millis = stepData.millis;

		if (this.getAttribute(AttributeType.CHARGING)) {
			if (this._chargeRateLimiter.check(millis)) {
				const offset = Vec2.unitFromDeg(Math.random() * 360).scale(0.4);
				const pos = Vec3.fromBabylon3(this._shootNode.getAbsolutePosition());

				// TODO: don't hardcode 1000 as max
				const size = 0.05 + 0.45 * (Math.min(1000, this.getCounter(CounterType.CHARGE)) / 1000);
				const [cube, hasCube] = this.addEntity<ParticleCube>(EntityType.PARTICLE_ENERGY_CUBE, {
					offline: true,
					ttl: 1.5 * Sniper._chargeInterval,
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
							translate: { z: pos.z + size / 2 },
							scale: { x: size, y: size, z: size },
						},
						materialType: MaterialType.SHOOTER_ORANGE,
					}
				});

				if (hasCube) {
					cube.profile().setAngularVelocity(-0.1 * Math.sign(offset.x));
					cube.overrideUpdateFn((stepData : StepData, particle : ParticleCube) => {
						particle.profile().moveTo(pos, {
							millis: stepData.millis,
							posEpsilon: 0.05,
							maxAccel: 0.05,
						});
						particle.model().scaling().setScalar(size * (1 - particle.ttlElapsed()));
					});
				}
			}
		}
	}

	override shoot(stepData : StepData) : void {
		const charged = this.charged();
		const pos = Vec3.fromBabylon3(this.shootNode().getAbsolutePosition());
		const unitDir = this.inputDir().clone().normalize();

		let vel = unitDir.clone().scale(charged ? 1 : 0.7);
		let [bolt, hasBolt] = this.addEntity<Bolt>(EntityType.BOLT, {
			ttl: Sniper._boltTTL,
			associationInit: {
				owner: this.owner(),
			},
			modelInit: {
				transforms: {
					translate: { z: pos.z },
				},
				materialType: charged ? MaterialType.SHOOTER_ORANGE : MaterialType.SHOOTER_BLUE,
			},
			profileInit: {
				pos: pos,
				vel: vel,
				angle: vel.angleRad(),
			},
		});

		if (hasBolt) {
			if (charged) {
				bolt.setAttribute(AttributeType.CHARGED, true);
				bolt.profile().setScaleFactor(1.5);
			}
		}

		this._soundPlayer.playFromEntity(charged ? SoundType.CHARGED_LASER : SoundType.LASER, this.owner());
	}

	override onReload() : void {
		if (this.charged()) {
			this.setCounter(CounterType.CHARGE, 0);
		}
	}

	override getCounts() : Map<CounterType, CounterOptions> {
		let counts = super.getCounts();
		counts.set(CounterType.CHARGE, {
			percentGone: 1 - this.getCounter(CounterType.CHARGE) / Sniper._chargedThreshold,
			text: this.charged() ? "1/1" : "0/1",
			color: ColorFactory.color(ColorType.SHOOTER_DARK_ORANGE).toString(),
		});
		return counts;
	}
}
