
import { game } from 'game'
import { GameMode } from 'game/api'
import { EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Sign } from 'game/entity/sign'

import { UiMessage, UiMessageType } from 'message/ui_message'

import { ui } from 'ui'
import { DialogType, TooltipType } from 'ui/api'

export class SignStartGame extends Sign {

	constructor(entityOptions : EntityOptions) {
		super(EntityType.SIGN_START_GAME, entityOptions);
	}

	override nameTagText() : string { return "Start Game"; }
	override tooltipType() : TooltipType { return TooltipType.START_GAME; }

	override interactable() : boolean { return this.isHost(); }
	override interact() : void {
		super.interact();

		let msg = new UiMessage(UiMessageType.DIALOG);
		msg.setDialogType(DialogType.START_GAME);
		ui.handleMessage(msg);
	}
}