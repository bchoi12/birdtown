
import { game } from 'game'
import { GameObjectState } from 'game/api'
import { Buff, BuffOptions } from 'game/component/buff'
import { BuffType, StatType } from 'game/factory/api'

export class CarryBuff extends Buff {

	override boosts(level : number) : Map<StatType, number> {
		return new Map([
			[StatType.EXPOSE_PERCENT, level > 0 ? 0.2 + 0.2 * level : 0],
			[StatType.FIRE_BOOST, 0.2 * level],
			[StatType.HEALTH, 40 * level],
			[StatType.LIFE_STEAL, 0.05 * level],
		]);
	}
}