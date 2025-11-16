
import { game } from 'game'
import { GameObjectState } from 'game/api'
import { Buff, BuffOptions } from 'game/component/buff'
import { BuffType, StatType } from 'game/factory/api'
import { Optional } from 'util/optional'

export class WarmogsBuff extends Buff {

	override boosts(level : number) : Map<StatType, number> {
		return new Map([
			[StatType.HEALTH, 50 * level],
			[StatType.HEALTH_BOOST, 0.1 * level],
		]);
	}
}