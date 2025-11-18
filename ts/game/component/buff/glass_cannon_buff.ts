
import { game } from 'game'
import { GameObjectState } from 'game/api'
import { Buff, BuffOptions } from 'game/component/buff'
import { BuffType, StatType } from 'game/factory/api'

export class GlassCannonBuff extends Buff {

	override boosts(level : number) : Map<StatType, number> {
		return new Map([
			[StatType.BURST_BONUS, this.atMaxLevel() ? 1 : 0],
			[StatType.BURST_BOOST, 0.25 * level],
			[StatType.DAMAGE_ADDITION, 5 * level],
			[StatType.FIRE_BOOST, 0.15 * level],
		]);
	}
}