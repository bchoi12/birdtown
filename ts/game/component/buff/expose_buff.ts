
import { game } from 'game'
import { GameObjectState } from 'game/api'
import { Buff, BuffOptions } from 'game/component/buff'
import { BuffType, StatType } from 'game/factory/api'

export class ExposeBuff extends Buff {

	private static readonly _interval = 0.01;

	override boosts(level : number) : Map<StatType, number> {
		return new Map([
			[StatType.DAMAGE_TAKEN_BOOST, ExposeBuff._interval * level],
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