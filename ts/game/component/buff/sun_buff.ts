
import { game } from 'game'
import { GameObjectState } from 'game/api'
import { Buff, BuffOptions } from 'game/component/buff'
import { BuffType, StatType } from 'game/factory/api'
import { TimeType } from 'game/system/api'

import { ui } from 'ui'
import { TooltipType } from 'ui/api'

export class SunBuff extends Buff {

	private _sun : number;

	constructor(type : BuffType, options : BuffOptions) {
		super(type, options);

		this._sun = 0;

		this.addProp<number>({
			import: (obj : number) => { this.setSun(obj); },
			export: () => { return this._sun; },
		});
	}

	override boosts(level : number) : Map<StatType, number> {
		return new Map([
			[StatType.HEALTH, 30 * (this._sun + level)],
			[StatType.SCALING, 0.05 * (this._sun + level)],
		])
	}

	override onRespawn() : void {
		super.onRespawn();

		this.checkSun();
	}

	override onLevel(level : number, delta : number) : void {
		super.onLevel(level, delta);

		if (level < 1) {
			this.setSun(0);
		}
	}

	private checkSun() : void {
		if (!this.isSource()) {
			return;
		}

		if (game.controller().round() <= 1) {
			return;
		}

		const sun = game.world().hasSun();
		if (sun) {
			this.setSun(this._sun + this.level());
		}
	}

	private setSun(sun : number) : void {
		if (this._sun === sun) {
			return;
		}

		this.revertStats(this.getStatCache());
		this._sun = sun;
		this.applyStats(this.getStatCache());

		// TODO: also refresh scaling?
		this.entity().resetResource(StatType.HEALTH);

		if (this.entity().clientIdMatches() && this._sun > 0) {
			ui.showTooltip(TooltipType.SUNSHINE, {
				names: ["" + this._sun],
				ttl: 3000,
			});
		}
	}

}