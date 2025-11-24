
import { game } from 'game'
import { GameObjectState } from 'game/api'
import { Buff, BuffOptions } from 'game/component/buff'
import { BuffType, StatType } from 'game/factory/api'

export class BlasterBuff extends Buff {

	override boosts(level : number) : Map<StatType, number> {
		return new Map([
			[StatType.CRIT_CHANCE, 0.1 * level],
			[StatType.DAMAGE_CLOSE_BOOST, 0.3 * level],
			[StatType.PROJECTILE_SCALING_BOOST, 0.5 * level],
		]);
	}
}