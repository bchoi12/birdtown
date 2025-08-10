
import { game } from 'game'
import { GameObjectState } from 'game/api'
import { Buff, BuffOptions } from 'game/component/buff'
import { BuffType, StatType } from 'game/factory/api'

export class IcyBuff extends Buff {

	override boosts(level : number) : Map<StatType, number> {
		return new Map([
			[StatType.FIRE_BOOST, 0.1 * level],
			[StatType.SLOW_CHANCE, 0.1 * level],
		]);
	}
}