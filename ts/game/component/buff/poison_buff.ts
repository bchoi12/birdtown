
import { game } from 'game'
import { GameObjectState } from 'game/api'
import { Buff, BuffOptions } from 'game/component/buff'
import { BuffType, MaterialType, StatType } from 'game/factory/api'
import { StepData } from 'game/game_object'
import { EntityType } from 'game/entity/api'
import { CubeParticle } from 'game/entity/particle/cube_particle'

import { Fns } from 'util/fns'
import { RateLimiter } from 'util/rate_limiter'

export class PoisonBuff extends Buff {

	private _damageLimiter : RateLimiter;
	private _particleLimiter : RateLimiter;

	constructor(type : BuffType, options : BuffOptions) {
		super(type, options);

		this._damageLimiter = new RateLimiter(500);
		this._particleLimiter = new RateLimiter(3000);
	}

	override boosts(level : number) : Map<StatType, number> {
		return new Map([
			[StatType.DAMAGE_TAKEN_BOOST, 0.05 * level],
		]);
	}

	override onLevel(level : number, delta : number) : void {
		super.onLevel(level, delta);

		this.decayOnLevel(level, delta);
	}

	override update(stepData : StepData) : void {
		super.update(stepData);

		const level = this.level();
		if (level < 1) {
			return;
		}

		const millis = stepData.millis;

		if (this._damageLimiter.check(millis)) {
			this.entity().takeDamage(Math.ceil(0.02 * this.entity().maxHealth()));
		}

		this._particleLimiter.setLimit(30 + 20 * (this.maxLevel() - level));

		// Poisoned :(
		if (this._particleLimiter.check(millis)) {
			const pos = this.entity().profile().pos();
			const width = this.entity().profile().dim().x;
			const size = 0.1 + 0.05 * level;
			const [cube, hasCube] = this.entity().addEntity<CubeParticle>(EntityType.ENERGY_CUBE_PARTICLE, {
				offline: true,
				ttl: 400 + level * 200,
				profileInit: {
					pos: {
						x: pos.x + Fns.randomNoise(width / 2),
						y: pos.y,
					},
					vel: {
						x: Fns.randomNoise(0.05),
						y: 0.08,
					},
					angle: Math.PI * Math.random(),
				},
				modelInit: {
					transforms: {
						scale: { x: size, y: size, z: size },
					},
					materialType: MaterialType.PARTICLE_GREEN,
				}
			});
		}
	}
}