
import { game } from 'game'
import { GameObjectState } from 'game/api'
import { Buff, BuffOptions } from 'game/component/buff'
import { BuffType, StatType } from 'game/factory/api'

export class SlowBuff extends Buff {

	override boosts(level : number) : Map<StatType, number> {
		return new Map([
			[StatType.SPEED_DEBUFF, 0.15 * level],
		]);
	}

	override onLevel(level : number, delta : number) : void {
		super.onLevel(level, delta);

		if (level <= 0) {
			return;
		}

		if (delta > 0) {
			this.addAfter(3000, -1);
		} else if (delta < 0) {
			this.addAfter(500, -1);
		}
	}
}