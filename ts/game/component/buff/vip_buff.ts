
import { game } from 'game'
import { GameObjectState } from 'game/api'
import { Buff, BuffOptions } from 'game/component/buff'
import { BuffType, StatType } from 'game/factory/api'

import { ui } from 'ui'
import { TooltipType } from 'ui/api'

export class VipBuff extends Buff {

	override boosts(level : number) : Map<StatType, number> {
		return new Map([
			[StatType.REVIVE_BOOST, 0.5 * level],
		]);
	}

	override onLevel(level : number, delta : number) : void {
		super.onLevel(level, delta);

		if (level === 0) {
			return;
		}

		if (this.entity().isLakituTarget()) {
			ui.showTooltip(TooltipType.VIP, {
				ttl: 5000,
			});
		}
	}
}