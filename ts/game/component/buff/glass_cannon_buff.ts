
import { game } from 'game'
import { GameObjectState } from 'game/api'
import { Buff, BuffOptions } from 'game/component/buff'
import { BuffType, StatType } from 'game/factory/api'

export class GlassCannonBuff extends Buff {

	override boosts(level : number) : Map<StatType, number> {
		return new Map([
			[StatType.DAMAGE_TAKEN_BOOST, 0.25 * level],
			[StatType.DAMAGE_BOOST, 0.25 * level],
		]);
	}
}