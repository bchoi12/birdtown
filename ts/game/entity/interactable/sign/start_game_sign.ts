
import { game } from 'game'
import { GameMode } from 'game/api'
import { Entity, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Sign } from 'game/entity/interactable/sign'

import { ui } from 'ui'
import { DialogType, TooltipType } from 'ui/api'

export class StartGameSign extends Sign {

	constructor(entityOptions : EntityOptions) {
		super(EntityType.START_GAME_SIGN, entityOptions);
	}

	override nameTagText() : string { return "Start Game"; }
	override tooltipType() : TooltipType { return TooltipType.START_GAME; }

	override interactWith(entity : Entity) : void {
		super.interactWith(entity);

		ui.pushDialog(DialogType.START_GAME);
	}
}