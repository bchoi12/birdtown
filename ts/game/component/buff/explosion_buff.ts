
import { game } from 'game'
import { GameObjectState } from 'game/api'
import { Buff, BuffOptions } from 'game/component/buff'
import { BuffType, StatType } from 'game/factory/api'

export class ExplosionBuff extends Buff {

	override boosts(level : number) : Map<StatType, number> {
		return new Map([
			[StatType.EXPLOSION_BOOST, 0.5],
			[StatType.EXPLOSION_DAMAGE, 10],
			[StatType.PROJECTILE_SCALING_BOOST, 0.5],
		]);
	}
}