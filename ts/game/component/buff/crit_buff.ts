
import { game } from 'game'
import { GameObjectState } from 'game/api'
import { Buff, BuffOptions } from 'game/component/buff'
import { BuffType, StatType } from 'game/factory/api'

export class CritBuff extends Buff {

	override boosts(level : number) : Map<StatType, number> {
		return new Map([
			[StatType.CRIT_CHANCE, 0.2],
			[StatType.CRIT_BOOST, 0.5 * level],
			[StatType.LIFE_STEAL, 0.1 * level],
		]);
	}
}