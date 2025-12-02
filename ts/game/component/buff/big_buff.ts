
import { game } from 'game'
import { GameObjectState } from 'game/api'
import { Buff, BuffOptions } from 'game/component/buff'
import { BuffType, StatType } from 'game/factory/api'

export class BigBuff extends Buff {

	override boosts(level : number) : Map<StatType, number> {
		return new Map([
			[StatType.DAMAGE_BOOST, 0.1 * level],
			[StatType.DAMAGE_CLOSE_BOOST, 0.1 * level],
			[StatType.HEALTH, 20 + 50 * (level - 1)],
			[StatType.SCALING, 0.2 + 0.05 * level],
			[StatType.SHIELD, 20 + 10 * (level - 1)],
		]);
	}

	override levelUp() : void {
		super.levelUp();

		this.addLevel(1);
	}
}