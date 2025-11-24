
import { game } from 'game'
import { GameObjectState } from 'game/api'
import { Buff, BuffOptions } from 'game/component/buff'
import { BuffType, StatType } from 'game/factory/api'
import { TimeType } from 'game/system/api'

export class VampireBuff extends Buff {

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
			[StatType.BURST_BOOST, (this._night ? 1 : 0) * level],
			[StatType.FIRE_BOOST, (this._night ? 0.3 : 0.1) * level],
			[StatType.DAMAGE_RESIST_BOOST, (this._night ? 0.1 : 0) * level],
			[StatType.HEALTH, (this._night ? 200 : 25) * level],
			[StatType.LIFE_STEAL, (this._night ? 0.1 : 0) * level],
			[StatType.RELOAD_BOOST, (this._night ? 0.3 : 0.1) * level],
			[StatType.REV_BOOST, (this._night ? 0.5 : 0) * level],
			[StatType.SCALING, (this._night ? 0.5 : 0)],
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