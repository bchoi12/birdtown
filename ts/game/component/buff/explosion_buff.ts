
import { game } from 'game'
import { GameObjectState } from 'game/api'
import { Buff, BuffOptions } from 'game/component/buff'
import { BuffType, StatType } from 'game/factory/api'

export class ExplosionBuff extends Buff {

	override boosts(level : number) : Map<StatType, number> {
		return new Map([
			[StatType.BURST_BONUS, this.atMaxLevel() ? 1 : 0],
			[StatType.EXPLOSION_BOOST, 0.5 * level],
			[StatType.EXPLOSION_DAMAGE, 10],
			[StatType.PROJECTILE_SCALING, 0.25 * level],
		]);
	}
}