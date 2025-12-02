
import { game } from 'game'
import { GameObjectState } from 'game/api'
import { Buff, BuffOptions } from 'game/component/buff'
import { BuffType, StatType } from 'game/factory/api'

export class AcrobaticBuff extends Buff {

	override boosts(level : number) : Map<StatType, number> {
		return new Map([
			[StatType.CHARGE_BOOST, 0.2 * level],
			[StatType.CRIT_CHANCE, 0.2],
			[StatType.CRIT_BOOST, 0.2 + 0.1 * (level - 1)],
			[StatType.HEALTH, 30 + 50 * (level - 1)],
			[StatType.HP_REGEN, .02 * level],
			[StatType.SPEED_BOOST, 0.1 * level],
			[StatType.USE_BOOST, 0.1 * level],
		]);
	}

	override levelUp() : void {
		super.levelUp();

		this.addLevel(1);
	}
}