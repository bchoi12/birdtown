
import { game } from 'game'
import { GameObjectState } from 'game/api'
import { Buff, BuffOptions } from 'game/component/buff'
import { BuffType, StatType } from 'game/factory/api'
import { TimeType } from 'game/system/api'

export class NightBuff extends Buff {

	private _night : boolean;

	constructor(type : BuffType, options : BuffOptions) {
		super(type, options);

		this._night = false;

		this.addProp<boolean>({
			import: (obj : boolean) => { this.setNight(obj); },
			export: () => { return this._night; },
		});
	}

	// TODO: add some demon horns or something
	override boosts(level : number) : Map<StatType, number> {
		return new Map([
			[StatType.DAMAGE_BOOST, (this._night ? 0.2 : 0.03) * level],
			[StatType.LIFE_STEAL, (this._night ? 0.1 : 0.01) * level],
			[StatType.SHIELD, (this._night ? 75 : 5) * level],
		])
	}

	override onLevel(level : number, delta : number) : void {
		super.onLevel(level, delta);

		this.checkNight();
	}

	override onRespawn() : void {
		super.onRespawn();

		this.checkNight();
	}

	private setNight(night : boolean) : void {
		if (this._night !== night) {
			this.revertStats(this.getStatCache());
			this._night = night;
			this.applyStats(this.getStatCache());
		}
	}

	private checkNight() : void {
		if (!this.isSource()) {
			return;
		}

		this.setNight(game.world().getTime() === TimeType.NIGHT);
	}
}