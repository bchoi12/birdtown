
import { game } from 'game'
import { GameObjectState } from 'game/api'
import { Buff, BuffOptions } from 'game/component/buff'
import { BuffType, StatType } from 'game/factory/api'

export class JumperBuff extends Buff {

	override boosts(level : number) : Map<StatType, number> {
		return new Map([
			[StatType.AIR_SPEED_BOOST, 0.3],
			[StatType.DOUBLE_JUMPS, 2 * level],
		]);
	}
}