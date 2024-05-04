
import { game } from 'game'
import { GameMode } from 'game/api'
import { EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Sign } from 'game/entity/sign'

import { UiMessage, UiMessageType } from 'message/ui_message'

import { ui } from 'ui'
import { TooltipType } from 'ui/api'

import { ChangeTracker } from 'util/change_tracker'

export class SignStartGame extends Sign {

	constructor(entityOptions : EntityOptions) {
		super(EntityType.SIGN_START_GAME, entityOptions);
	}

	override nameTagText() : string { return "Start Game"; }
	override tooltipType() : TooltipType { return TooltipType.START_GAME; }

	override interact() : void {
		super.interact();

		
	}
}