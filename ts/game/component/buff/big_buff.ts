
import { game } from 'game'
import { GameObjectState } from 'game/api'
import { Buff, BuffOptions } from 'game/component/buff'
import { BuffType, StatType } from 'game/factory/api'

export class BigBuff extends Buff {

	override boosts(level : number) : Map<StatType, number> {
		return new Map([
			[StatType.DAMAGE_BOOST, 0.1 * level],
			[StatType.DAMAGE_CLOSE_BOOST, 0.1 * level],
			[StatType.HEALTH, 50 * level],
			[StatType.SCALING, 0.3 + 0.05 * level],
			[StatType.SHIELD, 10 * level],
			[StatType.SHIELD_STEAL, 0.03 * level],
		]);
	}
}