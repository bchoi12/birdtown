
import { game } from 'game'
import { GameObjectState } from 'game/api'
import { Buff, BuffOptions } from 'game/component/buff'
import { BuffType, StatType } from 'game/factory/api'

export class EagleEyeBuff extends Buff {

	override boosts(level : number) : Map<StatType, number> {
		return new Map([
			[StatType.BURST_BOOST, 0.25 * Math.floor(level / 2)],
			[StatType.EXPOSE_CHANCE, 0.2],
			[StatType.FIRE_BOOST, (this.atMaxLevel() ? 0.1 : 0) + 0.1 * level],
			[StatType.HEALTH, 30 + 30 * level],
			[StatType.LIFE_STEAL, Math.ceil(level / 2) * 0.02],
			[StatType.RELOAD_BOOST, (this.atMaxLevel() ? 0.1 : 0) + 0.1 * level],
		]);
	}
}