
import { game } from 'game'
import { GameObjectState } from 'game/api'
import { Buff, BuffOptions } from 'game/component/buff'
import { BuffType, StatType } from 'game/factory/api'
import { Optional } from 'util/optional'

export class TankBuff extends Buff {

	override boosts(level : number) : Map<StatType, number> {
		return new Map([
			[StatType.DAMAGE_RESIST_BOOST, 0.1 * level],
			[StatType.HEALTH, 50 * level],
			[StatType.HEALTH_BOOST, 0.05 * level],
			[StatType.SCALING, 0.1 * level],
		]);
	}
}