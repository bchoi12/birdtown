
import { game } from 'game'
import { GameObjectState } from 'game/api'
import { Buff, BuffOptions } from 'game/component/buff'
import { BuffType, StatType } from 'game/factory/api'

export class ExposeBuff extends Buff {

	override boosts(level : number) : Map<StatType, number> {
		return new Map([
			[StatType.DAMAGE_TAKEN_BOOST, 0.01 * level],
		]);
	}

	override onLevel(level : number, delta : number) : void {
		super.onLevel(level, delta);

		this.decayOnLevel(level, delta, {
			initial: 1000,
			subsequent: 40,
		});
	}
}