
import { game } from 'game'
import { GameObjectState } from 'game/api'
import { Buff, BuffOptions } from 'game/component/buff'
import { BuffType, StatType } from 'game/factory/api'
import { Optional } from 'util/optional'

export class TankBuff extends Buff {

	override boosts(level : number) : Map<StatType, number> {
		return new Map([
			[StatType.HEALTH, 25 * level],
			[StatType.DAMAGE_RESIST_BOOST, 0.05 * level],
		]);
	}

	override postBoosts(statCache : Map<StatType, number>) : Map<StatType, number> {
		return new Map([
			[StatType.DAMAGE_BOOST, (statCache.has(StatType.HEALTH) ? statCache.get(StatType.HEALTH) : 0) / 100],
		]);
	}
}