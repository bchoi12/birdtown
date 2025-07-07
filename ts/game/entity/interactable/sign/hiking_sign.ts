
import { game } from 'game'
import { Entity, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Sign } from 'game/entity/interactable/sign'
import { TimeType } from 'game/system/api'

import { ui } from 'ui'
import { TooltipType } from 'ui/api'

export class HikingSign extends Sign {

	constructor(entityOptions : EntityOptions) {
		super(EntityType.HIKING_SIGN, entityOptions);
	}

	override tooltipType() : TooltipType { return game.world().getTime() === TimeType.NIGHT ? TooltipType.HIKING_NIGHT : TooltipType.HIKING_SWIM; }
}