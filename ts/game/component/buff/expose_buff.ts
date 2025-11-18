
import { game } from 'game'
import { GameObjectState } from 'game/api'
import { Buff, BuffOptions } from 'game/component/buff'
import { BuffType, StatType } from 'game/factory/api'

export class ExposeBuff extends Buff {

	private static readonly _interval = 0.25;

	override boosts(level : number) : Map<StatType, number> {
		return new Map([
			[StatType.DAMAGE_TAKEN_BOOST, ExposeBuff._interval * level],
		]);
	}

	override onLevel(level : number, delta : number) : void {
		super.onLevel(level, delta);

		this.decayOnLevel(level, delta);
	}
}