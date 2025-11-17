
import { game } from 'game'
import { GameObjectState } from 'game/api'
import { Buff, BuffOptions } from 'game/component/buff'
import { BuffType, StatType } from 'game/factory/api'

export class BigBuff extends Buff {

	override boosts(level : number) : Map<StatType, number> {
		// TODO: some shielding mechanic
		return new Map([
			[StatType.DAMAGE_BOOST, 0.1 * level],
			[StatType.DAMAGE_RESIST_BOOST, 0.1 * level],
			[StatType.HEALTH, 40 + 60 * (level - 1)],
			[StatType.SCALING, 0.1 * level],
		]);
	}

	override levelUp() : void {
		super.levelUp();

		this.addLevel(1);
	}
}