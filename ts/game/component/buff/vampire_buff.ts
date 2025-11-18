
import { game } from 'game'
import { GameObjectState } from 'game/api'
import { Buff, BuffOptions } from 'game/component/buff'
import { BuffType, StatType } from 'game/factory/api'

export class VampireBuff extends Buff {

	override boosts(level : number) : Map<StatType, number> {
		return new Map([
			[StatType.DAMAGE_RESIST_BOOST, 0.1 * level],
			[StatType.FIRE_BOOST, 0.15 * level],
			[StatType.HEALTH_ADDITION, 3 * level],
			[StatType.LIFE_STEAL, 0.1 * level],
			[StatType.POISON_CHANCE, 0.05 * level],
		]);
	}
}