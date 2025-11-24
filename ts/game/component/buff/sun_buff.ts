
import { game } from 'game'
import { GameObjectState } from 'game/api'
import { Buff, BuffOptions } from 'game/component/buff'
import { BuffType, StatType } from 'game/factory/api'
import { TimeType } from 'game/system/api'

export class SunBuff extends Buff {

	private _sun : number;

	constructor(type : BuffType, options : BuffOptions) {
		super(type, options);

		this._sun = 1;
	}

	override boosts(level : number) : Map<StatType, number> {
		return new Map([
			[StatType.DAMAGE_RESIST_BOOST, 0.025 * this._sun],
			[StatType.HEALTH, 50 * this._sun],
			[StatType.SCALING, 0.05 * this._sun],
		])
	}

	override onRespawn() : void {
		const sun = game.world().getTime() !== TimeType.NIGHT;

		if (sun) {
			this.revertStats(this.getStatCache());
			this._sun += this.level();
			this.applyStats(this.getStatCache());
		}
	}
}