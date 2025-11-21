
import { game } from 'game'
import { GameObjectState } from 'game/api'
import { Buff, BuffOptions } from 'game/component/buff'
import { BuffType, StatType } from 'game/factory/api'

export class JuicedBuff extends Buff {

	override boosts(level : number) : Map<StatType, number> {
		return new Map([
			[StatType.FIRE_BOOST, 0.15 * level],
			[StatType.RELOAD_BOOST, 0.2 * level],
		]);
	}
}