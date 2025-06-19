
import { game } from 'game'
import { Entity, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Sign } from 'game/entity/interactable/sign'

import { ui } from 'ui'
import { DialogType, TooltipType } from 'ui/api'

export class RematchSign extends Sign {

	constructor(entityOptions : EntityOptions) {
		super(EntityType.REMATCH_SIGN, entityOptions);
	}

	override oscillateTime() : number { return 2000; }
	override nameTagText() : string { return "Rematch!"; }
	override tooltipType() : TooltipType { return TooltipType.REMATCH; }

	override interactWith(entity : Entity) : void {
		super.interactWith(entity);

		ui.pushDialog(DialogType.REMATCH);
	}
}