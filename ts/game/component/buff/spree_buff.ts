
import { game } from 'game'
import { GameObjectState } from 'game/api'
import { Buff, BuffOptions } from 'game/component/buff'
import { BuffType, MaterialType, StatType } from 'game/factory/api'
import { StepData } from 'game/game_object'
import { EntityType } from 'game/entity/api'
import { CubeParticle } from 'game/entity/particle/cube_particle'

import { Fns } from 'util/fns'
import { RateLimiter } from 'util/rate_limiter'

export class SpreeBuff extends Buff {

	private _flameLimiter : RateLimiter;

	constructor(type : BuffType, options : BuffOptions) {
		super(type, options);

		this._flameLimiter = new RateLimiter(3000);
	}

	override boosts(level : number) : Map<StatType, number> {
		const regenLevel = Math.min(level, 5);
		const dmgLevel = Math.min(level, 5);
		return new Map([
			[StatType.HP_REGEN, regenLevel * .02],
			[StatType.SPEED_BOOST, level * 0.05],
			[StatType.DAMAGE_BOOST, dmgLevel * 0.2],
			[StatType.DAMAGE_TAKEN_BOOST, dmgLevel * 0.1],
		]);
	}

	override update(stepData : StepData) : void {
		super.update(stepData);

		const level = this.level();
		if (level < 1) {
			return;
		}

		const millis = stepData.millis;
		this._flameLimiter.setLimit(75 + 25 * Math.max(0, 5 - level));

		const pos = this.entity().profile().pos();
		if (!this._flameLimiter.check(millis) || !game.lakitu().inFOV(pos)) {
			return;
		}

		// On fire
		const width = this.entity().profile().dim().x;
		const size = 0.1 + 0.05 * level;
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
				staticColor: this.entity().clientColor(),
			}
		});
	}

	protected override onLevel(level : number, delta : number) : void {
		super.onLevel(level, delta);

		if (delta > 0) {
			this.announceLevel();
		}
	}
}