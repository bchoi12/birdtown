
import { game } from 'game'
import { GameObjectState } from 'game/api'
import { Buff, BuffOptions } from 'game/component/buff'
import { BuffType, StatType } from 'game/factory/api'
import { Optional } from 'util/optional'

export class TankBuff extends Buff {

	override boosts(level : number) : Map<StatType, number> {
		return new Map([
			[StatType.DAMAGE_RESIST_BOOST, 0.1 * level],
			[StatType.HEALTH, 50 * level],
			[StatType.SCALING, 0.1 * level],
		]);
	}

	override postBoosts(statCache : Map<StatType, number>) : Map<StatType, number> {
		const bonusHealth = statCache.has(StatType.HEALTH) ? statCache.get(StatType.HEALTH) : 0;
		const healthBoost = statCache.has(StatType.HEALTH_BOOST) ? statCache.get(StatType.HEALTH_BOOST) : 0;

		return new Map([
			[StatType.DAMAGE_BOOST, bonusHealth * (1 + healthBoost)],
		]);
	}
}