
import { game } from 'game'
import { GameObjectState } from 'game/api'
import { Buff, BuffOptions } from 'game/component/buff'
import { BuffType, MaterialType, StatType } from 'game/factory/api'
import { StepData } from 'game/game_object'
import { EntityType } from 'game/entity/api'
import { CubeParticle } from 'game/entity/particle/cube_particle'

import { Fns } from 'util/fns'
import { RateLimiter } from 'util/rate_limiter'

export class SlowBuff extends Buff {

	private _particleLimiter : RateLimiter;

	constructor(type : BuffType, options : BuffOptions) {
		super(type, options);

		this._particleLimiter = new RateLimiter(3000);
	}

	override boosts(level : number) : Map<StatType, number> {
		return new Map([
			[StatType.DAMAGE_RESIST_BOOST, 0.025 * level],
			[StatType.SPEED_DEBUFF, 0.15 * level],
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
		this._particleLimiter.setLimit(100 + 50 * (this.maxLevel() - level));

		// Slow :(
		if (this._particleLimiter.check(millis)) {
			const pos = this.entity().profile().pos();
			const width = this.entity().profile().dim().x;
			const size = 0.1 + 0.05 * level;
			const [cube, hasCube] = this.entity().addEntity<CubeParticle>(EntityType.CUBE_PARTICLE, {
				offline: true,
				ttl: 150,
				profileInit: {
					pos: {
						x: pos.x + Fns.randomNoise(width / 2),
						y: pos.y,
					},
					vel: {
						x: Fns.randomNoise(0.06),
						y: 0,
					},
					angle: Math.PI * Math.random(),
					gravity: true,
				},
				modelInit: {
					transforms: {
						scale: { x: size, y: size, z: size },
					},
					materialType: MaterialType.PARTICLE_BLUE,
				}
			});
		}
	}
}