
import { game } from 'game'
import { GameObjectState } from 'game/api'
import { Buff, BuffOptions } from 'game/component/buff'
import { BuffType, StatType } from 'game/factory/api'

export class AcrobaticBuff extends Buff {

	override boosts(level : number) : Map<StatType, number> {
		return new Map([
			[StatType.CRIT_CHANCE, 0.1 * level],
			[StatType.CRIT_BOOST, 0.25 * level],
			[StatType.DOUBLE_JUMPS, Math.ceil(level / 2)],
			[StatType.HP_REGEN, 1 + 0.5 * Math.floor(level / 2)],
			[StatType.SPEED_BOOST, 0.1 * level],
			[StatType.USE_BOOST, 0.25 * level],
		]);
	}
}