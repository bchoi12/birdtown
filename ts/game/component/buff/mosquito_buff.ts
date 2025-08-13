
import { game } from 'game'
import { GameObjectState } from 'game/api'
import { Buff, BuffOptions } from 'game/component/buff'
import { BuffType, StatType } from 'game/factory/api'

export class MosquitoBuff extends Buff {

	override boosts(level : number) : Map<StatType, number> {
		return new Map([
			[StatType.BURST_BOOST, 0.2 * level],
			[StatType.DAMAGE_BOOST, -0.1],
			[StatType.DAMAGE_TAKEN_BOOST, 0.1 * level],
			[StatType.FIRE_BOOST, 0.1 * level],
			[StatType.SCALING, -0.1 * level],
		]);
	}
}