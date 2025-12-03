
import { game } from 'game'
import { GameObjectState } from 'game/api'
import { Buff, BuffOptions } from 'game/component/buff'
import { BuffType, StatType } from 'game/factory/api'

export class DodgyBuff extends Buff {

	override boosts(level : number) : Map<StatType, number> {
		// At max level, dodge while using equip
		return new Map([
			[StatType.SPEED_BOOST, 0.05 * level],
			[StatType.CHARGE_BOOST, 0.25 * level],
			[StatType.USE_BOOST, this.atMaxLevel() ? 1 : 0],
		]);
	}
}