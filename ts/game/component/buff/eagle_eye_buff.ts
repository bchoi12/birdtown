
import { game } from 'game'
import { GameObjectState } from 'game/api'
import { Buff, BuffOptions } from 'game/component/buff'
import { BuffType, StatType } from 'game/factory/api'

export class EagleEyeBuff extends Buff {

	override boosts(level : number) : Map<StatType, number> {
		return new Map([
			[StatType.EXPOSE_CHANCE, 0.2 + 0.1 * level],
			[StatType.FIRE_BOOST, 0.15 * level],
			[StatType.HEALTH, 20 + 40 * (level - 1)],
			[StatType.LIFE_STEAL, 0.05 * level],
			[StatType.RELOAD_BOOST, 0.2 * level],
		]);
	}

	override levelUp() : void {
		super.levelUp();

		this.addLevel(1);
	}
}