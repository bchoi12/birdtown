
import { game } from 'game'
import { GameObjectState } from 'game/api'
import { Buff, BuffOptions } from 'game/component/buff'
import { BuffType, StatType } from 'game/factory/api'

export class BlasterBuff extends Buff {

	override boosts(level : number) : Map<StatType, number> {
		return new Map([
			[StatType.DAMAGE_CLOSE_BOOST, 0.2 * level],
			[StatType.DAMAGE_RESIST_BOOST, this.atMaxLevel() ? 0.1 : 0],
		]);
	}
}