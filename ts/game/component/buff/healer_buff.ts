
import { game } from 'game'
import { GameObjectState } from 'game/api'
import { Buff, BuffOptions } from 'game/component/buff'
import { BuffType, StatType } from 'game/factory/api'

export class HealerBuff extends Buff {

	override boosts(level : number) : Map<StatType, number> {
		return new Map([
			// TODO: replace FIRE_BOOST with IMBUE_CHANCE that powers up allies (0.15 damage resist, 0.15 damage boost)
			[StatType.FIRE_BOOST, 0.15 * level],
			[StatType.HEAL_PERCENT, 0.1 * level],
			[StatType.REVIVE_BOOST, 0.2 * level],
		]);
	}
}