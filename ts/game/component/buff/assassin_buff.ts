
import { game } from 'game'
import { GameObjectState } from 'game/api'
import { Buff, BuffOptions } from 'game/component/buff'
import { BuffType, StatType } from 'game/factory/api'

export class AssassinBuff extends Buff {

	override boosts(level : number) : Map<StatType, number> {
		return new Map([
			[StatType.CHARGE_BOOST, 0.25 * level],
			[StatType.CRIT_CHANCE, 0.2],
			[StatType.CRIT_BOOST, 0.25 * level],
			[StatType.HEALTH, 50 * level],
			[StatType.HP_REGEN, .02 + 0.01 * level],
			[StatType.SPEED_BOOST, 0.05 * level],
		]);
	}
}