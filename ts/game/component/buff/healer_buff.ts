
import { game } from 'game'
import { GameObjectState } from 'game/api'
import { Buff, BuffOptions } from 'game/component/buff'
import { BuffType, StatType } from 'game/factory/api'

export class HealerBuff extends Buff {

	override boosts(level : number) : Map<StatType, number> {
		return new Map([
			[StatType.HEAL_PERCENT, 0.1 * level],
			[StatType.IMBUE_LEVEL, 2 * level],
		]);
	}
}