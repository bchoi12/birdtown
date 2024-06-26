
import { game } from 'game'
import { GameMode } from 'game/api'
import { Entity, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Sign } from 'game/entity/interactable/sign'

import { ui } from 'ui'
import { TooltipType } from 'ui/api'

export class SignControls extends Sign {

	constructor(entityOptions : EntityOptions) {
		super(EntityType.SIGN_CONTROLS, entityOptions);
	}

	override nameTagText() : string { return "Controls"; }
	override tooltipType() : TooltipType { return TooltipType.CONTROLS; }

	override interactWith(entity : Entity) : void {
		super.interactWith(entity);
	}
}