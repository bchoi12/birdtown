
import { game } from 'game'
import { GameObjectState } from 'game/api'
import { Buff, BuffOptions } from 'game/component/buff'
import { Buffs } from 'game/component/buffs'
import { BuffType, MaterialType, StatType } from 'game/factory/api'
import { StepData } from 'game/game_object'
import { EntityType } from 'game/entity/api'
import { CubeParticle } from 'game/entity/particle/cube_particle'

import { ui } from 'ui'
import { TooltipType } from 'ui/api'

import { Fns } from 'util/fns'
import { RateLimiter } from 'util/rate_limiter'

import { StringFactory } from 'strings/string_factory'

abstract class TempBuff extends Buff {

	private _particleLimiter : RateLimiter;

	constructor(type : BuffType, options : BuffOptions) {
		super(type, options);

		this._particleLimiter = new RateLimiter(100);
	}

	override onLevel(level : number, delta : number) : void {
		super.onLevel(level, delta);

		if (level <= 0 || delta < 0) {
			return;
		}

		if (this.entity().clientIdMatches()) {
			ui.showTooltip(TooltipType.BUFF_ACQUIRED, {
				names: [StringFactory.getBuffDescription(this._buffType)],
				ttl: 3000,
			});
		}

		this.getParent<Buffs>().clearTempBuffsExcept(this._buffType);

		this.decayOnLevel(level, delta, {
			initial: 10000,
			subsequent: 1000,
		});
	}

	override update(stepData : StepData) : void {
		super.update(stepData);

		const level = this.level();
		if (level < 1) {
			return;
		}

		const millis = stepData.millis;

		// Inspired :)
		const pos = this.entity().profile().pos();
		if (this._particleLimiter.check(millis) && game.lakitu().inFOV(pos)) {
			const width = this.entity().profile().dim().x;
			const size = 0.2
			const [cube, hasCube] = this.entity().addEntity<CubeParticle>(EntityType.CUBE_PARTICLE, {
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
					materialType: MaterialType.PARTICLE_PURPLE,
				}
			});
		}
	}
}

export class TempCritBuff extends TempBuff {

	override boosts(level : number) : Map<StatType, number> {
		return new Map([
			[StatType.CRIT_CHANCE, 0.3 * level],
			[StatType.CRIT_BOOST, 0.5 * level],
			[StatType.SPEED_BOOST, 0.15 * level],
		]);
	}
}

export class TempDamageBuff extends TempBuff {

	override boosts(level : number) : Map<StatType, number> {
		return new Map([
			[StatType.DAMAGE_BOOST, 0.3 * level],
			[StatType.PROJECTILE_SCALING_BOOST, 1 * level],
		]);
	}
}

export class TempFiringBuff extends TempBuff {

	override boosts(level : number) : Map<StatType, number> {
		return new Map([
			[StatType.FIRE_BOOST, 0.4 * level],
			[StatType.RELOAD_BOOST, 0.4 * level],
			[StatType.USE_BOOST, level > 0 ? 1 : 0],
		]);
	}
}

export class TempShieldBuff extends TempBuff {

	override boosts(level : number) : Map<StatType, number> {
		return new Map([
			[StatType.LIFE_STEAL, 0.3 * level],
			[StatType.SHIELD, 50 * level],
		]);
	}

	override onLevel(level : number, delta : number) : void {
		super.onLevel(level, delta);

		if (delta !== 0) {
			this.entity().resetResource(StatType.SHIELD);
		}
	}	
}