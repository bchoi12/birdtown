
import { game } from 'game'
import { GameObjectState } from 'game/api'
import { Buff, BuffOptions } from 'game/component/buff'
import { BuffType, StatType } from 'game/factory/api'

export class GlassCannonBuff extends Buff {

	override boosts(level : number) : Map<StatType, number> {
		return new Map([
			[StatType.BURST_BONUS, 1],
			[StatType.FIRE_BOOST, 0.15 * level],
			[StatType.HEALTH_ADDITION, 3 * level],
			[StatType.HEALTH_BOOST, -0.2 * level],
			[StatType.LIFE_STEAL, 0.1 * level],
		]);
	}
}